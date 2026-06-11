/**
 * tcb-auth.js - 植物大战僵尸 - 登录注册 & 排行榜系统
 * 
 * 使用纯 fetch() 调用 CloudBase REST API，不依赖任何 SDK
 * 
 * 使用方法：
 * 1. 在 https://console.cloud.tencent.com/tcb/env 的「数据库」标签页
 *    创建两个集合：users、leaderboard
 * 2. 两个集合的权限都改为「所有用户可读，管理员可写」
 *    （控制台 → 权限管理 → 切换到「安全规则」→ 选择「自定义安全规则」→ 输入以下规则）
 * 
 * users 集合规则：
 * {
 *   "read": true,
 *   "write": "doc._openid == auth.uid"
 * }
 * 
 * leaderboard 集合规则：
 * {
 *   "read": true,
 *   "write": "doc._openid == auth.uid"
 * }
 * 
 * 3. 在控制台 → 环境设置 → 环境 ID，记下你的环境 ID（已在 tcb-config.js 中配置）
 */

// ========== 配置 ==========
const TCB_API = 'https://tcb-api.tencentcloudapi.com/web';
const TCB_AUTH_API = 'https://tcb-auth.tencentcloudapi.com';
const TCB_ENV_ID = typeof TCB_ENV_ID !== 'undefined' ? TCB_ENV_ID : 'pvz-game-d1gwxo09f3b66d06c';

// ========== 全局状态 ==========
window.PVZ_USER = null;
window.PVZ_STATS = {
  level: 0, startTime: 0, plantsUsed: 0,
  plantsDestroyed: 0, zombiesKilled: 0
};
window.TCB_READY = false;
window.TCB_ACCESS_TOKEN = null;

