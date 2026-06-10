/**
 * auth.js - Firebase 登录注册 & 排行榜系统
 * 
 * 使用方法：
 * 1. 在 Firebase Console 创建项目
 * 2. 启用 Authentication → 电子邮件/密码
 * 3. 创建 Firestore 数据库
 * 4. 复制 firebaseConfig 到 firebase-config.js
 */

// ========== 全局状态 ==========
window.PVZ_USER = null;       // Firebase 用户对象
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
  
  // 隐藏游戏主菜单（如果存在）
  const mm = document.getElementById('main-menu');
  if (mm) mm.style.display = 'none';
  
  // 隐藏用户栏
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
    if (nameEl && window.PVZ_USER) nameEl.textContent = '👤 ' + window.PVZ_USER.displayName;
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

// ========== Firebase 登录/注册 ==========
async function doLogin(email, password) {
  if (!window.FIREBASE_READY) {
    showAuthError('Firebase 未配置，请先配置 firebase-config.js');
    return;
  }
  try {
    const result = await firebase.auth().signInWithEmailAndPassword(email, password);
    window.PVZ_USER = result.user;
    hideAuthScreen();
    showUserBar();
    await loadUserData();
    // 登录成功后显示主菜单
    if (typeof showMainMenu === 'function') showMainMenu();
  } catch (e) {
    showAuthError(friendlyError(e.code));
  }
}

