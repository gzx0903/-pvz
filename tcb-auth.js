/**
 * tcb-auth.js - 植物大战僵尸 - 登录注册 & 排行榜系统
 * 
 * v2: 通过 CloudBase HTTP 访问服务（云函数）调用后端，解决 CORS 问题
 * 保留离线模式（localStorage）作为后备
 * 
 * 部署步骤：
 * 1. CloudBase 控制台 → 云函数 → 新建云函数 pvz-api
 *    代码复制自 cloud-functions/pvz-api/index.js
 * 2. CloudBase 控制台 → HTTP 访问服务 → 新建路由
 *    路径: /api/*  →  云函数: pvz-api  →  开启路径透传
 * 3. 下方 API_BASE_URL 改为你的 HTTP 访问服务域名
 *    格式: https://<环境ID>.service.tcloudbase.com
 */

// ========== 配置 ==========
const API_BASE_URL = typeof TCB_API_URL !== 'undefined' ? TCB_API_URL 
  : 'https://pvz.game-d1gwxo09f3b66d06c.ap-shanghai.app.tcloudbase.com';

// ========== 全局状态 ==========
window.PVZ_USER = null;
window.PVZ_STATS = {
  level: 0, startTime: 0, plantsUsed: 0,
  plantsDestroyed: 0, zombiesKilled: 0
};
window.TCB_READY = false;
window.TCB_ONLINE = false; // 在线模式是否可用

// ========== HTTP 请求封装 ==========
async function apiPost(path, data) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

async function apiGet(path, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_BASE_URL}${path}${query ? '?' + query : ''}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