// ========== CloudBase REST API 调用 ==========
async function tcbCall(query, limit = 100) {
  if (!window.TCB_ACCESS_TOKEN) throw new Error('未登录');
  const url = `${TCB_API}?env=${TCB_ENV_ID}&offset=0&limit=${limit}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': window.TCB_ACCESS_TOKEN
    },
    body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error(`API 错误: ${res.status}`);
  return await res.json();
}

// 生成 UUID（匿名登录用）
function genUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// 获取设备 ID（持久化）
function getDeviceId() {
  let id = localStorage.getItem('pvz_device_id');
  if (!id) {
    id = genUUID();
    localStorage.setItem('pvz_device_id', id);
  }
  return id;
}

// ========== 匿名登录（获取 Access Token） ==========
async function tcbAnonymousSignIn() {
  try {
    const deviceId = getDeviceId();
    // CloudBase 匿名登录 API
    const res = await fetch(`${TCB_AUTH_API}?Version=2018-06-08`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Action: 'AnonymousSignIn',
        EnvId: TCB_ENV_ID,
        DeviceId: deviceId
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    // 提取 access token（具体格式看实际返回）
    return data.access_token || data.AccessToken || data.accessToken || null;
  } catch (e) {
    console.warn('[TCB] 匿名登录失败:', e);
    return null;
  }
}

// ========== 用户登录 ==========
async function doLogin(email, password) {
  try {
    const result = await tcbCall(
      `db.collection('users').where({email:'${email}',password:'${password}'}).get()`
    );
    const list = result.data || [];
    if (!list || list.length === 0) {
      showAuthError('邮箱或密码错误');
      return;
    }
    const userData = list[0];
    window.PVZ_USER = {
      id: userData._id,
      email: email,
      username: userData.username,
      maxLevel: userData.maxLevel || 1,
      score: userData.score || 0
    };
    localStorage.setItem('pvz_user_email', email);
    hideAuthScreen();
    showUserBar();
    updateScoreDisplay(userData.score || 0);
    await showLeaderboard();
    if (typeof showMainMenu === 'function') showMainMenu();
  } catch (e) {
    console.error('[TCB] Login error:', e);
    // 如果是离线状态，降级到本地模式
    if (!window.TCB_ACCESS_TOKEN) {
      offlineLogin(email, password);
    } else {
      showAuthError('登录失败，请检查网络后重试');
    }
  }
}

// 离线模式登录（基于 localStorage）
function offlineLogin(email, password) {
  const users = JSON.parse(localStorage.getItem('pvz_users') || '[]');
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    showAuthError('邮箱或密码错误（离线模式）');
    return;
  }
  window.PVZ_USER = {
    email: email,
    username: user.username,
    maxLevel: user.maxLevel || 1,
    score: user.score || 0,
    _offline: true
  };
  localStorage.setItem('pvz_user_email', email);
  hideAuthScreen();
  showUserBar();
  updateScoreDisplay(user.score || 0);
  if (typeof showMainMenu === 'function') showMainMenu();
}

// ========== 用户注册 ==========
async function doRegister(username, email, password) {
  if (!username || username.trim().length < 2) {
    showAuthError('用户名至少2个字符');
    return;
  }
  if (password.length < 6) {
    showAuthError('密码至少6位');
    return;
  }
  try {
    // 检查邮箱是否已注册
    const result = await tcbCall(
      `db.collection('users').where({email:'${email}'}).count()`
    );
    if ((result.total || 0) > 0) {
      showAuthError('该邮箱已被注册');
      return;
    }
    // 创建用户记录
    const now = new Date().toISOString();
    await tcbCall(
      `db.collection('users').add({data:{username:'${username.trim()}',email:'${email}',password:'${password}',maxLevel:1,totalPlayTime:0,totalPlantsUsed:0,totalPlantsDestroyed:0,totalZombiesKilled:0,totalGamesPlayed:0,score:0,createdAt:'${now}',updatedAt:'${now}'}})`
    );
    showAuthInfo('注册成功！请登录');
    // 切换到登录表单
    document.querySelectorAll('.auth-tab')[0].click();
  } catch (e) {
    console.error('[TCB] Register error:', e);
    if (!window.TCB_ACCESS_TOKEN) {
      offlineRegister(username, email, password);
    } else {
      showAuthError('注册失败，请检查网络后重试');
    }
  }
}

// 离线模式注册
function offlineRegister(username, email, password) {
  const users = JSON.parse(localStorage.getItem('pvz_users') || '[]');
  if (users.find(u => u.email === email)) {
    showAuthError('该邮箱已被注册（离线模式）');
    return;
  }
  const newUser = {
    username: username.trim(), email, password,
    maxLevel: 1, totalPlayTime: 0, score: 0,
    totalPlantsUsed: 0, totalPlantsDestroyed: 0, totalZombiesKilled: 0, totalGamesPlayed: 0
  };
  users.push(newUser);
  localStorage.setItem('pvz_users', JSON.stringify(users));
  showAuthInfo('注册成功！请登录');
  document.querySelectorAll('.auth-tab')[0].click();
}

// ========== 登出 ==========
async function doLogout() {
  window.PVZ_USER = null;
  window.TCB_ACCESS_TOKEN = null;
  localStorage.removeItem('pvz_user_email');
  hideUserBar();
  showAuthScreen();
}

// ========== 用户数据操作 ==========
async function loadUserData() {
  if (!window.PVZ_USER) return null;
  if (window.PVZ_USER._offline) return window.PVZ_USER;
  try {
    const result = await tcbCall(
      `db.collection('users').where({email:'${window.PVZ_USER.email}'}).get()`
    );
    if (result.data && result.data.length > 0) {
      const d = result.data[0];
      window.PVZ_USER.score = d.score || 0;
      window.PVZ_USER.maxLevel = d.maxLevel || 1;
      updateScoreDisplay(d.score || 0);
      return d;
    }
  } catch (e) {
    console.warn('[TCB] loadUserData error:', e);
  }
  return null;
}

// ========== 保存游戏结果 ==========
async function saveGameResult(level, timeSpent, plantsUsed, plantsDestroyed, zombiesKilled, isWin) {
  const score = calculateScore(level, timeSpent, plantsUsed, plantsDestroyed, zombiesKilled, isWin);
  if (!window.PVZ_USER) return;
  if (window.PVZ_USER._offline) {
    // 离线模式：保存到 localStorage
    const users = JSON.parse(localStorage.getItem('pvz_users') || '[]');
    const idx = users.findIndex(u => u.email === window.PVZ_USER.email);
    if (idx >= 0) {
      users[idx].score = (users[idx].score || 0) + score;
      users[idx].totalPlayTime = (users[idx].totalPlayTime || 0) + timeSpent;
      users[idx].totalPlantsUsed = (users[idx].totalPlantsUsed || 0) + plantsUsed;
      users[idx].totalPlantsDestroyed = (users[idx].totalPlantsDestroyed || 0) + plantsDestroyed;
      users[idx].totalZombiesKilled = (users[idx].totalZombiesKilled || 0) + zombiesKilled;
      users[idx].totalGamesPlayed = (users[idx].totalGamesPlayed || 0) + 1;
      if (isWin && level > (users[idx].maxLevel || 1)) users[idx].maxLevel = level;
      window.PVZ_USER.score = users[idx].score;
      localStorage.setItem('pvz_users', JSON.stringify(users));
      updateScoreDisplay(users[idx].score);
    }
    console.log('[PVZ] 成绩已保存(离线)，得分 +' + score);
    return;
  }
  try {
    const now = new Date().toISOString();
    // 查询当前用户数据
    const result = await tcbCall(
      `db.collection('users').where({email:'${window.PVZ_USER.email}'}).get()`
    );
    if (!result.data || result.data.length === 0) return;
    const oldData = result.data[0];
    const newScore = (oldData.score || 0) + score;
    const newMaxLevel = isWin && level > (oldData.maxLevel || 0) ? level : (oldData.maxLevel || 1);
    const newTotalPlayTime = (oldData.totalPlayTime || 0) + timeSpent;
    const newTotalPlantsUsed = (oldData.totalPlantsUsed || 0) + plantsUsed;
    const newTotalPlantsDestroyed = (oldData.totalPlantsDestroyed || 0) + plantsDestroyed;
    const newTotalZombiesKilled = (oldData.totalZombiesKilled || 0) + zombiesKilled;
    const newTotalGamesPlayed = (oldData.totalGamesPlayed || 0) + 1;
    const docId = oldData._id;
    // 更新 users 集合
    await tcbCall(
      `db.collection('users').doc('${docId}').update({data:{score:${newScore},maxLevel:${newMaxLevel},totalPlayTime:${newTotalPlayTime},totalPlantsUsed:${newTotalPlantsUsed},totalPlantsDestroyed:${newTotalPlantsDestroyed},totalZombiesKilled:${newTotalZombiesKilled},totalGamesPlayed:${newTotalGamesPlayed},updatedAt:'${now}'}})`
    );
    // 更新或创建 leaderboard 记录
    const lbResult = await tcbCall(
      `db.collection('leaderboard').where({email:'${window.PVZ_USER.email}'}).get()`
    );
    if (lbResult.data && lbResult.data.length > 0) {
      await tcbCall(
        `db.collection('leaderboard').doc('${lbResult.data[0]._id}').update({data:{username:'${window.PVZ_USER.username}',score:${newScore},maxLevel:${newMaxLevel},totalZombiesKilled:${newTotalZombiesKilled},updatedAt:'${now}'}})`
      );
    } else {
      await tcbCall(
        `db.collection('leaderboard').add({data:{email:'${window.PVZ_USER.email}',username:'${window.PVZ_USER.username}',score:${newScore},maxLevel:${newMaxLevel},totalZombiesKilled:${newTotalZombiesKilled},updatedAt:'${now}'}})`
      );
    }
    window.PVZ_USER.score = newScore;
    updateScoreDisplay(newScore);
    console.log('[PVZ] 成绩已保存，得分 +' + score);
  } catch (e) {
    console.error('[PVZ] saveGameResult error:', e);
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
  
  if (!window.TCB_ACCESS_TOKEN && !window.PVZ_USER) {
    list.innerHTML = '<p style="text-align:center;color:#f88;">请先登录后查看排行榜</p>';
    return;
  }
  
  // 优先从 leaderboard 集合读取，否则从 users 集合读取
  try {
    let data = null;
    if (window.TCB_ACCESS_TOKEN) {
      const result = await tcbCall(
        `db.collection('leaderboard').orderBy('score','desc').limit(20).get()`
      );
      data = result.data || [];
    }
    if (!data || data.length === 0) {
      // 降级：从本地 users 读取
      if (window.PVZ_USER && window.PVZ_USER._offline) {
        const users = JSON.parse(localStorage.getItem('pvz_users') || '[]');
        data = users.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 20);
      } else if (!window.TCB_ACCESS_TOKEN) {
        const users = JSON.parse(localStorage.getItem('pvz_users') || '[]');
        data = users.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 20);
      }
    }
    if (!data || data.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:#aaa;">暂无排行榜数据</p>';
      return;
    }
    let html = `<table><tr><th>#</th><th>玩家</th><th>关卡</th><th>得分</th></tr>`;
    data.forEach((d, i) => {
      const isMe = window.PVZ_USER && d.email === window.PVZ_USER.email;
      const rowClass = isMe ? ' class="my-rank"' : '';
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
      const name = d.username || d.email || '匿名';
      html += `<tr${rowClass}><td>${medal}</td><td>${escapeHtml(name)}</td><td>${d.maxLevel || 1}</td><td><b>${d.score || 0}</b></td></tr>`;
    });
    html += '</table>';
    list.innerHTML = html;
  } catch (e) {
    console.error('Leaderboard error:', e);
    list.innerHTML = '<p style="text-align:center;color:#f88;">加载失败（离线模式）</p>';
    // 离线模式降级
    try {
      const users = JSON.parse(localStorage.getItem('pvz_users') || '[]');
      const data = users.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 20);
      if (data.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#aaa;">暂无数据</p>';
        return;
      }
      let html = `<table><tr><th>#</th><th>玩家</th><th>关卡</th><th>得分</th></tr>`;
      data.forEach((d, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
        html += `<tr><td>${medal}</td><td>${escapeHtml(d.username || d.email)}</td><td>${d.maxLevel || 1}</td><td><b>${d.score || 0}</b></td></tr>`;
      });
      html += '</table>';
      list.innerHTML = html;
    } catch (e2) {
      list.innerHTML = '<p style="text-align:center;color:#f88;">加载失败</p>';
    }
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