async function doRegister(username, email, password) {
  if (!window.FIREBASE_READY) {
    showAuthError('Firebase 未配置，请先配置 firebase-config.js');
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
    // 先创建用户
    const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
    // 设置显示名
    await result.user.updateProfile({ displayName: username.trim() });
    window.PVZ_USER = result.user;
    // 创建用户数据
    await window.db.collection('users').doc(result.user.uid).set({
      username: username.trim(),
      email: email,
      maxLevel: 1,
      totalPlayTime: 0,
      totalPlantsUsed: 0,
      totalPlantsDestroyed: 0,
      totalZombiesKilled: 0,
      totalGamesPlayed: 0,
      score: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    hideAuthScreen();
    showUserBar();
    showAuthInfo('注册成功！');
    // 注册成功后显示主菜单
    if (typeof showMainMenu === 'function') showMainMenu();
  } catch (e) {
    showAuthError(friendlyError(e.code));
  }
}

async function doLogout() {
  try {
    await firebase.auth().signOut();
    window.PVZ_USER = null;
    hideUserBar();
    showAuthScreen();
  } catch (e) {
    console.error('Logout error:', e);
  }
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found': '用户不存在',
    'auth/wrong-password': '密码错误',
    'auth/email-already-in-use': '该邮箱已被注册',
    'auth/invalid-email': '邮箱格式无效',
    'auth/weak-password': '密码强度太弱',
    'auth/invalid-credential': '邮箱或密码错误',
    'auth/too-many-requests': '尝试次数过多，请稍后再试',
    'auth/network-request-failed': '网络错误，请检查网络连接'
  };
  return map[code] || '操作失败: ' + code;
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
  if (!window.PVZ_USER || !window.FIREBASE_READY) return null;
  try {
    const doc = await window.db.collection('users').doc(window.PVZ_USER.uid).get();
    return doc.exists ? doc.data() : null;
  } catch (e) {
    console.error('loadUserData error:', e);
    return null;
  }
}

async function saveGameResult(level, timeSpent, plantsUsed, plantsDestroyed, zombiesKilled, isWin) {
  if (!window.PVZ_USER || !window.FIREBASE_READY) return;
  
  // 计算得分
  const score = calculateScore(level, timeSpent, plantsUsed, plantsDestroyed, zombiesKilled, isWin);
  
  try {
    const userRef = window.db.collection('users').doc(window.PVZ_USER.uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};
    
    const updates = {
      totalPlayTime: (userData.totalPlayTime || 0) + timeSpent,
      totalPlantsUsed: (userData.totalPlantsUsed || 0) + plantsUsed,
      totalPlantsDestroyed: (userData.totalPlantsDestroyed || 0) + plantsDestroyed,
      totalZombiesKilled: (userData.totalZombiesKilled || 0) + zombiesKilled,
      totalGamesPlayed: (userData.totalGamesPlayed || 0) + 1,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // 如果胜利且通关新关卡
    if (isWin && level > (userData.maxLevel || 0)) {
      updates.maxLevel = level;
    }
    
    // 累加得分
    updates.score = (userData.score || 0) + score;
    
    await userRef.update(updates);
    
    // 更新排行榜（使用uid作为文档id）
    await window.db.collection('leaderboard').doc(window.PVZ_USER.uid).set({
      username: window.PVZ_USER.displayName || '匿名',
      score: updates.score,
      maxLevel: Math.max(updates.maxLevel || 1, userData.maxLevel || 1),
      totalGamesPlayed: updates.totalGamesPlayed,
      totalZombiesKilled: updates.totalZombiesKilled,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    updateScoreDisplay(updates.score);
    console.log('[PVZ] 成绩已保存，得分 +' + score);
    return score;
  } catch (e) {
    console.error('saveGameResult error:', e);
  }
}

function calculateScore(level, timeSpent, plantsUsed, plantsDestroyed, zombiesKilled, isWin) {
  if (!isWin) return Math.floor(zombiesKilled * 5); // 输了也给击杀分
  
  // 基础分：关卡 * 100
  let score = level * 100;
  // 击杀奖励：每只僵尸 10 分
  score += zombiesKilled * 10;
  // 植物使用奖励：每棵 +2
  score += plantsUsed * 2;
  // 植物被毁惩罚：每棵 -5
  score -= plantsDestroyed * 5;
  // 时间奖励：300秒内每快1秒 +1分
  const timeBonus = Math.max(0, 300 - timeSpent);
  score += timeBonus;
  // 通关奖励
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
  
  if (!window.FIREBASE_READY) {
    list.innerHTML = '<p style="text-align:center;color:#f88;">Firebase 未配置，排行榜不可用</p>';
    return;
  }
  
  try {
    const snapshot = await window.db.collection('leaderboard')
      .orderBy('score', 'desc')
      .limit(20)
      .get();
    
    if (snapshot.empty) {
      list.innerHTML = '<p style="text-align:center;color:#aaa;">暂无排行榜数据</p>';
      return;
    }
    
    let html = `<table>
      <tr><th>#</th><th>玩家</th><th>关卡</th><th>得分</th></tr>`;
    
    snapshot.forEach((doc, i) => {
      const data = doc.data();
      const isMe = window.PVZ_USER && doc.id === window.PVZ_USER.uid;
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
  if (!window.FIREBASE_READY) {
    // Firebase 未配置，直接允许游戏
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
  // 登录表单切换
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
  
  // 排行榜关闭按钮
  document.getElementById('leaderboard-close')?.addEventListener('click', () => {
    document.getElementById('leaderboard-overlay').style.display = 'none';
  });
  
  // 点击背景关闭排行榜
  document.getElementById('leaderboard-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'leaderboard-overlay') {
      e.target.style.display = 'none';
    }
  });
  
  // 顶部栏排行榜按钮
  document.getElementById('btn-leaderboard')?.addEventListener('click', showLeaderboard);
  
  // 顶部栏退出按钮
  document.getElementById('btn-logout')?.addEventListener('click', doLogout);
  
  // Firebase 未配置时显示提示
  if (!window.FIREBASE_READY) {
    console.warn('[PVZ] Firebase 未配置，将以离线模式运行。');
    console.warn('[PVZ] 请配置 firebase-config.js 以启用登录和排行榜功能。');
  }
  
  // Firebase Auth 状态监听
  if (window.FIREBASE_READY) {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        window.PVZ_USER = user;
        hideAuthScreen();
        showUserBar();
        await loadUserData();
        // 确保主菜单显示
        if (typeof showMainMenu === 'function') {
          // 检查主菜单是否已存在，不存在则创建
          if (!document.getElementById('main-menu')) {
            showMainMenu();
          }
        }
        console.log('[PVZ] 已登录:', user.email);
      } else {
        window.PVZ_USER = null;
        hideUserBar();
        showAuthScreen();
      }
    });
  } else {
    // Firebase 未配置，直接进入游戏（离线模式）
    hideAuthScreen();
    console.log('[PVZ] 离线模式，直接进入游戏');
  }
}

// ========== 游戏集成：重写关键函数 ==========
function patchGameFunctions() {
  if (typeof showMainMenu === 'function') {
    const originalShowMainMenu = showMainMenu;
    window._originalShowMainMenu = originalShowMainMenu;
  }
}

// DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    patchGameFunctions();
  });
} else {
  initAuth();
  patchGameFunctions();
}
