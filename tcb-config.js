
// ============================================================
// 腾讯云开发 CloudBase 配置文件
// 注册地址：https://console.cloud.tencent.com/tcb/env
// 1. 用微信扫码登录腾讯云控制台
// 2. 创建环境（免费基础版即可）
// 3. 复制环境ID填入下方
// ============================================================

const TCB_ENV_ID = 'pvz-game-d1gwxo09f3b66d06c';   // 腾讯云开发环境 ID

// 兼容性：SDK v2.x 暴露 window.cloudbase，代码使用 window.tcb
if (typeof window.cloudbase !== 'undefined' && typeof window.tcb === 'undefined') {
  window.tcb = window.cloudbase;
}

// 初始化
(function () {
  if (typeof window.tcb === 'undefined') {
    console.warn('[TCB] CloudBase SDK 未加载，游戏将以离线模式运行。');
    window.TCB_READY = false;
    return;
  }
  if (TCB_ENV_ID === 'YOUR_ENV_ID') {
    console.warn('[TCB] 配置文件未填写，游戏将以离线模式运行。');
    window.TCB_READY = false;
    return;
  }
  window.tcbApp = window.tcb.init({ env: TCB_ENV_ID });
  window.TCB_READY = true;
  console.log('[TCB] CloudBase 初始化成功，环境:', TCB_ENV_ID);
})();
