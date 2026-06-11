// ============================================================
// Firebase 配置文件
// 请访问 https://console.firebase.google.com/
// 1. 创建项目 → 2. 注册 Web 应用 → 3. 复制以下配置
// 4. 在 "Authentication" 中启用 "电子邮件/密码"
// 5. 在 "Firestore Database" 中创建数据库（测试模式）
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyA9pwUroZxUQZw48-aatY-LkRchs2RUZKI",
  authDomain: "pvz1-050903.firebaseapp.com",
  projectId: "pvz1-050903",
  storageBucket: "pvz1-050903.firebasestorage.app",
  messagingSenderId: "137319733934",
  appId: "1:137319733934:web:57b8c7e56e53ac9b75eb3f"
};

// 初始化 Firebase（如果配置未填写则跳过）
if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
  firebase.initializeApp(firebaseConfig);
  window.db = firebase.firestore();
  window.FIREBASE_READY = true;
} else {
  window.FIREBASE_READY = false;
  console.warn('[Firebase] 配置文件未填写，游戏将以离线模式运行。');
  console.warn('[Firebase] 请参考 https://console.firebase.google.com/ 配置 Firebase。');
}