// ========== 初始化：检测在线模式 ==========
async function initCloudBase() {
  try {
    // 尝试访问 API 健康检查
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_BASE_URL}/api/leaderboard?limit=1`, {
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      window.TCB_ONLINE = true;
      window.TCB_READY = true;
      console.log('[TCB] 在线模式可用');
    } else {
      throw new Error('API not available');
    }
  } catch (e) {
    window.TCB_ONLINE = false;
    window.TCB_READY = true;
    console.log('[TCB] 在线模式不可用，使用离线模式:', e.message);
  }
}

// ========== 用户登录 ==========
async function doLogin(email, password) {
  if (window.TCB_ONLINE) {
    try {
      const result = await apiPost('/api/login', { email, password });
      if (result.success && result.user) {
        window.PVZ_USER = {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          maxLevel: result.user.maxLevel || 1,
          score: result.user.score || 0
        };
        localStorage.setItem('pvz_user_email', email);
        hideAuthScreen();
        showUserBar();
        updateScoreDisplay(result.user.score || 0);
        await showLeaderboard();
        if (typeof showMainMenu === 'function') showMainMenu();
        return;
      }
    } catch (e) {
      console.warn('[TCB] 在线登录失败，尝试离线:', e.message);
    }
  }
  // 离线模式
  offlineLogin(email, password);
}

function offlineLogin(email, password) {
  const users = JSON.parse(localStorage.getItem('pvz_users') || '[]');
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    showAuthError('邮箱或密码错误');
    return;
  }
  window.PVZ_USER = {
    email, username: user.username,
    maxLevel: user.maxLevel || 1, score: user.score || 0,
    _offline: true
  };
  localStorage.setItem('pvz_user_email', email);
  hideAuthScreen();
  showUserBar();
  updateScoreDisplay(user.score || 0);
  showLeaderboard();  // 离线模式也显示排行榜
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
  
  if (window.TCB_ONLINE) {
    try {
      const result = await apiPost('/api/register', { username, email, password });
      if (result.success) {
        showAuthInfo('注册成功！请登录');
        document.querySelectorAll('.auth-tab')[0].click();
        return;
      }
    } catch (e) {
      console.warn('[TCB] 在线注册失败，尝试离线:', e.message);
    }
  }
  // 离线模式
  offlineRegister(username, email, password);
}

function offlineRegister(username, email, password) {
  const users = JSON.parse(localStorage.getItem('pvz_users') || '[]');
  if (users.find(u => u.email === email)) {
    showAuthError('该邮箱已被注册');
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
  localStorage.removeItem('pvz_user_email');
  hideUserBar();
  showAuthScreen();
}

// ========== 保存游戏结果 ==========
async function saveGameResult(level, timeSpent, plantsUsed, plantsDestroyed, zombiesKilled, isWin) {
  if (!window.PVZ_USER) return;
  
  const score = calculateScore(level, timeSpent, plantsUsed, plantsDestroyed, zombiesKilled, isWin);
  
  if (window.TCB_ONLINE && !window.PVZ_USER._offline) {
    try {
      const result = await apiPost('/api/score', {
        email: window.PVZ_USER.email,
        level, timeSpent, plantsUsed, plantsDestroyed, zombiesKilled, isWin
      });
      if (result.success) {
        window.PVZ_USER.score = Math.max(window.PVZ_USER.score || 0, result.score);
        updateScoreDisplay(window.PVZ_USER.score);
        return result.score;
      }
    } catch (e) {
      console.warn('[TCB] 在线保存失败:', e.message);
    }
  }
  
  // 离线模式保存
  const users = JSON.parse(localStorage.getItem('pvz_users') || '[]');
  const idx = users.findIndex(u => u.email === window.PVZ_USER.email);
  if (idx >= 0) {
    users[idx].totalGamesPlayed = (users[idx].totalGamesPlayed || 0) + 1;
    users[idx].totalZombiesKilled = (users[idx].totalZombiesKilled || 0) + zombiesKilled;
    users[idx].totalPlantsUsed = (users[idx].totalPlantsUsed || 0) + plantsUsed;
    users[idx].totalPlantsDestroyed = (users[idx].totalPlantsDestroyed || 0) + plantsDestroyed;
    users[idx].totalPlayTime = (users[idx].totalPlayTime || 0) + timeSpent;
    users[idx].score = Math.max(users[idx].score || 0, score);
    if (isWin && level >= (users[idx].maxLevel || 0)) {
      users[idx].maxLevel = level + 1;
    }
    localStorage.setItem('pvz_users', JSON.stringify(users));
    window.PVZ_USER.score = users[idx].score;
    updateScoreDisplay(users[idx].score);
  }
  
  // 离线排行榜
  const lb = JSON.parse(localStorage.getItem('pvz_leaderboard') || '[]');
  lb.push({
    email: window.PVZ_USER.email,
    username: window.PVZ_USER.username,
    level, score, zombiesKilled, timeSpent,
    createdAt: new Date().toISOString()
  });
  localStorage.setItem('pvz_leaderboard', JSON.stringify(lb));
  
  return score;
}

function calculateScore(level, timeSpent, plantsUsed, plantsDestroyed, zombiesKilled, isWin) {
  if (!isWin) return 0;
  let score = level * 100 + (zombiesKilled || 0) * 10;
  if (plantsUsed > 0) score += Math.floor((1 - plantsDestroyed / plantsUsed) * 50);
  score += Math.max(0, 300 - Math.floor((timeSpent || 0) / 1000));
  return Math.max(0, score);
}

// ========== 排行榜 ==========
async function showLeaderboard() {
  let container = document.getElementById('leaderboard-body');
  if (!container) {
    // 创建排行榜modal
    container = document.createElement('div');
    container.id = 'leaderboard-body';
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:Arial,sans-serif;';
    container.innerHTML = `
      <div style="background:#2d5016;border-radius:12px;padding:20px;width:90%;max-width:600px;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
        <h2 style="text-align:center;color:#ffd700;margin-bottom:15px;">🏆 排行榜</h2>
        <table style="width:100%;border-collapse:collapse;color:#fff;font-size:14px;">
          <thead style="background:#1a3a08;">
            <tr><th style="padding:8px;">排名</th><th style="padding:8px;">玩家</th><th style="padding:8px;">分数</th><th style="padding:8px;">关卡</th><th style="padding:8px;">僵尸</th></tr>
          </thead>
          <tbody id="leaderboard-tbody"></tbody>
        </table>
        <button id="leaderboard-close" style="display:block;margin:15px auto 0;padding:8px 30px;background:#8fc43a;color:#1a3a08;border:none;border-radius:6px;font-size:14px;cursor:pointer;">关闭</button>
      </div>
    `;
    document.body.appendChild(container);
    document.getElementById('leaderboard-close').onclick = () => container.remove();
  }
  
  let entries = [];
  
  if (window.TCB_ONLINE) {
    try {
      const result = await apiGet('/api/leaderboard', { limit: 20 });
      if (result.success && result.leaderboard) {
        entries = result.leaderboard;
      }
    } catch (e) {
      console.warn('[TCB] 在线排行榜失败:', e.message);
    }
  }
  
  // 离线排行榜补充
  if (entries.length === 0) {
    const lb = JSON.parse(localStorage.getItem('pvz_leaderboard') || '[]');
    // 去重：每人最高分
    const best = {};
    lb.forEach(e => {
      if (!best[e.email] || e.score > best[e.email].score) best[e.email] = e;
    });
    entries = Object.values(best)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((e, i) => ({
        rank: i + 1,
        username: e.username || e.email,
        score: e.score,
        level: e.level,
        zombiesKilled: e.zombiesKilled || 0
      }));
  }
  
  container.innerHTML = entries.length === 0
    ? '<tr><td colspan="5" style="text-align:center;padding:20px">暂无数据</td></tr>'
    : entries.map(e => `
        <tr>
          <td>${e.rank}</td>
          <td>${e.username}</td>
          <td>${e.score}</td>
          <td>${e.level || '-'}</td>
          <td>${e.zombiesKilled || 0}</td>
        </tr>
      `).join('');
}

// ========== UI 函数 ==========
function showAuthScreen() {
  let overlay = document.getElementById('auth-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:10000;font-family:Arial,sans-serif;';
    overlay.innerHTML = getAuthHTML();
    document.body.appendChild(overlay);
    setupAuthEvents();
  }
  overlay.style.display = 'flex';
}

function hideAuthScreen() {
  const overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.style.display = 'none';
}

function getAuthHTML() {
  return `
    <div style="background:#2d5016;border-radius:12px;padding:30px;width:360px;max-width:90vw;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
      <h2 style="text-align:center;color:#8fc43a;margin-bottom:20px;">🌿 植物大战僵尸</h2>
      <div style="display:flex;margin-bottom:20px;border-bottom:2px solid #4a7a2a;">
        <div class="auth-tab" data-tab="login" style="flex:1;text-align:center;padding:10px;color:#8fc43a;border-bottom:2px solid #8fc43a;cursor:pointer;">登录</div>
        <div class="auth-tab" data-tab="register" style="flex:1;text-align:center;padding:10px;color:#aaa;cursor:pointer;">注册</div>
      </div>
      <div id="auth-error" style="color:#ff6b6b;font-size:13px;text-align:center;margin-bottom:10px;min-height:18px;"></div>
      <div id="auth-info" style="color:#8fc43a;font-size:13px;text-align:center;margin-bottom:10px;min-height:18px;"></div>
      <div id="auth-login-form">
        <input type="email" id="auth-email" placeholder="邮箱" style="width:100%;padding:10px;margin-bottom:12px;border-radius:6px;border:1px solid #4a7a2a;background:#1a3a08;color:#fff;font-size:14px;box-sizing:border-box;">
        <input type="password" id="auth-password" placeholder="密码" style="width:100%;padding:10px;margin-bottom:12px;border-radius:6px;border:1px solid #4a7a2a;background:#1a3a08;color:#fff;font-size:14px;box-sizing:border-box;">
        <button id="auth-login-btn" style="width:100%;padding:12px;background:#8fc43a;color:#1a3a08;border:none;border-radius:6px;font-size:16px;font-weight:bold;cursor:pointer;">登录</button>
      </div>
      <div id="auth-register-form" style="display:none;">
        <input type="text" id="auth-username" placeholder="用户名" style="width:100%;padding:10px;margin-bottom:12px;border-radius:6px;border:1px solid #4a7a2a;background:#1a3a08;color:#fff;font-size:14px;box-sizing:border-box;">
        <input type="email" id="auth-reg-email" placeholder="邮箱" style="width:100%;padding:10px;margin-bottom:12px;border-radius:6px;border:1px solid #4a7a2a;background:#1a3a08;color:#fff;font-size:14px;box-sizing:border-box;">
        <input type="password" id="auth-reg-password" placeholder="密码(至少6位)" style="width:100%;padding:10px;margin-bottom:12px;border-radius:6px;border:1px solid #4a7a2a;background:#1a3a08;color:#fff;font-size:14px;box-sizing:border-box;">
        <button id="auth-register-btn" style="width:100%;padding:12px;background:#8fc43a;color:#1a3a08;border:none;border-radius:6px;font-size:16px;font-weight:bold;cursor:pointer;">注册</button>
      </div>
      <div id="auth-status" style="text-align:center;margin-top:15px;font-size:12px;color:#888;">
        ${window.TCB_ONLINE ? '🟢 在线模式' : '🟡 离线模式(数据保存在本地)'}
      </div>
      <div style="text-align:center;margin-top:10px;">
        <button id="auth-skip-btn" style="background:none;border:none;color:#888;font-size:12px;cursor:pointer;text-decoration:underline;">跳过登录</button>
      </div>
    </div>
  `;
}

function setupAuthEvents() {
  // Tab 切换
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => {
        t.style.borderBottom = '2px solid transparent';
        t.style.color = '#aaa';
      });
      tab.style.borderBottom = '2px solid #8fc43a';
      tab.style.color = '#8fc43a';
      
      const isLogin = tab.dataset.tab === 'login';
      document.getElementById('auth-login-form').style.display = isLogin ? 'block' : 'none';
      document.getElementById('auth-register-form').style.display = isLogin ? 'none' : 'block';
      showAuthError('');
      showAuthInfo('');
    });
  });
  
  // 登录按钮
  document.getElementById('auth-login-btn').addEventListener('click', () => {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    if (!email || !password) { showAuthError('请输入邮箱和密码'); return; }
    doLogin(email, password);
  });
  
  // 注册按钮
  document.getElementById('auth-register-btn').addEventListener('click', () => {
    const username = document.getElementById('auth-username').value.trim();
    const email = document.getElementById('auth-reg-email').value.trim();
    const password = document.getElementById('auth-reg-password').value;
    doRegister(username, email, password);
  });
  
  // 跳过登录
  document.getElementById('auth-skip-btn').addEventListener('click', () => {
    hideAuthScreen();
    showUserBar();  // 显示游客栏
    if (typeof showMainMenu === 'function') showMainMenu();
  });
  
  // 回车提交
  document.getElementById('auth-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('auth-login-btn').click();
  });
  document.getElementById('auth-reg-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('auth-register-btn').click();
  });
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (el) el.textContent = msg;
}

function showAuthInfo(msg) {
  const el = document.getElementById('auth-info');
  if (el) el.textContent = msg;
}

function showUserBar() {
  let bar = document.getElementById('user-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'user-bar';
    bar.style.cssText = 'position:fixed;top:8px;right:8px;z-index:9999;background:rgba(0,0,0,0.7);padding:6px 14px;border-radius:8px;font-size:13px;color:#8fc43a;font-family:Arial,sans-serif;display:flex;gap:12px;align-items:center;';
    document.body.appendChild(bar);
  }
  // 游客状态
  if (!window.PVZ_USER) {
    bar.innerHTML = `<span>👤 游客</span><button onclick="showAuthScreen()" style="background:none;border:1px solid #8fc43a;color:#8fc43a;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:12px;">登录</button>`;
    bar.style.display = 'flex';
    return;
  }
  const mode = window.PVZ_USER._offline ? ' 🟡离线' : ' 🟢在线';
  bar.innerHTML = `
    <span>👤 ${window.PVZ_USER.username}${mode}</span>
    <span>🏆 <span id="user-score">${window.PVZ_USER.score || 0}</span></span>
    <button onclick="doLogout()" style="background:none;border:1px solid #8fc43a;color:#8fc43a;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:12px;">登出</button>
  `;
  bar.style.display = 'flex';
}

function hideUserBar() {
  const bar = document.getElementById('user-bar');
  if (bar) bar.style.display = 'none';
}

function updateScoreDisplay(score) {
  const el = document.getElementById('user-score');
  if (el) el.textContent = score;
}

// ========== 自动登录（记住我） ==========
async function autoLogin() {
  const savedEmail = localStorage.getItem('pvz_user_email');
  if (!savedEmail) return false;
  
  // 离线模式自动登录
  const users = JSON.parse(localStorage.getItem('pvz_users') || '[]');
  const user = users.find(u => u.email === savedEmail);
  if (user) {
    window.PVZ_USER = {
      email: savedEmail, username: user.username,
      maxLevel: user.maxLevel || 1, score: user.score || 0,
      _offline: !window.TCB_ONLINE
    };
    hideAuthScreen();
    showUserBar();
    updateScoreDisplay(user.score || 0);
    return true;
  }
  return false;
}

// ========== 启动入口 ==========
(async function() {
  await initCloudBase();
  
  // 尝试自动登录
  const autoLogged = await autoLogin();
  if (autoLogged) {
    if (typeof showMainMenu === 'function') showMainMenu();
  } else {
    showAuthScreen();
  }
})();
