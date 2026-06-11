/**
 * av.js - LeanCloud 登录注册 & 排行榜系统
 * 替换原 auth.js（Firebase 版）
 * 
 * 使用方法：
 * 1. 注册 LeanCloud 账号：https://leancloud.cn/
 * 2. 创建应用 → 设置 → 应用凭证，复制 AppID / AppKey / REST API 服务器地址
 * 3. 填入 leancloud-config.js
 * 4. 在 数据存储 → 数据 中，创建 Class（如果不存在）：
 *    - _User（自动有，无需创建）
 *    - Leaderboard（字段：username, score, maxLevel, totalGamesPlayed, totalZombiesKilled, updatedAt）
 */

// ========== 全局状态 ==========
window.PVZ_USER = null;       // AV.User 当前用户
window.PVZ_STATS = {         // 当前游戏统计
  level: 0,
  startTime: 0,
  plantsUsed: 0,
  plantsDestroyed: 0,
  zombiesKilled: 0
};

// ========== 登录界面 ==========
function showAuthScreen() {
  const screen = document.getElementById('auth-screen');
  if (screen) screen.style.display = 'flex';
  const mm = document.getElementById('main-menu');
  if (mm) mm.style.display = 'none';
  const ub = document.getElementById('user-bar');
  if (ub) ub.style.display = 'none';
}

function hideAuthScreen() {
  const screen = document.getElementById('auth-screen');
  if (screen) screen.style.display = 'none';
}

// ========== 用户栏 ==========
function showUserBar() {
  const bar = document.getElementById('user-bar');
  if (bar) {
    bar.style.display = 'flex';
    const nameEl = document.getElementById('user-name');
    if (nameEl && window.PVZ_USER) {
      nameEl.textContent = '👤 ' + (window.PVZ_USER.get('username') || window.PVZ_USER.get('email'));
    }
  }
}

function hideUserBar() {
  const bar = document.getElementById('user-bar');
  if (bar) bar.style.display = 'none';
}

function updateScoreDisplay(score) {
  const el = document.getElementById('current-score');
  if (el) el.textContent = score || 0;
}

// ========== LeanCloud 登录/注册 ==========
async function doLogin(email, password) {
  if (!window.LEAFCLOUD_READY) {
    showAuthError('LeanCloud 未配置，请先配置 leancloud-config.js');
    return;
  }
  try {
    const user = await AV.User.logIn(email, password);
    window.PVZ_USER = user;
    hideAuthScreen();
    showUserBar();
    await loadUserData();
    if (typeof showMainMenu === 'function') showMainMenu();
  } catch (e) {
    showAuthError(friendlyError(e));
  }
}

async function doRegister(username, email, password) {
  if (!window.LEAFCLOUD_READY) {
    showAuthError('LeanCloud 未配置，请先配置 leancloud-config.js');
    return;
  }
  if (!username || username.trim().length < 2) {
    showAuthError('用户名至少2个字符');
    return;
  }
  if (password.length < 6) {
    showAuthError('密码至少6位');
    return;
  }
  try {
    const user = new AV.User();
    user.set('username', email);   // LeanCloud username 用 email
    user.set('password', password);
    user.set('email', email);
    user.set('nickname', username.trim()); // 昵称单独存
    await user.signUp();
    // 注册后自动登录
    const loggedInUser = await AV.User.logIn(email, password);
    window.PVZ_USER = loggedInUser;
    // 创建用户数据记录
    const userData = new AV.Object('UserData');
    userData.set('user', loggedInUser);
    userData.set('nickname', username.trim());
    userData.set('maxLevel', 1);
    userData.set('totalPlayTime', 0);
    userData.set('totalPlantsUsed', 0);
    userData.set('totalPlantsDestroyed', 0);
    userData.set('totalZombiesKilled', 0);
    userData.set('totalGamesPlayed', 0);
    userData.set('score', 0);
    await userData.save();
    hideAuthScreen();
    showUserBar();
    showAuthInfo('注册成功！');
    if (typeof showMainMenu === 'function') showMainMenu();
  } catch (e) {
    showAuthError(friendlyError(e));
  }
}

async function doLogout() {
  try {
    AV.User.logOut();
    window.PVZ_USER = null;
    hideUserBar();
    showAuthScreen();
  } catch (e) {
    console.error('Logout error:', e);
  }
}