// ========== 游戏统计跟踪 ==========
function startGameStats(level) {
  window.PVZ_STATS = { level, startTime: Date.now(), plantsUsed: 0, plantsDestroyed: 0, zombiesKilled: 0 };
}
function onPlantPlaced() { if (window.PVZ_STATS) window.PVZ_STATS.plantsUsed++; }
function onPlantDestroyed() { if (window.PVZ_STATS) window.PVZ_STATS.plantsDestroyed++; }
function onZombieKilled() { if (window.PVZ_STATS) window.PVZ_STATS.zombiesKilled++; }

async function onLevelComplete(isWin) {
  if (!window.PVZ_STATS) return;
  const timeSpent = Math.floor((Date.now() - window.PVZ_STATS.startTime) / 1000);
  await saveGameResult(window.PVZ_STATS.level, timeSpent, window.PVZ_STATS.plantsUsed,
    window.PVZ_STATS.plantsDestroyed, window.PVZ_STATS.zombiesKilled, isWin);
}

// ========== UI 函数 ==========
function showAuthScreen() {
  const screen = document.getElementById('auth-screen');
  if (screen) screen.style.display = 'flex';
  const mm = document.getElementById('main-menu');
  if (mm) mm.style.display = 'none';
}

function hideAuthScreen() {
  const screen = document.getElementById('auth-screen');
  if (screen) screen.style.display = 'none';
}

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

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
  setTimeout(() => { if (el) el.style.display = 'none'; }, 4000);
}

