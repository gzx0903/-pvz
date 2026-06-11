/**
 * CloudBase 云函数 - PVZ 游戏后端 API
 * 
 * 部署方式：
 * 1. 在 CloudBase 控制台 → 云函数 → 新建云函数，名称：pvz-api
 * 2. 将此文件内容复制到云函数的 index.js 中
 * 3. 在 HTTP 访问服务中配置路由：/api/* → pvz-api
 * 4. 启用「路径透传」
 * 
 * API 路由：
 * POST /api/register   - 注册
 * POST /api/login      - 登录
 * POST /api/score      - 保存游戏分数
 * GET  /api/leaderboard - 获取排行榜
 * GET  /api/user       - 获取用户信息
 */

const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// CORS 头
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization'
};

exports.main = async (event, context) => {
  // 从 HTTP 触发获取路径和请求体
  const { path: requestPath, httpMethod, body, queryStringParameters } = event;
  
  // OPTIONS 预检
  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }
  
  let data = {};
  if (body) {
    try { data = JSON.parse(body); } catch(e) { data = {}; }
  }
  
  try {
    // 路由分发
    if (requestPath === '/api/register' && httpMethod === 'POST') {
      return await handleRegister(data);
    } else if (requestPath === '/api/login' && httpMethod === 'POST') {
      return await handleLogin(data);
    } else if (requestPath === '/api/score' && httpMethod === 'POST') {
      return await handleScore(data);
    } else if (requestPath === '/api/leaderboard' && httpMethod === 'GET') {
      return await handleLeaderboard(queryStringParameters);
    } else if (requestPath === '/api/user' && httpMethod === 'GET') {
      return await handleGetUser(queryStringParameters);
    } else {
      return jsonResponse(404, { error: 'Not Found' });
    }
  } catch (e) {
    console.error('Error:', e);
    return jsonResponse(500, { error: e.message });
  }
};

function jsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(data)
  };
}

// 注册
async function handleRegister(data) {
  const { username, email, password } = data;
  if (!username || username.trim().length < 2) {
    return jsonResponse(400, { error: '用户名至少2个字符' });
  }
  if (!email || !password || password.length < 6) {
    return jsonResponse(400, { error: '邮箱和密码不能为空，密码至少6位' });
  }
  
  // 检查邮箱是否已注册
  const existing = await db.collection('users')
    .where({ email })
    .count();
  if (existing.total > 0) {
    return jsonResponse(409, { error: '该邮箱已被注册' });
  }
  
  const now = new Date().toISOString();
  await db.collection('users').add({
    data: {
      username: username.trim(),
      email,
      password,  // 生产环境应加密
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
  
  return jsonResponse(200, { success: true, message: '注册成功' });
}

// 登录
async function handleLogin(data) {
  const { email, password } = data;
  if (!email || !password) {
    return jsonResponse(400, { error: '邮箱和密码不能为空' });
  }
  
  const result = await db.collection('users')
    .where({ email, password })
    .get();
  
  if (!result.data || result.data.length === 0) {
    return jsonResponse(401, { error: '邮箱或密码错误' });
  }
  
  const user = result.data[0];
  return jsonResponse(200, {
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      maxLevel: user.maxLevel || 1,
      score: user.score || 0
    }
  });
}

// 保存分数
async function handleScore(data) {
  const { email, level, timeSpent, plantsUsed, plantsDestroyed, zombiesKilled, isWin } = data;
  if (!email) {
    return jsonResponse(400, { error: '缺少 email' });
  }
  
  const score = calculateScore(level, timeSpent, plantsUsed, plantsDestroyed, zombiesKilled, isWin);
  
  // 更新用户数据
  const userResult = await db.collection('users').where({ email }).get();
  if (userResult.data && userResult.data.length > 0) {
    const user = userResult.data[0];
    const updateData = {
      updatedAt: new Date().toISOString(),
      totalGamesPlayed: (user.totalGamesPlayed || 0) + 1,
      totalPlantsUsed: (user.totalPlantsUsed || 0) + (plantsUsed || 0),
      totalPlantsDestroyed: (user.totalPlantsDestroyed || 0) + (plantsDestroyed || 0),
      totalZombiesKilled: (user.totalZombiesKilled || 0) + (zombiesKilled || 0),
      totalPlayTime: (user.totalPlayTime || 0) + (timeSpent || 0),
      score: Math.max(user.score || 0, score)
    };
    if (isWin && level >= (user.maxLevel || 0)) {
      updateData.maxLevel = level + 1;
    }
    await db.collection('users').doc(user._id).update({ data: updateData });
  }
  
  // 写入排行榜
  if (score > 0) {
    await db.collection('leaderboard').add({
      data: {
        email,
        level,
        score,
        zombiesKilled: zombiesKilled || 0,
        timeSpent: timeSpent || 0,
        createdAt: new Date().toISOString()
      }
    });
  }
  
  return jsonResponse(200, { success: true, score });
}

function calculateScore(level, timeSpent, plantsUsed, plantsDestroyed, zombiesKilled, isWin) {
  if (!isWin) return 0;
  let score = level * 100 + (zombiesKilled || 0) * 10;
  if (plantsUsed > 0) score += Math.floor((1 - plantsDestroyed / plantsUsed) * 50);
  score += Math.max(0, 300 - Math.floor((timeSpent || 0) / 1000)) ;
  return Math.max(0, score);
}

// 排行榜
async function handleLeaderboard(params) {
  const limit = Math.min(parseInt(params?.limit) || 20, 100);
  const result = await db.collection('leaderboard')
    .orderBy('score', 'desc')
    .limit(limit)
    .get();
  
  // 去重：每人只保留最高分
  const bestScores = {};
  for (const entry of (result.data || [])) {
    if (!bestScores[entry.email] || entry.score > bestScores[entry.email].score) {
      bestScores[entry.email] = entry;
    }
  }
  
  // 获取用户名
  const emails = Object.keys(bestScores);
  const usersResult = await db.collection('users')
    .where({ email: db.command.in(emails) })
    .get();
  const userMap = {};
  for (const u of (usersResult.data || [])) {
    userMap[u.email] = u.username;
  }
  
  const leaderboard = Object.values(bestScores)
    .sort((a, b) => b.score - a.score)
    .map((entry, i) => ({
      rank: i + 1,
      username: userMap[entry.email] || entry.email,
      score: entry.score,
      level: entry.level,
      zombiesKilled: entry.zombiesKilled || 0
    }));
  
  return jsonResponse(200, { success: true, leaderboard });
}

// 获取用户信息
async function handleGetUser(params) {
  const email = params?.email;
  if (!email) {
    return jsonResponse(400, { error: '缺少 email' });
  }
  
  const result = await db.collection('users').where({ email }).get();
  if (!result.data || result.data.length === 0) {
    return jsonResponse(404, { error: '用户不存在' });
  }
  
  const user = result.data[0];
  return jsonResponse(200, {
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      maxLevel: user.maxLevel || 1,
      score: user.score || 0,
      totalGamesPlayed: user.totalGamesPlayed || 0,
      totalZombiesKilled: user.totalZombiesKilled || 0
    }
  });
}