function friendlyError(e) {
  const code = e.code;
  const map = {
    202: '用户名已存在（邮箱已被注册）',
    203: '邮箱已被注册',
    210: '用户名或密码错误',
    211: '用户不存在',
    218: '密码强度太弱',
    904: '网络连接失败，请检查网络',
  };
  return map[code] || (e.message || '操作失败');
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function showAuthInfo(msg) {
  const el = document.getElementById('auth-info');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

// ========== 用户数据操作 ==========
async function loadUserData() {
  if (!window.PVZ_USER || !window.LEAFCLOUD_READY) return null;
  try {
    const query = new AV.Query('UserData');
    query.equalTo('user', window.PVZ_USER);
    const data = await query.first();
    if (data) {
      updateScoreDisplay(data.get('score') || 0);
    }
    return data;
  } catch (e) {
    console.error('loadUserData error:', e);
    return null;
  }
}

async function saveGameResult(level, timeSpent, plantsUsed, plantsDestroyed, zombiesKilled, isWin) {
  if (!window.PVZ_USER || !window.LEAFCLOUD_READY) return;
  const score = calculateScore(level, timeSpent, plantsUsed, plantsDestroyed, zombiesKilled, isWin);
  try {
    // 查询已有用户数据
    const query = new AV.Query('UserData');
    query.equalTo('user', window.PVZ_USER);
    let userData = await query.first();
    if (!userData) {
      userData = new AV.Object('UserData');
      userData.set('user', window.PVZ_USER);
    }
    const oldScore = userData.get('score') || 0;
    const oldMaxLevel = userData.get('maxLevel') || 1;
    const oldPlayTime = userData.get('totalPlayTime') || 0;
    const oldPlantsUsed = userData.get('totalPlantsUsed') || 0;
    const oldPlantsDestroyed = userData.get('totalPlantsDestroyed') || 0;
    const oldZombiesKilled = userData.get('totalZombiesKilled') || 0;
    const oldGamesPlayed = userData.get('totalGamesPlayed') || 0;

    userData.set('totalPlayTime', oldPlayTime + timeSpent);
    userData.set('totalPlantsUsed', oldPlantsUsed + plantsUsed);
    userData.set('totalPlantsDestroyed', oldPlantsDestroyed + plantsDestroyed);
    userData.set('totalZombiesKilled', oldZombiesKilled + zombiesKilled);
    userData.set('totalGamesPlayed', oldGamesPlayed + 1);
    userData.set('score', oldScore + score);
    if (isWin && level > oldMaxLevel) {
      userData.set('maxLevel', level);
    }
    await userData.save();

    // 更新排行榜（独立 Class，方便查询）
    const lbQuery = new AV.Query('Leaderboard');
    lbQuery.equalTo('user', window.PVZ_USER);
    let lbData = await lbQuery.first();
    if (!lbData) {
      lbData = new AV.Object('Leaderboard');
      lbData.set('user', window.PVZ_USER);
    }
    lbData.set('nickname', window.PVZ_USER.get('nickname') || window.PVZ_USER.get('username') || '匿名');
    lbData.set('score', oldScore + score);
    lbData.set('maxLevel', Math.max(userData.get('maxLevel') || 1, oldMaxLevel));
    lbData.set('totalGamesPlayed', oldGamesPlayed + 1);
    lbData.set('totalZombiesKilled', oldZombiesKilled + zombiesKilled);
    await lbData.save();

    updateScoreDisplay(oldScore + score);
    console.log('[PVZ] 成绩已保存，得分 +' + score);
    return score;
  } catch (e) {
    console.error('saveGameResult error:', e);
  }
}

function calculateScore(level, timeSpent, plantsUsed, plantsDestroyed, zombiesKilled, isWin) {
  if (!isWin) return Math.floor(zombiesKilled * 5);
  let score = level * 100;
  score += zombiesKilled * 10;
  score += plantsUsed * 2;
  score -= plantsDestroyed * 5;
  const timeBonus = Math.max(0, 300 - timeSpent);
  score += timeBonus;
  score += 50;
  return Math.max(0, Math.floor(score));
}

// ========== 排行榜 ==========
async function showLeaderboard() {
  const overlay = document.getElementById('leaderboard-overlay');
  const list = document.getElementById('leaderboard-list');
  if (!overlay || !list) return;
  overlay.style.display = 'flex';
  list.innerHTML = '<p style="text-align:center;color:#aaa;">加载中...</p>';
  if (!window.LEAFCLOUD_READY) {
    list.innerHTML = '<p style="text-align:center;color:#f88;">LeanCloud 未配置，排行榜不可用</p>';
    return;
  }
  try {
    const query = new AV.Query('Leaderboard');
    query.descending('score');
    query.limit(20);
    const results = await query.find();
    if (!results || results.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:#aaa;">暂无排行榜数据</p>';
      return;
    }
    let html = `<table>
      <tr><th>#</th><th>玩家</th><th>关卡</th><th>得分</th></tr>`;
    results.forEach((obj, i) => {
      const data = obj.attributes;
      const isMe = window.PVZ_USER && obj.get('user')?.id === window.PVZ_USER.id;
      const rowClass = isMe ? ' class="my-rank"' : '';
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
      html += `<tr${rowClass}>
        <td>${medal}</td>
        <td>${escapeHtml(obj.get('nickname') || '匿名')}</td>
        <td>${obj.get('maxLevel') || 1}</td>
        <td><b>${obj.get('score') || 0}</b></td>
      </tr>`;
    });
    html += '</table>';
    list.innerHTML = html;
  } catch (e) {
    console.error('Leaderboard error:', e);
    list.innerHTML = '<p style="text-align:center;color:#f88;">加载失败</p>';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========== 游戏统计跟踪 ==========
function startGameStats(level) {
  window.PVZ_STATS = {
    level: level,
    startTime: Date.now(),
    plantsUsed: 0,
    plantsDestroyed: 0,
    zombiesKilled: 0
  };
}

function onPlantPlaced() {
  if (window.PVZ_STATS) window.PVZ_STATS.plantsUsed++;
}

function onPlantDestroyed() {
  if (window.PVZ_STATS) window.PVZ_STATS.plantsDestroyed++;
}

function onZombieKilled() {
  if (window.PVZ_STATS) window.PVZ_STATS.zombiesKilled++;
}

async function onLevelComplete(isWin) {
  if (!window.PVZ_STATS || !window.PVZ_USER) return;
  const timeSpent = Math.floor((Date.now() - window.PVZ_STATS.startTime) / 1000);
  await saveGameResult(
    window.PVZ_STATS.level,
    timeSpent,
    window.PVZ_STATS.plantsUsed,
    window.PVZ_STATS.plantsDestroyed,
    window.PVZ_STATS.zombiesKilled,
    isWin
  );
}

// ========== 游戏状态检查 ==========
function requireLogin(callback) {
  if (!window.LEAFCLOUD_READY) {
    callback();
    return;
  }
  if (window.PVZ_USER) {
    callback();
  } else {
    showAuthScreen();
  }
}

// ========== 全局挂载 ==========
window.isLoggedIn = () => !!window.PVZ_USER;
window.getUserData = loadUserData;
window.saveGameResult = saveGameResult;
window.showLeaderboard = showLeaderboard;
window.requireLogin = requireLogin;
window.startGameStats = startGameStats;
window.onPlantPlaced = onPlantPlaced;
window.onPlantDestroyed = onPlantDestroyed;
window.onZombieKilled = onZombieKilled;
window.onLevelComplete = onLevelComplete;

// ========== 初始化 ==========
function initAuth() {
  // Tab 切换
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isLogin = tab.dataset.tab === 'login';
      document.getElementById('auth-form-login').style.display = isLogin ? 'block' : 'none';
      document.getElementById('auth-form-register').style.display = isLogin ? 'none' : 'block';
      document.getElementById('auth-error').style.display = 'none';
    });
  });

  // 登录按钮
  document.getElementById('btn-login')?.addEventListener('click', () => {
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    if (!email || !password) { showAuthError('请填写邮箱和密码'); return; }
    document.getElementById('auth-error').style.display = 'none';
    doLogin(email, password);
  });

  // 注册按钮
  document.getElementById('btn-register')?.addEventListener('click', () => {
    const username = document.getElementById('reg-username')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim();
    const password = document.getElementById('reg-password')?.value;
    if (!username || !email || !password) { showAuthError('请填写所有字段'); return; }
    document.getElementById('auth-error').style.display = 'none';
    doRegister(username, email, password);
  });

  // 排行榜关闭
  document.getElementById('leaderboard-close')?.addEventListener('click', () => {
    document.getElementById('leaderboard-overlay').style.display = 'none';
  });
  document.getElementById('leaderboard-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'leaderboard-overlay') e.target.style.display = 'none';
  });

  // 顶部栏按钮
  document.getElementById('btn-leaderboard')?.addEventListener('click', showLeaderboard);
  document.getElementById('btn-logout')?.addEventListener('click', doLogout);

  // LeanCloud 已初始化，检查登录状态
  if (window.LEAFCLOUD_READY) {
    const currentUser = AV.User.current();
    if (currentUser) {
      window.PVZ_USER = currentUser;
      hideAuthScreen();
      showUserBar();
      loadUserData();
      if (typeof showMainMenu === 'function') showMainMenu();
      console.log('[PVZ] 已登录:', currentUser.get('username'));
    } else {
      window.PVZ_USER = null;
      hideUserBar();
      showAuthScreen();
    }
  } else {
    // 未配置，直接进入游戏（离线模式）
    hideAuthScreen();
    console.log('[PVZ] 离线模式，直接进入游戏');
  }
}

// DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}