function showAuthInfo(msg) {
  const el = document.getElementById('auth-info');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
  setTimeout(() => { if (el) el.style.display = 'none'; }, 4000);
}

function requireLogin(callback) {
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
async function initAuth() {
  // Tab 切换
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isLogin = tab.dataset.tab === 'login';
      const loginForm = document.getElementById('auth-form-login');
      const regForm = document.getElementById('auth-form-register');
      if (loginForm) loginForm.style.display = isLogin ? 'block' : 'none';
      if (regForm) regForm.style.display = isLogin ? 'none' : 'block';
      const errEl = document.getElementById('auth-error');
      if (errEl) errEl.style.display = 'none';
    });
  });

  // 登录按钮
  document.getElementById('btn-login')?.addEventListener('click', () => {
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    if (!email || !password) { showAuthError('请填写邮箱和密码'); return; }
    doLogin(email, password);
  });

  // 注册按钮
  document.getElementById('btn-register')?.addEventListener('click', () => {
    const username = document.getElementById('reg-username')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim();
    const password = document.getElementById('reg-password')?.value;
    if (!username || !email || !password) { showAuthError('请填写所有字段'); return; }
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

  // 尝试匿名登录获取 Access Token
  console.log('[TCB] 尝试连接 CloudBase...');
  const token = await tcbAnonymousSignIn();
  if (token) {
    window.TCB_ACCESS_TOKEN = token;
    window.TCB_READY = true;
    console.log('[TCB] CloudBase 连接成功');
    // 尝试自动登录（如果之前登录过）
    const savedEmail = localStorage.getItem('pvz_user_email');
    if (savedEmail) {
      await doLogin(savedEmail, '___dummy___');
      // 如果因为密码不对失败（离线模式），静默切换到登录界面
      if (!window.PVZ_USER) {
        showAuthScreen();
      }
    } else {
      showAuthScreen();
    }
  } else {
    console.warn('[TCB] CloudBase 连接失败，将以离线模式运行');
    window.TCB_READY = false;
    // 离线模式：尝试恢复本地登录
    const savedEmail = localStorage.getItem('pvz_user_email');
    if (savedEmail) {
      offlineLogin(savedEmail, '');
    } else {
      showAuthScreen();
    }
  }
}

// DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}
