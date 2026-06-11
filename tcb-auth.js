/**
 * tcb-auth.js - 腾讯云开发 CloudBase 登录注册 & 排行榜系统
 * 替换原 auth.js（Firebase 版）和 av.js（LeanCloud 版）
 * 
 * 使用方法：
 * 1. 用微信扫码登录 https://console.cloud.tencent.com/tcb/env
 * 2. 创建环境（免费基础版），复制环境 ID
 * 3. 填入 tcb-config.js
 * 4. 在 CloudBase 控制台 → 数据库中，创建集合：
 *    - users（用户数据）
 *    - leaderboard（排行榜）
 */

// ========== 全局状态 ==========
window.PVZ_USER = null;       // 当前用户 { uid, username, email }
window.PVZ_STATS = {
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
    if (nameEl && window.PVZ_USER) nameEl.textContent = '👤 ' + (window.PVZ_USER.username || window.PVZ_USER.email);
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

// ========== TCB 登录/注册（匿名登录 + 自定义用户） ==========
// CloudBase Web 端使用匿名登录，用户名/密码存在 users 集合里

async function doLogin(email, password) {
  if (!window.TCB_READY) {
    showAuthError('CloudBase 未配置，请先配置 tcb-config.js');
    return;
  }
  try {
    // 先匿名登录获取 openid
    const authResult = await window.tcbApp.auth({ persistence: 'local' }).signInAnonymously();
    
    // 查询 users 集合验证账号
    const db = window.tcbApp.database();
    const _ = db.command;
    const res = await db.collection('users').where(_.and([
      { email: _.eq(email) },
      { password: _.eq(password) }
    ])).get();
    
    if (!res.data || res.data.length === 0) {
      showAuthError('邮箱或密码错误');
      return;
    }
    
    const userData = res.data[0];
    window.PVZ_USER = {
      uid: authResult.user.uid,
      id: userData._id,
      username: userData.username,
      email: userData.email
    };
    hideAuthScreen();
    showUserBar();
    await loadUserData();
    if (typeof showMainMenu === 'function') showMainMenu();
  } catch (e) {
    console.error('[TCB] Login error:', e);
    showAuthError(tcbFriendlyError(e));
  }
}

async function doRegister(username, email, password) {
  if (!window.TCB_READY) {
    showAuthError('CloudBase 未配置，请先配置 tcb-config.js');
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
    // 匿名登录
    await window.tcbApp.auth({ persistence: 'local' }).signInAnonymously();
    
    // 检查邮箱是否已注册
    const db = window.tcbApp.database();
    const _ = db.command;
    const existing = await db.collection('users').where({ email: _.eq(email) }).count();
    if (existing.total > 0) {
      showAuthError('该邮箱已被注册');
      return;
    }
    
    // 创建用户记录
    const now = new Date();
    await db.collection('users').add({
      data: {
        username: username.trim(),
        email: email,
        password: password,   // 生产环境应加密存储
        maxLevel: 1,
        totalPlayTime: 0,
        totalPlantsUsed: 0,
        totalPlantsDestroyed: 0,
        totalZombiesKilled: 0,
        totalGamesPlayed: 0,
        score: 0,
        createdAt: now,
        updatedAt: now
      }
    });
    
    // 设置当前用户
    window.PVZ_USER = {
      uid: (await window.tcbApp.auth({ persistence: 'local' }).getCurrentUser()).uid,
      username: username.trim(),
      email: email
    };
    
    hideAuthScreen();
    showUserBar();
    showAuthInfo('注册成功！');
    if (typeof showMainMenu === 'function') showMainMenu();
  } catch (e) {
    console.error('[TCB] Register error:', e);
    showAuthError(tcbFriendlyError(e));
  }
}

async function doLogout() {
  try {
    await window.tcbApp.auth({ persistence: 'local' }).signOut();
    window.PVZ_USER = null;
    hideUserBar();
    showAuthScreen();
  } catch (e) {
    console.error('Logout error:', e);
  }
}

function tcbFriendlyError(e) {
  const msg = (e.message || e || '').toString();
  if (msg.includes('network')) return '网络连接失败';
  if (msg.includes('quota') || msg.includes('limit')) return '请求次数超限，请稍后再试';
  if (msg.includes('permission')) return '权限不足';
  if (msg.includes('unauthorized')) return '未授权';
  return msg || '操作失败';
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
  if (!window.PVZ_USER || !window.TCB_READY) return null;
  try {
    const db = window.tcbApp.database();
    const _ = db.command;
    const res = await db.collection('users').where({ email: _.eq(window.PVZ_USER.email) }).get();
    if (res.data && res.data.length > 0) {
      const data = res.data[0];
      updateScoreDisplay(data.score || 0);
      return data;
    }
    return null;
  } catch (e) {
    console.error('loadUserData error:', e);
    return null;
  }
}

async function saveGameResult(level, timeSpent, plantsUsed, plantsDestroyed, zombiesKilled, isWin) {
  if (!window.PVZ_USER || !window.TCB_READY) return;
  
  const score = calculateScore(level, timeSpent, plantsUsed, plantsDestroyed, zombiesKilled, isWin);
  
  try {
    const db = window.tcbApp.database();
    const _ = db.command;
    const now = new Date();
    
    // 更新 users 集合
    const userRes = await db.collection('users').where({ email: _.eq(window.PVZ_USER.email) }).get();
    if (userRes.data && userRes.data.length > 0) {
      const oldData = userRes.data[0];
      const docId = oldData._id;
      const newScore = (oldData.score || 0) + score;
      const newMaxLevel = isWin && level > (oldData.maxLevel || 0) ? level : (oldData.maxLevel || 1);
      
      await db.collection('users').doc(docId).update({
        data: {
          totalPlayTime: _.inc(timeSpent),
          totalPlantsUsed: _.inc(plantsUsed),
          totalPlantsDestroyed: _.inc(plantsDestroyed),
          totalZombiesKilled: _.inc(zombiesKilled),
          totalGamesPlayed: _.inc(1),
          score: newScore,
          maxLevel: newMaxLevel,
          updatedAt: now
        }
      });
      
      // 更新 leaderboard 集合
      const lbRes = await db.collection('leaderboard').where({ userId: _.eq(window.PVZ_USER.uid) }).get();
      
      if (lbRes.data && lbRes.data.length > 0) {
        await db.collection('leaderboard').doc(lbRes.data[0]._id).update({
          data: {
            username: window.PVZ_USER.username || '匿名',
            score: newScore,
            maxLevel: newMaxLevel,
            totalGamesPlayed: _.inc(1),
            totalZombiesKilled: _.inc(zombiesKilled),
            updatedAt: now
          }
        });
      } else {
        await db.collection('leaderboard').add({
          data: {
            userId: window.PVZ_USER.uid,
            username: window.PVZ_USER.username || '匿名',
            score: newScore,
            maxLevel: newMaxLevel,
            totalGamesPlayed: 1,
            totalZombiesKilled: zombiesKilled,
            updatedAt: now
          }
        });
      }
      
      updateScoreDisplay(newScore);
      console.log('[PVZ] 成绩已保存，得分 +' + score);
      return score;
    }
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
  
  if (!window.TCB_READY) {
    list.innerHTML = '<p style="text-align:center;color:#f88;">CloudBase 未配置，排行榜不可用</p>';
    return;
  }
  
  try {
    const db = window.tcbApp.database();
    const res = await db.collection('leaderboard')
      .orderBy('score', 'desc')
      .limit(20)
      .get();
    
    if (!res.data || res.data.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:#aaa;">暂无排行榜数据</p>';
      return;
    }
    
    let html = `<table>
      <tr><th>#</th><th>玩家</th><th>关卡</th><th>得分</th></tr>`;
    
    res.data.forEach((data, i) => {
      const isMe = window.PVZ_USER && data.userId === window.PVZ_USER.uid;
      const rowClass = isMe ? ' class="my-rank"' : '';
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
      html += `<tr${rowClass}>
        <td>${medal}</td>
        <td>${escapeHtml(data.username || '匿名')}</td>
        <td>${data.maxLevel || 1}</td>
        <td><b>${data.score || 0}</b></td>
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
  if (!window.TCB_READY) {
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

  // CloudBase 已初始化，检查是否已有登录态
  if (window.TCB_READY) {
    // 尝试恢复匿名登录状态
    window.tcbApp.auth({ persistence: 'local' }).getLoginState()
      .then(loginState => {
        if (loginState) {
          // 有登录态，尝试从 localStorage 恢复用户信息
          const savedEmail = localStorage.getItem('pvz_user_email');
          if (savedEmail) {
            // 自动用保存的邮箱重新查询用户数据
            doLogin(savedEmail, '').catch(() => {
              // 密码不对就显示登录界面
              window.PVZ_USER = null;
              hideUserBar();
              showAuthScreen();
            });
          } else {
            showAuthScreen();
          }
        } else {
          showAuthScreen();
        }
      })
      .catch(() => {
        showAuthScreen();
      });
  } else {
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
