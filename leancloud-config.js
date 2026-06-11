// ============================================================
// LeanCloud 配置文件（国内版）
// 注册地址：https://leancloud.cn/注册后获取
// 1. 登录 https://leancloud.cn/dashboard
// 2. 创建应用 → 进入应用 → 设置 → 应用凭证
// 3. 复制 AppID、AppKey、REST API 服务器地址填入下方
// ============================================================

const LEANCLOUD_APP_ID = 'YOUR_APP_ID';      // 替换为你的 AppID
const LEANCLOUD_APP_KEY = 'YOUR_APP_KEY';    // 替换为你的 AppKey
const LEANCLOUD_SERVER = 'https://YOUR_SERVER.leancloud.cn'; // 替换为你的服务器地址

// 初始化（如果配置未填写则跳过）
(function () {
  if (typeof AV === 'undefined') {
    console.warn('[LeanCloud] AV SDK 未加载，游戏将以离线模式运行。');
    window.LEAFCLOUD_READY = false;
    return;
  }
  if (LEANCLOUD_APP_ID === 'YOUR_APP_ID') {
    console.warn('[LeanCloud] 配置文件未填写，游戏将以离线模式运行。');
    window.LEAFCLOUD_READY = false;
    return;
  }
  AV.init({
    appId: LEANCLOUD_APP_ID,
    appKey: LEANCLOUD_APP_KEY,
    serverURL: LEANCLOUD_SERVER
  });
  window.LEAFCLOUD_READY = true;
  console.log('[LeanCloud] 初始化成功');
})();
