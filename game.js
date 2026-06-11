// ========== BGM系统 ==========
const BGM_FILES = ['bgm/bgm.MP3', 'bgm/bgm2.mp3', 'bgm/bgm3.mp3'];
let bgmPlayer = null;
let bgmInitialized = false;

function initBGM() {
  if (bgmInitialized) return;
  bgmInitialized = true;
  
  bgmPlayer = new Audio();
  bgmPlayer.loop = true;
  bgmPlayer.volume = 0.3; // 默认音量30%
  
  // 随机选择一首bgm
  const randomIndex = Math.floor(Math.random() * BGM_FILES.length);
  bgmPlayer.src = BGM_FILES[randomIndex];
  
  console.log(`BGM初始�? ${BGM_FILES[randomIndex]}`);
}

function playBGM() {
  if (!bgmPlayer) initBGM();
  
  bgmPlayer.play().catch(e => {
    console.log('BGM自动播放被阻止，需要用户交�?);
  });
}

function pauseBGM() {
  if (bgmPlayer) {
    bgmPlayer.pause();
  }
}

function setBGMVolume(volume) {
  if (bgmPlayer) {
    bgmPlayer.volume = Math.max(0, Math.min(1, volume));
  }
}

// ========== 游戏配置 ==========
const CONFIG = {
  ROWS: 5,                // 5�?  COLS: 9,                // 9�?  CELL_SIZE: 70,           // 格子大小
  SUN_VALUE: 100,          // 阳光初始值（提升开局体验�?  SUN_PER_CLICK: 25,       // 点击阳光获得25
  PLANT_COST: {            // 植物价格
    sunflower: 50,
    peashooter: 100,
    wallnut: 50,
    snowpea: 175,
    cherrybomb: 150,
    potatomine: 25,
    jalapeno: 125,
    chomper: 150,
    repeater: 200
  },
  PLANT_COOLDOWN: {
    sunflower: 3000,       // 3秒（快速补种经济核心）
    peashooter: 5000,      // 5�?    wallnut: 35000,        // 35秒（高血量防御）
    snowpea: 7500,         // 7.5�?    cherrybomb: 30000,     // 30�?    potatomine: 10000,     // 10�?    jalapeno: 20000,       // 20�?    chomper: 12000,        // 12�?    repeater: 7500         // 7.5�?  },
  PLANT_HP: {
    sunflower: 100,
    peashooter: 100,
    wallnut: 3000,          // 坚果血量（�?00，现3000�?    snowpea: 100,
    cherrybomb: 100,
    potatomine: 100,
    jalapeno: 100,
    chomper: 200,
    repeater: 100
  },
  ZOMBIE_SPAWN_INTERVAL: 6000,  // 波次间隔基数(ms)
  SUN_DROP_INTERVAL: 8000,      // 阳光掉落间隔(ms)（加快经济节奏）
  PEA_SHOOT_INTERVAL: 900,      // 豌豆射击间隔(900ms �?每秒1.1�?
  PEA_SPEED: 4,                 // 豌豆移动速度（降�?0%�?  PEA_DAMAGE: 20,               // 豌豆伤害
  WAVE_BONUS_ZOMBIES: 1,        // 每波增加僵尸数量（放缓后期压力）
  CHOMPER_RANGE: 80,            // 大嘴花攻击范�?px)
  CHOMPER_CHEW_TIME: 2000,     // 大嘴花咀嚼时�?ms)
  CHOMPER_DAMAGE: 80,          // 大嘴花每次咀嚼伤�?  JALAPENO_DAMAGE: 1800,       // 窝瓜火焰伤害
  JALAPENO_DURATION: 1500,    // 窝瓜燃烧持续时间(ms)
  REPEATER_DOUBLE: true        // 双发射手双倍火�?};

// ========== 图鉴数据 ==========
const ALMANAC_DATA = {
  plants: [
    {
      type: 'peashooter',
      name: '豌豆射手',
      cost: 100,
      hp: 100,
      damage: 20,
      cooldown: '7.5�?,
      desc: '基础政击植物，持续发射豌豆攻击僵尸�?,
      svg: '<img src="images/plants/peashooter.png" width="50" height="50" style="border-radius:8px">'
    },
    {
      type: 'sunflower',
      name: '向日�?,
      cost: 50,
      hp: 100,
      damage: 0,
      cooldown: '5�?,
      desc: '经济核心，定期产生阳光（�?8�?25阳光）�?,
      svg: '<img src="images/plants/sunflower.png" width="50" height="50" style="border-radius:8px">'
    },
    {
      type: 'wallnut',
      name: '坚果�?,
      cost: 50,
      hp: 1600,
      damage: 0,
      cooldown: '35�?,
      desc: '高血量防御植物，可阻挡僵尸前进。受损后外观会变化�?,
      svg: '<img src="images/plants/wallnut.png" width="50" height="50" style="border-radius:8px">'
    },
    {
      type: 'potatomine',
      name: '土豆地雷',
      cost: 25,
      hp: 100,
      damage: 3000,
      cooldown: '10�?,
      desc: '廉价陷阱植物，僵尸踩中后爆炸造成大量伤害（秒杀）�?,
      svg: '<img src="images/plants/potatomine.png" width="50" height="50" style="border-radius:8px">'
    },
    {
      type: 'snowpea',
      name: '雪花豌豆',
      cost: 175,
      hp: 100,
      damage: 20,
      cooldown: '7.5�?,
      desc: '发射冰冻豌豆，命中僵尸后减�?0%�?,
      svg: '<img src="images/plants/snowpea.png" width="50" height="50" style="border-radius:8px">'
    },
    {
      type: 'cherrybomb',
      name: '樱桃炸弹',
      cost: 150,
      hp: 100,
      damage: 1800,
      cooldown: '30�?,
      desc: '范围爆炸植物，消灭周�?x3格子内所有僵尸�?,
      svg: '<img src="images/plants/cherrybomb.png" width="50" height="50" style="border-radius:8px">'
    },
    {
      type: 'jalapeno',
      name: '火爆辣椒',
      cost: 125,
      hp: 100,
      damage: 1800,
      cooldown: '20�?,
      desc: '横向火焰攻击，消灭整行所有僵尸�?,
      svg: '<img src="images/plants/jalapeno.png" width="50" height="50" style="border-radius:8px">'
    },
    {
      type: 'chomper',
      name: '大嘴�?,
      cost: 150,
      hp: 200,
      damage: 80,
      cooldown: '12�?,
      desc: '近战攻击植物，直接吞噬靠近的僵尸，咀嚼期间无法攻击�?,
      svg: '<img src="images/plants/chomper.png" width="50" height="50" style="border-radius:8px">'
    },
    {
      type: 'repeater',
      name: '双发射手',
      cost: 200,
      hp: 100,
      damage: 40,
      cooldown: '7.5�?,
      desc: '高级攻击植物，每次发射两颗豌豆，火力翻倍�?,
      svg: '<img src="images/plants/DoublePea.png" width="50" height="50" style="border-radius:8px">'
    }
  ],
  zombies: [
    {
      type: 'normal',
      name: '普通僵�?,
      hp: 100,
      damage: 20,
      speed: '中等',
      desc: '最常见的僵尸，缓慢但坚定地向房子前进�?,
      svg: '<img src="images/zombies/normal.png" width="50" height="50" style="border-radius:8px">'
    },
    {
      type: 'cone',
      name: '路障僵尸',
      hp: 200,
      damage: 25,
      speed: '中等',
      desc: '头顶路障的僵尸，防御力是普通僵尸的两倍�?,
      svg: '<img src="images/zombies/cone.png" width="50" height="50" style="border-radius:8px">'
    },
    {
      type: 'bucket',
      name: '铁桶僵尸',
      hp: 400,
      damage: 30,
      speed: '中等',
      desc: '头顶铁桶的僵尸，防御力是普通僵尸的四倍，难以消灭�?,
      svg: '<img src="images/zombies/bucket.png" width="50" height="50" style="border-radius:8px">'
    },
    {
      type: 'flag',
      name: '摇旗僵尸',
      hp: 100,
      damage: 20,
      speed: '中等',
      desc: '举着旗帜的僵尸，标记波次开始。速度与普通僵尸相同�?,
      svg: '<img src="images/zombies/flag.png" width="50" height="50" style="border-radius:8px">'
    },
    {
      type: 'polevault',
      name: '撑杆僵尸',
      hp: 150,
      damage: 25,
      speed: '�?,
      desc: '手持撑杆的僵尸，可以跳过第一个遇到的植物（一次性）�?,
      svg: '<img src="images/zombies/polevault.png" width="50" height="50" style="border-radius:8px">'
    },
    {
      type: 'newspaper',
      name: '读报僵尸',
      hp: 250,
      damage: 25,
      speed: '慢（暴怒后快）',
      desc: '拿着报纸的僵尸，报纸被打烂后会暴怒加速�?,
      svg: '<img src="images/zombies/newspaper.png" width="50" height="50" style="border-radius:8px">'
    },
    {
      type: 'screenDoor',
      name: '铁栅门僵�?,
      hp: 700,
      damage: 30,
      speed: '�?,
      desc: '举着铁栅门的僵尸，防御力极强，可以阻挡豌豆�?,
      svg: '<img src="images/zombies/screenDoor.png" width="50" height="50" style="border-radius:8px">'
    },
    {
      type: 'football',
      name: '橄榄球僵�?,
      hp: 500,
      damage: 35,
      speed: '�?,
      desc: '戴着橄榄球头盔的僵尸，血量高、速度快、伤害高�?,
      svg: '<img src="images/zombies/football.png" width="50" height="50" style="border-radius:8px">'
    }
  ]
};

// ========== 关卡系统 ==========
const LEVELS = [
  { // 1-1 教学�?    level: 1, name: '1-1', desc: '初次冒险',
    plants: ['peashooter'],
    zombieTypes: ['normal'], waves: 3,
    startSun: 200, sunInterval: 7000,
    waveInterval: 18000,
    // 固定出怪：1,2,3（教学关不随机）
    zombiesPerWave: w => w,
    activeRows: [2],
  },
  { // 1-2
    level: 2, name: '1-2', desc: '阳光的力�?,
    plants: ['peashooter', 'sunflower'],
    zombieTypes: ['normal'], waves: 5, activeRows: [1,2,3],
    startSun: 100, sunInterval: 8000,
    waveInterval: 16000,
    // 2,2-3,3-4,4-5,6-8（后期随机范围更大）
    zombiesPerWave: w => {
      const base = Math.ceil(w * 0.6 + 1);
      const totalWaves = 5;
      const progress = w / totalWaves;
      // 随机范围：前期�?，后期�?，最后波±2
      const maxRandom = Math.floor(progress * 2) + (w === totalWaves ? 1 : 0);
      const offset = Math.floor(Math.random() * (maxRandom * 2 + 1)) - maxRandom;
      return Math.max(1, base + offset);
    },
  },
  { // 1-3
    level: 3, name: '1-3', desc: '坚不可摧',
    plants: ['peashooter', 'sunflower', 'wallnut'],
    zombieTypes: ['normal', 'cone'], activeRows: [0,1,2,3,4], waves: 6,
    startSun: 100, sunInterval: 8000,
    waveInterval: 15000,
    // 2,2-3,3-4,4-5,5-6,8-10
    zombiesPerWave: w => {
      const base = Math.ceil(w * 0.8 + 0.5);
      const totalWaves = 6;
      const progress = w / totalWaves;
      const maxRandom = Math.floor(progress * 2) + (w === totalWaves ? 1 : 0);
      const offset = Math.floor(Math.random() * (maxRandom * 2 + 1)) - maxRandom;
      return Math.max(1, base + offset);
    },
  },
  { // 1-4
    level: 4, name: '1-4', desc: '地下伏击',
    plants: ['peashooter', 'sunflower', 'wallnut', 'potatomine'],
    zombieTypes: ['normal', 'cone'], activeRows: [0,1,2,3,4], waves: 7,
    startSun: 100, sunInterval: 8000,
    waveInterval: 14000,
    zombiesPerWave: w => {
      const base = Math.ceil(w * 0.9 + 0.5);
      const totalWaves = 7;
      const progress = w / totalWaves;
      const maxRandom = Math.floor(progress * 2) + (w === totalWaves ? 1 : 0);
      const offset = Math.floor(Math.random() * (maxRandom * 2 + 1)) - maxRandom;
      return Math.max(1, base + offset);
    },
  },
  { // 1-5
    level: 5, name: '1-5', desc: '寒冰射手',
    plants: ['peashooter', 'sunflower', 'wallnut', 'potatomine', 'snowpea'],
    zombieTypes: ['normal', 'cone', 'bucket'], activeRows: [0,1,2,3,4], waves: 8,
    startSun: 100, sunInterval: 8000,
    waveInterval: 14000,
    zombiesPerWave: w => {
      const base = w + 1;
      const totalWaves = 8;
      const progress = w / totalWaves;
      // 中期开始有明显随机波动
      const maxRandom = Math.floor(progress * 2.5) + (w === totalWaves ? 1 : 0);
      const offset = Math.floor(Math.random() * (maxRandom * 2 + 1)) - maxRandom;
      return Math.max(2, base + offset);
    },
  },
  { // 1-6
    level: 6, name: '1-6', desc: '樱桃爆弹',
    plants: ['peashooter', 'sunflower', 'wallnut', 'potatomine', 'snowpea', 'cherrybomb'],
    zombieTypes: ['normal', 'cone', 'bucket', 'polevault'], activeRows: [0,1,2,3,4], waves: 8,
    startSun: 100, sunInterval: 9000,
    waveInterval: 13000,
    zombiesPerWave: w => {
      const base = w + 2;
      const totalWaves = 8;
      const progress = w / totalWaves;
      const maxRandom = Math.floor(progress * 2.5) + (w === totalWaves ? 1 : 0);
      const offset = Math.floor(Math.random() * (maxRandom * 2 + 1)) - maxRandom;
      return Math.max(2, base + offset);
    },
  },
  { // 1-7
    level: 7, name: '1-7', desc: '火焰辣椒',
    plants: ['peashooter', 'sunflower', 'wallnut', 'potatomine', 'snowpea', 'cherrybomb', 'jalapeno'],
    zombieTypes: ['normal', 'cone', 'bucket', 'polevault', 'newspaper'], activeRows: [0,1,2,3,4], waves: 9,
    startSun: 100, sunInterval: 9000,
    waveInterval: 13000,
    zombiesPerWave: w => {
      const base = Math.ceil(w * 1.3 + 1);
      const totalWaves = 9;
      const progress = w / totalWaves;
      const maxRandom = Math.floor(progress * 3) + (w === totalWaves ? 1 : 0);
      const offset = Math.floor(Math.random() * (maxRandom * 2 + 1)) - maxRandom;
      return Math.max(2, base + offset);
    },
  },
  { // 1-8
    level: 8, name: '1-8', desc: '大嘴花登�?,
    plants: ['peashooter', 'sunflower', 'wallnut', 'potatomine', 'snowpea', 'cherrybomb', 'jalapeno', 'chomper'],
    zombieTypes: ['normal', 'cone', 'bucket', 'polevault', 'newspaper', 'screenDoor'], activeRows: [0,1,2,3,4], waves: 10,
    startSun: 100, sunInterval: 9000,
    waveInterval: 12000,
    zombiesPerWave: w => {
      const base = Math.ceil(w * 1.4 + 1);
      const totalWaves = 10;
      const progress = w / totalWaves;
      const maxRandom = Math.floor(progress * 3) + (w === totalWaves ? 1 : 0);
      const offset = Math.floor(Math.random() * (maxRandom * 2 + 1)) - maxRandom;
      return Math.max(2, base + offset);
    },
  },
  { // 1-9
    level: 9, name: '1-9', desc: '双管齐下',
    plants: ['peashooter', 'sunflower', 'wallnut', 'potatomine', 'snowpea', 'cherrybomb', 'jalapeno', 'chomper', 'repeater'],
    zombieTypes: ['normal', 'cone', 'bucket', 'polevault', 'newspaper', 'screenDoor', 'football'], activeRows: [0,1,2,3,4], waves: 12,
    startSun: 100, sunInterval: 10000,
    waveInterval: 12000,
    zombiesPerWave: w => {
      const base = Math.ceil(w * 1.5 + 1);
      const totalWaves = 12;
      const progress = w / totalWaves;
      const maxRandom = Math.floor(progress * 3) + (w === totalWaves ? 2 : 0);
      const offset = Math.floor(Math.random() * (maxRandom * 2 + 1)) - maxRandom;
      return Math.max(3, base + offset);
    },
  },
  { // 1-10 最终关
    level: 10, name: '1-10', desc: '最终决�?,
    plants: ['peashooter', 'sunflower', 'wallnut', 'potatomine', 'snowpea', 'cherrybomb', 'jalapeno', 'chomper', 'repeater'],
    zombieTypes: ['normal', 'cone', 'bucket', 'polevault', 'newspaper', 'screenDoor', 'football'], activeRows: [0,1,2,3,4], waves: 15,
    startSun: 150, sunInterval: 10000,
    waveInterval: 10000,
    zombiesPerWave: w => {
      const base = Math.ceil(w * 1.6 + w * w * 0.02 + 1);
      const totalWaves = 15;
      const progress = w / totalWaves;
      // 最终关随机波动最�?      const maxRandom = Math.floor(progress * 3.5) + (w === totalWaves ? 2 : 0);
      const offset = Math.floor(Math.random() * (maxRandom * 2 + 1)) - maxRandom;
      return Math.max(3, base + offset);
    },
  }
];

// 获取关卡活跃�?function getActiveRows(levelNum) {
  const levelData = LEVELS[levelNum - 1];
  if (levelData && levelData.activeRows) return levelData.activeRows;
  return [0, 1, 2, 3, 4]; // 默认全部5�?}

// ========== 游戏状�?==========
const gameState = {
  sun: 100,
  selectedPlant: null,
  shovelMode: false,
  grid: [],                // 5x9网格，存储植物信�?  zombies: [],             // 僵尸列表
  plants: [],              // 植物列表
  suns: [],                // 阳光列表
  bullets: [],             // 子弹列表
  isRunning: false,        // 游戏是否运行�?  isPaused: false,         // 游戏是否暂停
  lastSunDrop: 0,
  lastZombieSpawn: 0,
  currentWave: 1,
  zombiesKilled: 0,
  gameResult: null,
  mowerUsed: [false, false, false, false, false],
  currentLevel: 1,         // 当前关卡
  maxUnlockedLevel: 1,     // 已解锁最高关�?  animationFrameId: null,  // 游戏循环帧ID
  timers: [],              // 所有interval/setTimeout ID
  sunDropTimer: null,      // 阳光掉落定时�?  zombieSpawnTimer: null,  // 僵尸生成定时�?};

// ========== DOM元素缓存 ==========
// 注意：这些元素在 initGame() 中重新获取，因为脚本加载时DOM可能未完全解�?let elements = {};

// ========== 工具函数 ==========

/**
 * 更新阳光显示
 */
function updateSunDisplay() {
  elements.sunValue.textContent = gameState.sun;
}

/**
 * 消耗阳�? */
function spendSun(cost) {
  if (gameState.sun >= cost) {
    gameState.sun -= cost;
    updateSunDisplay();
    return true;
  }
  return false;
}

/**
 * 增加阳光
 */
function addSun(amount) {
  gameState.sun += amount;
  updateSunDisplay();
}

/**
 * 获取格子中心点坐�? */
function getCellCenter(row, col) {
  const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (!cell) return null;
  
  const rect = cell.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

/**
 * 检查格子是否为�? */
function isCellEmpty(row, col) {
  return !gameState.grid[row] || !gameState.grid[row][col];
}

/**
 * 在格子中放置植物
 */
function placePlant(row, col, plantType) {
  if (!gameState.grid[row]) {
    gameState.grid[row] = [];
  }
  gameState.grid[row][col] = {
    type: plantType,
    hp: getPlantHP(plantType),
    lastAction: Date.now()
  };
  // 记录种植时间
  lastPlacedTime[plantType] = Date.now();
}

/**
 * 获取植物血�? */
function getPlantHP(type) {
  return CONFIG.PLANT_HP[type] || 100;
}

/**
 * 获取植物冷却时间
 */
function getPlantCooldown(type) {
  return CONFIG.PLANT_COOLDOWN[type] || 10000;
}

// 记录每种植物上次种植时间
const lastPlacedTime = {};

/**
 * 检查植物是否在冷却�? */
function isPlantOnCooldown(plantType) {
  const lastPlaced = lastPlacedTime[plantType] || 0;
  const cooldown = getPlantCooldown(plantType);
  return Date.now() - lastPlaced < cooldown;
}

// ========== 植物卡片交互 ==========

/**
 * 初始化植物卡片点击事�? */
function initPlantCards() {
  elements.plantCards.forEach(card => {
    card.addEventListener('click', () => {
      const plantType = card.dataset.plant;
      const cost = CONFIG.PLANT_COST[plantType];
      
      // 检查阳光是否足�?      if (gameState.sun < cost) {
        console.log(`阳光不足！需�?${cost}，当�?${gameState.sun}`);
        return;
      }
      
      // 检查冷�?      if (isPlantOnCooldown(plantType)) {
        const remaining = getPlantCooldown(plantType) - (Date.now() - lastPlacedTime[plantType]);
        console.log(`冷却中！还需 ${Math.ceil(remaining / 1000)} 秒`);
        return;
      }
      
      // 取消铲子模式
      if (gameState.shovelMode) {
        toggleShovelMode();
      }
      
      // 切换选中状�?      if (gameState.selectedPlant === plantType) {
        // 取消选中
        card.classList.remove('selected');
        gameState.selectedPlant = null;
      } else {
        // 选中新植�?        elements.plantCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        gameState.selectedPlant = plantType;
        console.log(`选中植物: ${plantType}，消�? ${cost}`);
      }
    });
  });
}

// ========== 铲子功能 ==========

/**
 * 切换铲子模式
 */
function toggleShovelMode() {
  gameState.shovelMode = !gameState.shovelMode;
  elements.shovelBtn.classList.toggle('selected', gameState.shovelMode);
  
  if (gameState.shovelMode) {
    gameState.selectedPlant = null;
    elements.plantCards.forEach(c => c.classList.remove('selected'));
    console.log('铲子模式已启�?);
  } else {
    console.log('铲子模式已关�?);
  }
}

/**
 * 初始化铲子按�? */
function initShovel() {
  elements.shovelBtn.addEventListener('click', toggleShovelMode);
}

// ========== 草坪格子交互 ==========

/**
 * 初始化草坪格子点击事�? */
function initLawn() {
  const cells = document.querySelectorAll('.cell');
  console.log('找到格子数量:', cells.length);
  
  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      console.log('点击格子:', row, col, '选中植物:', gameState.selectedPlant);
      
      // 铲子模式：移除植�?      if (gameState.shovelMode) {
        if (!isCellEmpty(row, col)) {
          removePlant(row, col);
        }
        return;
      }
      
      // 种植模式：放置植�?      if (gameState.selectedPlant) {
        // 检查冷却（关键修复！）
        if (isPlantOnCooldown(gameState.selectedPlant)) {
          const remaining = getPlantCooldown(gameState.selectedPlant) - (Date.now() - lastPlacedTime[gameState.selectedPlant]);
          console.log(`冷却中！还需 ${Math.ceil(remaining / 1000)} 秒`);
          return;
        }
        if (isCellEmpty(row, col)) {
          const cost = CONFIG.PLANT_COST[gameState.selectedPlant];
          console.log('花费阳光:', cost, '当前阳光:', gameState.sun);
          if (spendSun(cost)) {
            placePlant(row, col, gameState.selectedPlant);
            renderPlant(row, col, gameState.selectedPlant);
            playSound('plant');
            console.log(`�?(${row}, ${col}) 种植�?${gameState.selectedPlant}`);
          } else {
            console.log('阳光不足�?);
          }
        } else {
          console.log(`格子 (${row}, ${col}) 已有植物`);
        }
      } else {
        console.log('请先选择植物�?);
      }
    });
  });
}

/**
 * 在格子中渲染植物
 */

// ========== 逐帧动画系统 ==========
const REANIM_PATH = 'images/plants/reanim/';
;

// ANIMATIONS - 定义每个植物的动画序�?;

// PlantSprite �?- 管理植物的逐帧动画


// 更新所有植物动�?
// ==========================================
// 植物动画管理器（CSS 动画版本，无部件合成�?// ==========================================
class PlantAnimator {
  constructor(plantType, plantDiv) {
    this.plantType = plantType;
    this.div = plantDiv;
    this.currentAnim = null;
    this.frameIndex = 0;
    this.lastFrameTime = 0;
    this.animating = false;
    this.destroyed = false;
    this.animClass = null;

    this.div.classList.add('plant-animated');
    this.div.classList.add('plant-' + plantType + '-idle');

    const img = document.createElement('img');
    img.src = PLANT_IMAGES[plantType] || 'images/plants/peashooter.png';
    img.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:50px;height:50px;pointer-events:none;display:block;';
    this.img = img;
    this.div.appendChild(img);

    // 所有植物的idle动画
    this._startIdle();
  }

  // 获取各植物的idle CSS类名
  _idleClass() {
    const map = {
      peashooter: 'pea-idle-bob',
      sunflower:  'sun-idle-bob',
      wallnut:    'wallnut-idle-bob',
      potatomine: 'potato-idle-wobble',
      snowpea:    'snowpea-idle-bob',
      cherrybomb: 'cherry-idle-pulse',
      jalapeno:   'jalapeno-idle-glow',
      chomper:    'chomper-idle-breathe',
      repeater:   'repeater-idle-bob'
    };
    return map[this.plantType] || '';
  }

  // 获取各植物的攻击/特殊动作 CSS类名
  _actionClass(animName) {
    const map = {
      peashooter: { shoot: 'pea-attack-shake' },
      sunflower:  { produce: 'sun-produce-bounce' },
      snowpea:    { shoot: 'snowpea-attack-shake' },
      repeater:   { shoot: 'repeater-attack-shake' },
      chomper:    { attack: 'chomper-attack-lunge' },
      potatomine: { arm: 'potato-arm-shake' },
      cherrybomb:{ explode: 'cherry-explode' },
      jalapeno:   { attack: 'jalapeno-attack-burn' },
      wallnut:    { hurt: 'wallnut-hurt-flinch' }
    };
    return (map[this.plantType] && map[this.plantType][animName]) || '';
  }

  _startIdle() {
    const cls = this._idleClass();
    if (cls) this.div.classList.add(cls);
  }

  play(animName) {
    if (this.destroyed) return;

    if (this._animTimer) { clearTimeout(this._animTimer); this._animTimer = null; }

    // 移除idle和所有已知动画类
    this.div.classList.remove(
      'pea-idle-bob', 'sun-idle-bob', 'wallnut-idle-bob',
      'potato-idle-wobble', 'snowpea-idle-bob', 'cherry-idle-pulse',
      'jalapeno-idle-glow', 'chomper-idle-breathe', 'repeater-idle-bob',
      'pea-attack-shake', 'sun-produce-bounce', 'snowpea-attack-shake',
      'repeater-attack-shake', 'chomper-attack-lunge', 'potato-arm-shake',
      'cherry-explode', 'jalapeno-attack-burn', 'wallnut-hurt-flinch'
    );

    const actionCls = this._actionClass(animName);
    if (actionCls) {
      this.div.classList.add(actionCls);
      // 攻击/特殊动画结束后自动恢复idle
      const durations = {
        'pea-attack-shake': 450, 'sun-produce-bounce': 650,
        'snowpea-attack-shake': 450, 'repeater-attack-shake': 500,
        'chomper-attack-lunge': 600, 'potato-arm-shake': 400,
        'cherry-explode': 800, 'jalapeno-attack-burn': 1500,
        'wallnut-hurt-flinch': 300
      };
      const dur = durations[actionCls] || 500;
      this._animTimer = setTimeout(() => {
        if (this.destroyed) return;
        this.div.classList.remove(actionCls);
        this._startIdle();
      }, dur);
    } else {
      // idle或未知动画，直接恢复idle
      this._startIdle();
    }
  }

  update(now) {
    if (this.destroyed) return;
  }

  destroy() {
    this.destroyed = true;
    this.div.classList.remove(
      'plant-animated', 'plant-' + this.plantType + '-idle',
      'pea-idle-bob', 'sun-idle-bob', 'wallnut-idle-bob',
      'potato-idle-wobble', 'snowpea-idle-bob', 'cherry-idle-pulse',
      'jalapeno-idle-glow', 'chomper-idle-breathe', 'repeater-idle-bob',
      'pea-attack-shake', 'sun-produce-bounce', 'snowpea-attack-shake',
      'repeater-attack-shake', 'chomper-attack-lunge', 'potato-arm-shake',
      'cherry-explode', 'jalapeno-attack-burn', 'wallnut-hurt-flinch'
    );
  }
}


function updatePlantAnimations(now) {
  for (const plant of gameState.plants) {
    if (plant.element && plant.element.sprite && !plant.element.sprite.destroyed) {
      plant.element.sprite.update(now);
    }
  }
}

// PNG植物图形映射
const PLANT_IMAGES = {
  sunflower: 'images/plants/sunflower.png',
  peashooter: 'images/plants/peashooter.png',
  wallnut: 'images/plants/wallnut.png',
  potatomine: 'images/plants/potatomine.png',
  snowpea: 'images/plants/snowpea.png',
  cherrybomb: 'images/plants/cherrybomb.png',
  jalapeno: 'images/plants/jalapeno.png',
  chomper: 'images/plants/chomper.png',
  repeater: 'images/plants/DoublePea.png',
  squash: 'images/plants/squash.png',
  tallnut: 'images/plants/tallnut.png'
};



function renderPlant(row, col, plantType) {
  const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (!cell) return;
  
  const plant = document.createElement('div');
  plant.className = `plant plant-${plantType}`;
  plant.dataset.row = row;
  plant.dataset.col = col;
  plant.style.position = 'absolute';
  plant.style.left = '50%';
  plant.style.top = '50%';
  plant.style.transform = 'translate(-50%, -50%)';
  plant.style.width = '50px';
  plant.style.height = '50px';
  
  // 所有植物使�?CSS 动画系统
  if (PLANT_IMAGES[plantType]) {
    const sprite = new PlantAnimator(plantType, plant);
    plant.sprite = sprite;
  }
  
  cell.appendChild(plant);
  cell.classList.add('occupied');
  
  // 添加到游戏状�?  const plantObj = {
    type: plantType,
    row: row,
    col: col,
    hp: getPlantHP(plantType),
    maxHp: getPlantHP(plantType),
    element: plant,
    lastShootTime: 0
  };
  gameState.plants.push(plantObj);
  if (typeof onPlantPlaced === 'function') onPlantPlaced();
  
  // 樱桃炸弹特殊处理：种植后立即爆炸
  if (plantType === 'cherrybomb') {
    setTimeout(() => detonateCherryBomb(plantObj), 500);
  }
  
  // 窝瓜特殊处理：种植后自动激�?  if (plantType === 'jalapeno') {
    activateJalapenoOnPlace(plantObj);
  }
  
  // 土豆地雷特殊处理：准�?5秒后生效
  if (plantType === 'potatomine') {
    plantObj.ready = false;
    plant.style.opacity = '0.5';
    plant.style.filter = 'grayscale(100%)';
    plant.style.transform = 'translate(-50%, -50%) scale(0.8)';
    
    setTimeout(() => {
      if (plantObj.element) {
        plantObj.ready = true;
        plantObj.element.style.opacity = '1';
        plantObj.element.style.filter = 'none';
        plantObj.element.style.transform = 'translate(-50%, -50%)';
        // 显示嫩芽
        const sprout = plantObj.element.querySelector('.potato-sprout');
        if (sprout) sprout.style.display = 'block';
        console.log(`土豆地雷 (${plantObj.row}, ${plantObj.col}) 已就绪！`);
      }
    }, 15000);
  }
}

/**
 * 移除植物
 */
function removePlant(row, col) {
  const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (!cell) return;
  
  const plant = cell.querySelector('.plant');
  if (plant) {
    plant.remove();
  }
  
  cell.classList.remove('occupied');
  gameState.grid[row][col] = null;
  
  // 从plants数组中移除，并清理element引用
  gameState.plants = gameState.plants.filter(p => {
    if (p.row === row && p.col === col) {
      p.element = null; // 清理引用防止僵尸访问已删除的DOM
      // 清理sprite
      if (typeof onPlantDestroyed === 'function') onPlantDestroyed();
      return false;
    }
    return true;
  });
  
  console.log(`移除�?(${row}, ${col}) 的植物`);
}

// ========== 阳光掉落系统 ==========


/**
 * 创建阳光元素
 */
function createSunElement(x, y, fromSky = true) {
  const sun = document.createElement('div');
  sun.className = 'falling-sun';
  sun.textContent = "☀�?;
  sun.style.fontSize = "38px";
  sun.style.position = 'absolute';
  sun.style.left = x + 'px';
  sun.style.top = y + 'px';
  sun.style.cursor = 'pointer';
  sun.style.zIndex = '50';
  sun.style.userSelect = 'none';
  
  elements.fallingSuns.appendChild(sun);
  
  const sunObj = {
    element: sun,
    x: x,
    y: y,
    fromSky: fromSky,
    falling: fromSky,      // 只有天空掉的才下�?    fallSpeed: fromSky ? 1.5 : 0.3, // 向日葵的很慢
    maxY: y + (fromSky ? 300 : 80), // 向日葵的只飘一�?    createdAt: Date.now(),
    id: Date.now() + Math.random()
  };
  
  gameState.suns.push(sunObj);
  
  // 鼠标悬停收集（无需点击�?  sun.addEventListener('mouseenter', () => collectSun(sunObj));
  
  // 非天空掉的阳光：8秒后自动消失（比天空掉的长）
  if (!fromSky) {
    setTimeout(() => {
      if (sunObj.element && sunObj.element.parentNode) {
        sunObj.element.style.opacity = '0';
        setTimeout(() => {
          sunObj.element.remove();
          gameState.suns = gameState.suns.filter(s => s.id !== sunObj.id);
        }, 300);
      }
    }, 8000);
  }
  
  return sunObj;
}


/**
 * 从天空随机掉落阳�? */
function dropSunFromSky() {
  const lawn = elements.lawn;
  const rect = lawn.getBoundingClientRect();
  
  // 随机生成x坐标（在草坪范围内）
  const minX = rect.left + 50;
  const maxX = rect.right - 80;
  const x = minX + Math.random() * (maxX - minX);
  
  // 从顶部掉�?  const y = rect.top - 50;
  
  createSunElement(x, y, true);
  console.log('阳光从天空掉落！');
}

/**
 * 收集阳光
 */
function collectSun(sunObj) {
  if (!sunObj.element) return;
  
  // 增加阳光
  addSun(CONFIG.SUN_PER_CLICK);
  playSound('collect');
  
  // 播放收集动画
  sunObj.element.style.transition = 'transform 0.3s ease-out, opacity 0.3s';
  sunObj.element.style.transform = 'scale(1.5)';
  sunObj.element.style.opacity = '0';
  
  // 移除
  setTimeout(() => {
    if (sunObj.element && sunObj.element.parentNode) {
      sunObj.element.remove();
    }
    gameState.suns = gameState.suns.filter(s => s.id !== sunObj.id);
  }, 300);
  
  console.log(`收集阳光 +${CONFIG.SUN_PER_CLICK}`);
}

/**
 * 更新阳光位置（下落动画）
 */
function updateSuns() {
  const lawn = elements.lawn;
  const rect = lawn.getBoundingClientRect();
  
  gameState.suns.forEach(sunObj => {
    if (!sunObj.element || !sunObj.falling) return;
    
    sunObj.y += sunObj.fallSpeed;
    sunObj.element.style.top = sunObj.y + 'px';
    
    // 停止下落条件
    if (sunObj.y >= sunObj.maxY) {
      sunObj.falling = false;
      // �?秒时间收�?      setTimeout(() => {
        if (sunObj.element && sunObj.element.parentNode) {
          sunObj.element.style.opacity = '0';
          setTimeout(() => {
            sunObj.element.remove();
            gameState.suns = gameState.suns.filter(s => s.id !== sunObj.id);
          }, 300);
        }
      }, 3000);
    }
  });
}

/**
 * 开始阳光掉落定时器
 */
function startSunDropTimer(interval) {
  const sunInterval = interval || CONFIG.SUN_DROP_INTERVAL;
  // 先掉落一个阳�?  setTimeout(() => { if (gameState.isRunning) dropSunFromSky(); }, 1000);
  
  // 定时掉落
  gameState.sunDropTimer = setInterval(() => {
    if (gameState.isRunning && !gameState.isPaused) {
      dropSunFromSky();
    }
  }, sunInterval);
}

/**
 * 游戏主循�? */
/**
 * 播放音效
 */
function playSound(type) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
      case 'collect':
        oscillator.frequency.value = 880;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case 'shoot':
        oscillator.frequency.value = 220;
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.05);
        break;
      case 'plant':
        oscillator.frequency.value = 440;
        gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case 'explosion':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case 'jalapeno':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
        break;
      case 'chomp':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
        break;
    }
  } catch (e) {
    console.log('音效播放失败:', e);
  }
}

/**
 * 更新植物卡片冷却计时器显�? */
function updateCooldownTimers() {
  elements.plantCards.forEach(card => {
    const plantType = card.dataset.plant;
    if (!plantType) return;
    
    const cooldown = getPlantCooldown(plantType);
    const lastPlaced = lastPlacedTime[plantType] || 0;
    const elapsed = Date.now() - lastPlaced;
    const remaining = cooldown - elapsed;
    
    const timer = card.querySelector('.cooldown-timer');
    if (!timer) return;
    
    if (remaining > 0) {
      const seconds = Math.ceil(remaining / 1000);
      timer.textContent = seconds + 's';
      timer.style.opacity = '1';
      card.classList.add('cooldown');
    } else {
      timer.textContent = '';
      timer.style.opacity = '0';
      card.classList.remove('cooldown');
    }
  });
}

/**
 * 更新僵尸血条显�? */
function updateZombieHPBars() {
  gameState.zombies.forEach(zombie => {
    if (!zombie.element) return;
    
    // 获取或创建血条元�?    let hpBar = zombie.element.querySelector('.zombie-hp-bar');
    if (!hpBar) {
      hpBar = document.createElement('div');
      hpBar.className = 'zombie-hp-bar';
      hpBar.style.cssText = `
        position: absolute;
        top: -10px;
        left: 5px;
        width: 50px;
        height: 6px;
        background: #333;
        border-radius: 3px;
        overflow: hidden;
        z-index: 100;
      `;
      zombie.element.appendChild(hpBar);
    }
    
    // 更新血条宽�?    const hpPercent = Math.max(0, zombie.hp / zombie.maxHp * 100);
    let hpColor = '#00ff00';
    if (hpPercent < 30) hpColor = '#ff0000';
    else if (hpPercent < 60) hpColor = '#ffff00';
    
    let hpFill = hpBar.querySelector('.zombie-hp-fill');
    if (!hpFill) {
      hpFill = document.createElement('div');
      hpFill.className = 'zombie-hp-fill';
      hpFill.style.cssText = `
        height: 100%;
        width: 100%;
        background: ${hpColor};
        transition: width 0.2s ease;
      `;
      hpBar.appendChild(hpFill);
    } else {
      hpFill.style.width = hpPercent + '%';
      hpFill.style.background = hpColor;
    }
    
    // 如果僵尸死亡，移除血�?    if (zombie.hp <= 0 && hpBar) {
      hpBar.remove();
    }
  });
}

function gameLoop() {
  if (!gameState.isRunning || gameState.isPaused) return;
  
  updatePlantAnimations();
  updateSuns();
  updateSunflowers();
  updatePeashooters();
  updateRepeaters();
  updateChompers();
  updatePotatoMines();
  updatePlantVisuals();
  updateCooldownTimers();
  updateZombieHPBars();
  updateBullets();
  updateZombies();
  
  gameState.animationFrameId = requestAnimationFrame(gameLoop);
}

// ========== 向日葵生产阳�?==========

const SUNFLOWER_PROD_INTERVAL = 10500; // 向日葵每10.5秒产一个阳光（提升30%�?
/**
 * 更新所有向日葵，生产阳�? */
function updateSunflowers() {
  const now = Date.now();
  
  gameState.plants.forEach(plant => {
    if (plant.type !== 'sunflower') return;
    
    // 初始化上次生产时�?    if (!plant.lastSunProduction) {
      plant.lastSunProduction = now;
      return;
    }
    
    // 检查是否到了生产时�?    if (now - plant.lastSunProduction >= SUNFLOWER_PROD_INTERVAL) {
      produceSunFromSunflower(plant);
      plant.lastSunProduction = now;
    }
  });
}

/**
 * 从向日葵位置产出阳光
 */
function produceSunFromSunflower(plant) {
  const cell = document.querySelector(`.cell[data-row="${plant.row}"][data-col="${plant.col}"]`);
  if (!cell) return;
  
  // 播放生产动画
  if (plant.element && plant.element.sprite) {
    plant.element.sprite.play('produce');
  }
  
  const rect = cell.getBoundingClientRect();
  
  // 阳光从向日葵中心偏上位置产生
  const x = rect.left + rect.width / 2 - 30; // 居中（减去阳光宽度一半）
  const y = rect.top + rect.height / 4;
  
  createSunElement(x, y, false); // fromSky=false 表示来自向日�?  console.log(`向日�?(${plant.row}, ${plant.col}) 生产了阳光！`);
}

// ========== 豌豆射手射击系统 ==========

/**
 * 获取子弹容器
 */
function getBulletsContainer() {
  let container = document.getElementById('bullets');
  if (!container) {
    container = document.createElement('div');
    container.id = 'bullets';
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:550;';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * 更新所有豌豆射手，发射子弹
 */
function updatePeashooters() {
  const now = Date.now();
  
  gameState.plants.forEach(plant => {
    // 只处理豌豆射手和雪花豌豆
    if (plant.type !== 'peashooter' && plant.type !== 'snowpea') return;
    if (!plant.element) return;
    
    // 检查是否有僵尸在这一�?    const zombiesInRow = gameState.zombies.some(z => z.row === plant.row && z.x > 0 && z.element);
    
    if (zombiesInRow) {
      // 检查射击间�?      if (!plant.lastShootTime) plant.lastShootTime = 0;
      
      if (now - plant.lastShootTime >= CONFIG.PEA_SHOOT_INTERVAL) {
        shootPea(plant);
        plant.lastShootTime = now;
      }
    }
  });
}

/**
 * 发射豌豆
 */
function shootPea(plant) {
  const cell = document.querySelector(`.cell[data-row="${plant.row}"][data-col="${plant.col}"]`);
  if (!cell || !plant.element) return;
  
  // 播放射击动画
  if (plant.element && plant.element.sprite) {
    plant.element.sprite.play('shoot');
  }
  
  const cellRect = cell.getBoundingClientRect();
  const rowEl = document.querySelector(`.row[data-row="${plant.row}"]`);
  if (!rowEl) return;
  const rowRect = rowEl.getBoundingClientRect();
  
  // 子弹从植物右侧发射（PNG图片�?  const pea = document.createElement('div');
  pea.className = plant.type === 'snowpea' ? 'pea snow-pea' : 'pea';
  pea.style.position = 'absolute';
  pea.style.left = (cellRect.right) + 'px';
  pea.style.top = (rowRect.top + rowRect.height / 2 - 15) + 'px';
  pea.style.width = '30px';
  pea.style.height = '30px';
  pea.style.zIndex = '550';
  pea.style.pointerEvents = 'none';
  
  const bulletImg = document.createElement('img');
  bulletImg.src = plant.type === 'snowpea' ? 'images/effects/ProjectileSnowPea.png' : 'images/effects/ProjectilePea.png';
  bulletImg.style.width = '100%';
  bulletImg.style.height = '100%';
  bulletImg.style.pointerEvents = 'none';
  pea.appendChild(bulletImg);
  
  getBulletsContainer().appendChild(pea);
  
  const peaObj = {
    element: pea,
    row: plant.row,
    x: cellRect.right,
    y: rowRect.top + rowRect.height / 2 - 10,
    speed: CONFIG.PEA_SPEED,
    damage: CONFIG.PEA_DAMAGE,
    isSnowpea: plant.type === 'snowpea',
    id: Date.now() + Math.random()
  };
  
  gameState.bullets.push(peaObj);
  console.log(`豌豆射手发射豌豆！行: ${plant.row}`);
}

/**
 * 更新所有子�? */
function updateBullets() {
  gameState.bullets = gameState.bullets.filter(bullet => {
    if (!bullet.element) return false;
    
    // 移动子弹
    bullet.x += bullet.speed;
    bullet.element.style.left = bullet.x + 'px';
    
    // 检查是否超出屏�?    if (bullet.x > window.innerWidth) {
      bullet.element.remove();
      return false;
    }
    
    // 检查是否击中僵�?    for (const zombie of gameState.zombies) {
      if (!zombie.element) continue;
      if (zombie.row !== bullet.row) continue;
      
      const zombieRect = zombie.element.getBoundingClientRect();
      if (bullet.x >= zombieRect.left && bullet.x <= zombieRect.right) {
        hitZombie(zombie, bullet.damage, bullet.isSnowpea);
        bullet.element.remove();
        return false;
      }
    }
    
    return true;
  });
}

/**
 * 子弹击中僵尸
 */
function hitZombie(zombie, damage, isSnowpea) {
  zombie.hp -= damage;
  playSound('shoot');
  
  // 减速效果（雪花豌豆�?  if (isSnowpea) {
    if (!zombie.baseSpeed) zombie.baseSpeed = zombie.speed;
    zombie.speed = zombie.baseSpeed * 0.5;
    if (zombie.element) {
      zombie.element.style.opacity = '0.8';
      setTimeout(() => { if (zombie.element) zombie.element.style.opacity = '1'; }, 2000);
    }
  }
  
  console.log(`子弹击中僵尸！剩余血�? ${zombie.hp}`);
  
  if (zombie.hp <= 0) {
    if (zombie.element) zombie.element.remove();
    gameState.zombies = gameState.zombies.filter(z => z.id !== zombie.id);
    gameState.zombiesKilled++;
    console.log('僵尸被击杀�?);
    if (typeof onZombieKilled === 'function') onZombieKilled();
  }
}

/**
 * 樱桃炸弹爆炸
 */
function detonateCherryBomb(plant) {
  if (!plant.element) return;
  
  console.log(`樱桃炸弹�?(${plant.row}, ${plant.col}) 爆炸！`);
  playSound('explosion');
  
  // 播放爆炸动画
  if (plant.element.sprite) plant.element.sprite.play('explode');
  
  const cell = document.querySelector(`.cell[data-row="${plant.row}"][data-col="${plant.col}"]`);
  if (cell) {
    const rect = cell.getBoundingClientRect();
    const explosion = document.createElement('div');
    explosion.style.cssText = `
      position: fixed;
      left: ${rect.left - 80}px;
      top: ${rect.top - 80}px;
      width: 240px;
      height: 240px;
      background: radial-gradient(circle, #ff4500 0%, #ff6347 50%, transparent 70%);
      border-radius: 50%;
      z-index: 1000;
      animation: explode 0.5s ease-out forwards;
    `;
    document.body.appendChild(explosion);
    setTimeout(() => explosion.remove(), 500);
  }
  
  // 对范围内所有僵尸造成伤害
  for (let r = Math.max(0, plant.row - 1); r <= Math.min(CONFIG.ROWS - 1, plant.row + 1); r++) {
    for (let c = Math.max(0, plant.col - 1); c <= Math.min(CONFIG.COLS - 1, plant.col + 1); c++) {
      gameState.zombies.forEach(zombie => {
        if (zombie.row === r) {
          zombie.hp -= 1800;
          if (zombie.hp <= 0 && zombie.element) {
            zombie.element.remove();
          }
        }
      });
    }
  }
  
  gameState.zombies = gameState.zombies.filter(z => z.hp > 0);
  removePlant(plant.row, plant.col);
}

// ========== 窝瓜系统 ==========

/**
 * 窝瓜燃烧 - 消灭同列所有僵�? */
function activateJalapeno(plant) {
  if (!plant.element) return;
  
  console.log(`窝瓜�?(${plant.row}, ${plant.col}) 激活！`);
  
  // 显示火焰效果
  const cell = document.querySelector(`.cell[data-row="${plant.row}"][data-col="${plant.col}"]`);
  if (cell) {
    const rect = cell.getBoundingClientRect();
    const fire = document.createElement('div');
    fire.style.cssText = `
      position: fixed;
      left: 0;
      top: ${rect.top}px;
      width: 100vw;
      height: ${CONFIG.CELL_SIZE}px;
      background: linear-gradient(90deg, 
        rgba(255,100,0,0.8) 0%, 
        rgba(255,50,0,0.9) 50%, 
        rgba(255,100,0,0.8) 100%);
      z-index: 800;
      animation: jalapeno-fire ${CONFIG.JALAPENO_DURATION}ms ease-out forwards;
    `;
    document.body.appendChild(fire);
    setTimeout(() => fire.remove(), CONFIG.JALAPENO_DURATION);
    
    playSound('jalapeno');
  }
  
  // 对同列所有僵尸造成伤害
  gameState.zombies.forEach(zombie => {
    if (zombie.row === plant.row && zombie.element) {
      zombie.hp -= CONFIG.JALAPENO_DAMAGE;
      if (zombie.hp <= 0) {
        zombie.element.remove();
        gameState.zombiesKilled++;
      }
    }
  });
  
  gameState.zombies = gameState.zombies.filter(z => z.hp > 0);
  
  // 窝瓜消耗自�?  setTimeout(() => {
    removePlant(plant.row, plant.col);
  }, CONFIG.JALAPENO_DURATION);
}

/**
 * 更新窝瓜状�?- 种植后自动激�? */
function activateJalapenoOnPlace(plant) {
  setTimeout(() => {
    if (plant.element) {
      // 播放攻击动画
      if (plant.element.sprite) plant.element.sprite.play('attack');
      activateJalapeno(plant);
    }
  }, 500);
}

// ========== 大嘴花系�?==========

// 大嘴花SVG状�?const CHOMPER_SVG_NORMAL = '<img src="images/plants/chomper.png" width="50" height="50" style="pointer-events:none">';

const CHOMPER_SVG_CHEWING = '<img src="images/plants/chomper.png" width="50" height="50" style="pointer-events:none;opacity:0.7">';

/**
 * 咀嚼僵�? */
function chomperChew(plant, zombie) {
  if (!plant.element || plant.chewing) return;
  
  plant.chewing = true;
  plant.currentTarget = zombie;
  
  playSound('chomp');
  
  // 播放攻击动画
  if (plant.element.sprite) plant.element.sprite.play('attack');
  
  // 秒杀：直接移除僵�?  if (zombie.element) zombie.element.remove();
  zombie.hp = 0;
  gameState.zombies = gameState.zombies.filter(z => z.id !== zombie.id);
  gameState.zombiesKilled++;
  
  // 咀嚼动画持续一段时间后恢复
  setTimeout(() => {
    plant.chewing = false;
    plant.currentTarget = null;
  }, 30000);
}

/**
 * 更新大嘴花状�? */
function updateChompers() {
  gameState.plants.forEach(plant => {
    if (plant.type !== 'chomper' || plant.chewing) return;
    if (!plant.element) return;
    
    // 获取植物的页面坐�?    const plantRect = plant.element.getBoundingClientRect();
    const plantCenterX = plantRect.left + plantRect.width / 2;
    
    // 检查是否有僵尸在攻击范围内
    for (const zombie of gameState.zombies) {
      if (!zombie.element) continue;
      if (zombie.row !== plant.row) continue;
      
      // �?getBoundingClientRect 保证坐标系一�?      const zombieRect = zombie.element.getBoundingClientRect();
      const zombieCenterX = zombieRect.left + zombieRect.width / 2;
      
      // 触发范围：僵尸中心距离植物中�?150px �?      const dist = plantCenterX - zombieCenterX; // 正数=僵尸在植物右�?      if (dist >= -150 && dist <= 0) {
        if (Math.random() < 0.01) {
          console.log(`大嘴花[${plant.row},${plant.col}]检�? 植物X=${plantCenterX.toFixed(0)}, 僵尸X=${zombieCenterX.toFixed(0)}, 距离=${dist.toFixed(0)}`);
        }
        chomperChew(plant, zombie);
        return;
      }
    }
  });
}

// ========== 双发射手系统 ==========

/**
 * 更新双发射手射击
 */
function updateRepeaters() {
  const now = Date.now();
  
  gameState.plants.forEach(plant => {
    if (plant.type !== 'repeater') return;
    if (!plant.element) return;
    
    // 检查同列是否有僵尸
    let hasTarget = false;
    for (const zombie of gameState.zombies) {
      if (zombie.row === plant.row && zombie.element) {
        hasTarget = true;
        break;
      }
    }
    
    if (!hasTarget) return;
    
    // 射击间隔
    if (now - plant.lastShootTime < CONFIG.PEA_SHOOT_INTERVAL) return;
    plant.lastShootTime = now;
    
    // 播放攻击动画
    if (plant.element && plant.element.sprite) plant.element.sprite.play('shoot');
    
    // 发射双倍豌豆（调用 shootPea，与豌豆射手共用同一函数�?    for (let i = 0; i < 2; i++) {
      setTimeout(() => {
        if (plant.element) {
          shootPea(plant);
          playSound('shoot');
        }
      }, i * 100);
    }
  });
}

// ========== 土豆地雷系统 ==========

/**
 * 更新所有土豆地雷，检查是否被�? */
function updatePotatoMines() {
  const now = Date.now();
  
  gameState.plants.forEach(plant => {
    if (plant.type !== 'potatomine') return;
    if (!plant.ready || !plant.element) return;
    
    // 检查是否有僵尸在这个格子上
    const cell = document.querySelector(`.cell[data-row="${plant.row}"][data-col="${plant.col}"]`);
    if (!cell) return;
    const cellRect = cell.getBoundingClientRect();
    const cellCenterX = cellRect.left + cellRect.width / 2;
    
    for (const zombie of gameState.zombies) {
      if (!zombie.element) continue;
      if (zombie.row !== plant.row) continue;
      
      // 统一�?getBoundingClientRect 获取页面坐标
      const zRect = zombie.element.getBoundingClientRect();
      
      // 触发条件：僵尸任何部分进入格子范围（放宽判定�?      const zombieLeft = zRect.left;
      const zombieRight = zRect.right;
      
      // 调试日志（采样输出，避免刷屏�?      if (Math.random() < 0.01) {
        console.log(`土豆地雷[${plant.row},${plant.col}]检�? 格子中心=${cellCenterX.toFixed(0)}, 僵尸[${zombieLeft.toFixed(0)}, ${zombieRight.toFixed(0)}]`);
      }
      
      // 僵尸与格子有重叠
      if (zombieLeft <= cellRect.right && zombieRight >= cellRect.left) {
        console.log(`土豆地雷触发！格子[${cellRect.left.toFixed(0)}, ${cellRect.right.toFixed(0)}] 僵尸[${zombieLeft.toFixed(0)}, ${zombieRight.toFixed(0)}]`);
        detonatePotatoMine(plant, zombie);
        return;
      }
    }
  });
}

/**
 * 土豆地雷爆炸
 */
function detonatePotatoMine(plant, zombie) {
  if (!plant.element) return;
  
  console.log(`土豆地雷�?(${plant.row}, ${plant.col}) 爆炸！`);
  
  const cell = document.querySelector(`.cell[data-row="${plant.row}"][data-col="${plant.col}"]`);
  if (cell) {
    const rect = cell.getBoundingClientRect();
    const explosion = document.createElement('div');
    explosion.style.cssText = `
      position: fixed;
      left: ${rect.left - 40}px;
      top: ${rect.top - 40}px;
      width: 160px;
      height: 160px;
      background: radial-gradient(circle, #ffd700 0%, #ff8c00 50%, transparent 70%);
      border-radius: 50%;
      z-index: 1000;
      animation: explode 0.3s ease-out forwards;
    `;
    document.body.appendChild(explosion);
    setTimeout(() => explosion.remove(), 300);
  }
  
  // 对踩到的僵尸造成秒杀
  zombie.hp -= 3000;
  if (zombie.hp <= 0 && zombie.element) {
    zombie.element.remove();
    gameState.zombiesKilled++;
  }
  gameState.zombies = gameState.zombies.filter(z => z.hp > 0);
  
  // 移除地雷
  removePlant(plant.row, plant.col);
}

// ========== 植物视觉状态更�?==========

/**
 * 更新所有植物的视觉状态（如坚果墙受损程度�? */
function updatePlantVisuals() {
  gameState.plants.forEach(plant => {
    if (!plant.element) return;
    
    // 坚果墙受损状�?    if (plant.type === 'wallnut') {
      const hpPercent = plant.hp / plant.maxHp;
      
      if (hpPercent <= 0) {
        // 死亡状�?- 不处理，由removePlant处理
      } else if (hpPercent <= 0.33) {
        // 重度受损�? 33% HP�?        plant.element.classList.remove('wallnut-light');
        plant.element.classList.add('wallnut-heavy');
        plant.element.style.filter = 'brightness(0.5) saturate(0.3)';
      } else if (hpPercent <= 0.66) {
        // 轻度受损�?3-66% HP�?        plant.element.classList.remove('wallnut-heavy');
        plant.element.classList.add('wallnut-light');
        plant.element.style.filter = 'brightness(0.75) saturate(0.7)';
      } else {
        // 正常状态（> 66% HP�?        plant.element.classList.remove('wallnut-light', 'wallnut-heavy');
        plant.element.style.filter = '';
      }
    }
  });
}
// PNG僵尸图形映射

// ==========================================
// 植物帧动画数据（简化版：使用全图PNG序列�?// ==========================================
const PLANT_ANIM_FRAMES = {
  peashooter: {
    idle: ['images/plants/peashooter.png'],
    shoot: ['images/plants/peashooter.png'], // 单帧，动画靠CSS
  },
  sunflower: {
    idle: ['images/plants/sunflower.png'],
    produce: ['images/plants/sunflower.png'],
  }
};

// 主动画字典：植物类型 -> { idle帧数�? shoot帧数�? ... }
const PLANT_FRAMES = {
  peashooter: {
    idle:   ['images/plants/peashooter.png'],
    attack: ['images/plants/peashooter.png'],
  },
  sunflower: {
    idle:    ['images/plants/sunflower.png'],
    produce: ['images/plants/sunflower.png'],
  }
};


const ZOMBIE_IMAGES = {
  normal: 'images/zombies/normal.png',
  cone: 'images/zombies/cone.png',
  bucket: 'images/zombies/bucket.png',
  flag: 'images/zombies/flag.png',
  polevault: 'images/zombies/polevault.png',
  newspaper: 'images/zombies/newspaper.png',
  screenDoor: 'images/zombies/screenDoor.png',
  football: 'images/zombies/football.png'
};



const ZOMBIE_TYPES = {
  normal: { hp: 100, speed: 0.24, damage: 20, icon: 'zombie-normal', minWave: 1 },       // 0.4*0.6
  cone: { hp: 200, speed: 0.21, damage: 25, icon: 'zombie-cone', minWave: 3 },            // 0.35*0.6
  bucket: { hp: 400, speed: 0.18, damage: 30, icon: 'zombie-bucket', minWave: 5 },        // 0.3*0.6
  flag: { hp: 100, speed: 0.24, damage: 20, icon: 'zombie-flag', minWave: 1 },           // 0.4*0.6
  polevault: { hp: 150, speed: 0.33, damage: 25, icon: 'zombie-polevault', minWave: 6, canJump: true },  // 0.55*0.6
  newspaper: { hp: 250, speed: 0.15, damage: 25, icon: 'zombie-newspaper', minWave: 7, enraged: false }, // 0.25*0.6
  screenDoor: { hp: 700, speed: 0.12, damage: 30, icon: 'zombie-screenDoor', minWave: 8, hasShield: true }, // 0.2*0.6
  football: { hp: 500, speed: 0.3, damage: 35, icon: 'zombie-football', minWave: 9 }     // 0.5*0.6
};

function getZombiesContainer() {
  let container = document.getElementById('zombies');
  if (!container) {
    container = document.createElement('div');
    container.id = 'zombies';
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:600;';
    document.body.appendChild(container);
  }
  return container;
}

function spawnZombie() {
  const levelData = LEVELS[gameState.currentLevel - 1];
  const activeRows = getActiveRows(gameState.currentLevel);
  const row = activeRows[Math.floor(Math.random() * activeRows.length)];
  // 根据关卡可用僵尸类型选择
  const availableTypes = levelData.zombieTypes;
  // 高波次增加高级僵尸概�?  let type;
  if (availableTypes.includes('bucket') && gameState.currentWave >= levelData.waves - 2 && Math.random() < 0.35) {
    type = 'bucket';
  } else if (availableTypes.includes('cone') && gameState.currentWave >= Math.floor(levelData.waves / 2) && Math.random() < 0.3) {
    type = 'cone';
  } else {
    type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
  }
  const zombieData = ZOMBIE_TYPES[type];
  
  const lawnRect = elements.lawn.getBoundingClientRect();
  const rowEl = document.querySelector(`.row[data-row="${row}"]`);
  if (!rowEl) return;
  const rowRect = rowEl.getBoundingClientRect();
  
  const zombieEl = document.createElement('div');
  zombieEl.className = `zombie zombie-${type}`;
  if (ZOMBIE_IMAGES[type]) {
    const img = document.createElement("img");
    img.src = ZOMBIE_IMAGES[type];
    img.style.width = "65px";
    img.style.height = "95px";
    img.style.pointerEvents = "none";
    zombieEl.appendChild(img);
  }
  zombieEl.style.pointerEvents = 'none';
  
  getZombiesContainer().appendChild(zombieEl);
  
  const startX = lawnRect.right + 20;
  const startY = rowRect.top + (rowRect.height - 95) / 2;
  
  zombieEl.style.left = startX + 'px';
  zombieEl.style.top = startY + 'px';
  
  const zombieObj = {
    element: zombieEl,
    type: type,
    row: row,
    x: startX,
    y: startY,
    hp: zombieData.hp,
    maxHp: zombieData.hp,
    speed: zombieData.speed,
    baseSpeed: zombieData.speed,
    damage: zombieData.damage,
    isAttacking: false,
    targetPlant: null,
    id: Date.now() + Math.random()
  };
  
  gameState.zombies.push(zombieObj);
  console.log(`生成${type}僵尸，行:${row}, 血�?${zombieData.hp}`);
}

function updateZombies() {
  const lawnRect = elements.lawn.getBoundingClientRect();
  const leftBound = lawnRect.left - 60;
  
  gameState.zombies.forEach(zombie => {
    if (!zombie.element) return;
    
    if (zombie.hp <= 0) {
      zombie.element.remove();
      gameState.zombies = gameState.zombies.filter(z => z.id !== zombie.id);
      return;
    }
    
    const plantInFront = findPlantInFront(zombie);
    
    if (plantInFront) {
      zombie.isAttacking = true;
      attackPlant(zombie, plantInFront);
    } else {
      zombie.isAttacking = false;
      zombie.x -= zombie.speed;
      zombie.element.style.left = zombie.x + 'px';
    }
    
    if (zombie.x <= leftBound) {
      triggerLawnMower(zombie.row);
      zombie.hp = 0;
      zombie.element?.remove();
    }
  });
}

function findPlantInFront(zombie) {
  for (const plant of gameState.plants) {
    if (plant.row !== zombie.row || !plant.element) continue;
    const plantRect = plant.element.getBoundingClientRect();
    if (plantRect.left < zombie.x + 60 && plantRect.left > zombie.x - 30) {
      return plant;
    }
  }
  return null;
}

function attackPlant(zombie, plant) {
  const now = Date.now();
  if (!zombie.lastAttackTime) zombie.lastAttackTime = 0;
  
  if (now - zombie.lastAttackTime >= 1000) {
    if (!plant || plant.hp <= 0) return; // 防御检�?    
    plant.hp -= zombie.damage;
    zombie.lastAttackTime = now;
    
    // 坚果墙受击动�?    if (plant.type === 'wallnut' && plant.element && plant.element.sprite) {
      plant.element.sprite.play('hurt');
    }
    
    zombie.element.style.transform = 'scaleX(-1)';
    setTimeout(() => { if (zombie.element) zombie.element.style.transform = ''; }, 200);
    
    console.log(`僵尸攻击植物！植物剩余血�? ${plant.hp}`);
    
    if (plant.hp <= 0) {
      removePlant(plant.row, plant.col);
    }
  }
}

function triggerLawnMower(row) {
  const mower = document.querySelector(`.lawn-mower[data-row="${row}"]`);
  
  if (mower && !gameState.mowerUsed[row]) {
    // 小推车还在，启动它！
    gameState.mowerUsed[row] = true;
    
    // 小推车移动动画（移动到屏幕右边）
    mower.style.transition = 'left 3s linear';
    mower.style.left = window.innerWidth + 'px';
    
    // 小推车消灭该行所有僵�?    setTimeout(() => {
      gameState.zombies = gameState.zombies.filter(z => {
        if (z.row === row) {
          z.element?.remove();
          gameState.zombiesKilled++;
          return false;
        }
        return true;
      });
    }, 500);
    
    // 移除该行僵尸（因为小推车会挡住）
    gameState.zombies = gameState.zombies.filter(z => {
      if (z.row === row) {
        z.element?.remove();
        return false;
      }
      return true;
    });
    
    // 动画结束后隐藏小推车（不删除，以便重置时复用�?    setTimeout(() => {
      if (mower.parentNode) {
        mower.style.display = 'none';
      }
    }, 3100);
  } else {
    // 小推车已被使用，僵尸进入房子�?    gameOver(false);
  }
}

function startZombieSpawner() {
  const levelData = LEVELS[gameState.currentLevel - 1];
  // 延迟20秒后开始出怪（让玩家先种好植物�?  setTimeout(() => {
    if (!gameState.isRunning) return;
    spawnWave();
  }, 20000);
  // 不再用setInterval定时出波，改为波次清空后自动触发
}

function spawnWave() {
  const levelData = LEVELS[gameState.currentLevel - 1];
  const totalWaves = levelData.waves;
  
  if (gameState.currentWave > totalWaves) return;
  
  // 根据关卡配置计算僵尸数（从第一波递增�?  // 第一波少，后面逐渐�?  let waveZombies = Math.max(1, Math.floor(gameState.currentWave * 0.8 + 1));
  
  // 最后一波（巨大波次）适度增加
  if (gameState.currentWave === totalWaves) {
    waveZombies = Math.floor(waveZombies * 1.3);
    console.log('>>> 巨大波次来袭�?<<');
  }
  
  console.log(`�?${gameState.currentWave}/${totalWaves} 波来袭！僵尸数量: ${waveZombies}`);
  
  // 波次内出怪间�?  const spawnDelay = Math.max(1000, 2000 - gameState.currentWave * 100);
  
  for (let i = 0; i < waveZombies; i++) {
    setTimeout(() => {
      if (gameState.isRunning && !gameState.isPaused) spawnZombie();
    }, i * spawnDelay);
  }
  
  // 波次出完后，开始检测僵尸是否清�?  setTimeout(() => {
    checkWaveComplete();
  }, waveZombies * spawnDelay + 3000);
}

function checkWaveComplete() {
  if (!gameState.isRunning) return;
  if (gameState.isPaused) {
    // 暂停时不清除timer，等恢复后再检�?    setTimeout(() => checkWaveComplete(), 2000);
    return;
  }
  
  const levelData = LEVELS[gameState.currentLevel - 1];
  
  // 如果没有僵尸了，进入下一�?  if (gameState.zombies.length === 0) {
    gameState.currentWave++;
    
    if (gameState.currentWave > levelData.waves) {
      gameOver(true);
    } else {
      // 给予奖励阳光
      addSun(50);
      showWaveAnnouncement(`�?${gameState.currentWave}/${levelData.waves} 波`);
      // 7秒后出下一�?      setTimeout(() => {
        if (gameState.isRunning && !gameState.isPaused) {
          spawnWave();
        }
      }, 7000);
    }
  } else {
    // 还有僵尸�?秒后再检�?    setTimeout(() => checkWaveComplete(), 2000);
  }
}

function showWaveAnnouncement(text) {
  const existing = document.querySelector('.wave-announcement');
  if (existing) existing.remove();
  
  const announcement = document.createElement('div');
  announcement.className = 'wave-announcement';
  announcement.textContent = text;
  announcement.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: #ff0;
    font-size: 36px;
    font-weight: bold;
    padding: 20px 40px;
    border-radius: 10px;
    z-index: 2000;
    animation: waveAnnounce 2s ease-out forwards;
  `;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 2000);
}

function gameOver(isWin) {
  if (!gameState.isRunning) return;
  gameState.isRunning = false;
  gameState.gameResult = isWin ? 'win' : 'lose';
  if (typeof onLevelComplete === 'function') onLevelComplete(isWin);
  
  // 停止定时�?  clearGameTimers();
  
  const levelData = LEVELS[gameState.currentLevel - 1];
  const isLastLevel = gameState.currentLevel >= LEVELS.length;
  
  if (isWin && gameState.currentLevel >= gameState.maxUnlockedLevel) {
    gameState.maxUnlockedLevel = Math.min(gameState.currentLevel + 1, LEVELS.length);
  }
  
  const overlay = document.createElement('div');
  overlay.id = 'game-over-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.85);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    z-index: 3000;
  `;
  
  const title = document.createElement('h1');
  title.textContent = isWin ? (isLastLevel ? '通关�? : '关卡完成�?) : '游戏结束';
  title.style.cssText = `
    font-size: 60px;
    color: ${isWin ? '#ffd700' : '#ff4444'};
    text-shadow: 0 0 20px rgba(255,255,255,0.5);
    margin-bottom: 15px;
  `;
  
  const stats = document.createElement('p');
  stats.textContent = `${levelData.name} ${levelData.desc} | 击杀 ${gameState.zombiesKilled} 只僵尸`;
  stats.style.cssText = `font-size: 20px; color: #ccc; margin-bottom: 30px;`;
  
  overlay.appendChild(title);
  overlay.appendChild(stats);
  
  const btnStyle = `
    font-size: 22px; padding: 12px 35px; color: white;
    border: none; border-radius: 10px; cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3); margin: 8px;
  `;
  
  // 重试按钮
  const retryBtn = document.createElement('button');
  retryBtn.textContent = '重试本关';
  retryBtn.style.cssText = btnStyle + `background: linear-gradient(to bottom, #FF9800, #E65100);`;
  retryBtn.onclick = () => { overlay.remove(); startLevel(gameState.currentLevel); };
  overlay.appendChild(retryBtn);
  
  // 下一关按钮（胜利且不是最后一关）
  if (isWin && !isLastLevel) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = `下一�?${LEVELS[gameState.currentLevel].name}`;
    nextBtn.style.cssText = btnStyle + `background: linear-gradient(to bottom, #4CAF50, #2E7D32);`;
    nextBtn.onclick = () => { overlay.remove(); startLevel(gameState.currentLevel + 1); };
    overlay.appendChild(nextBtn);
  }
  
  // 主菜单按�?  const menuBtn = document.createElement('button');
  menuBtn.textContent = '返回主菜�?;
  menuBtn.style.cssText = btnStyle + `background: linear-gradient(to bottom, #607D8B, #37474F);`;
  menuBtn.onclick = () => { overlay.remove(); showMainMenu(); };
  overlay.appendChild(menuBtn);
  
  document.body.appendChild(overlay);
}

function clearGameTimers() {
  if (gameState.sunDropTimer) { clearInterval(gameState.sunDropTimer); gameState.sunDropTimer = null; }
  if (gameState.zombieSpawnTimer) { clearInterval(gameState.zombieSpawnTimer); gameState.zombieSpawnTimer = null; }
  if (gameState.animationFrameId) { cancelAnimationFrame(gameState.animationFrameId); gameState.animationFrameId = null; }
  if (gameState._waveInfoTimer) { clearInterval(gameState._waveInfoTimer); gameState._waveInfoTimer = null; }
}

function resetGame() {
  clearGameTimers();
  
  // 清理所有游戏对�?  gameState.zombies.forEach(z => z.element?.remove());
  gameState.plants.forEach(p => p.element?.remove());
  gameState.suns.forEach(s => s.element?.remove());
  gameState.bullets.forEach(b => b.element?.remove());
  
  // 清理僵尸容器
  const zc = getZombiesContainer();
  if (zc) zc.innerHTML = '';
  // 清理阳光容器
  if (elements.fallingSuns) elements.fallingSuns.innerHTML = '';
  
  // 重置状�?  gameState.zombies = [];
  gameState.plants = [];
  gameState.suns = [];
  gameState.bullets = [];
  gameState.grid = [];
  gameState.selectedPlant = null;
  gameState.shovelMode = false;
  gameState.currentWave = 1;
  gameState.zombiesKilled = 0;
  gameState.gameResult = null;
  gameState.isPaused = false;
  gameState.mowerUsed = [false, false, false, false, false];
  
  // 重置小推�?  document.querySelectorAll('.lawn-mower').forEach(mower => {
    mower.classList.remove('active');
    mower.style.display = '';
    mower.style.left = '';
    mower.style.transition = '';
  });
}



// ========== 小推车定位系�?==========
function updateLawnMowers() {
  const levelNum = gameState.currentLevel || 1;
  const activeRows = getActiveRows(levelNum);
  const lawnRect = elements.lawn.getBoundingClientRect();
  
  document.querySelectorAll('.lawn-mower').forEach(mower => {
    const rowNum = parseInt(mower.dataset.row);
    
    if (!activeRows.includes(rowNum)) {
      mower.style.display = 'none';
      return;
    }
    
    // 显示并重定位到对应行的实际位�?    const rowEl = document.querySelector(`.row[data-row="${rowNum}"]`);
    if (rowEl) {
      const rowRect = rowEl.getBoundingClientRect();
      const newTop = rowRect.top + (rowRect.height - 35) / 2;
      mower.style.top = newTop + 'px';
    }
    mower.style.display = '';
  });
}

// ========== 关卡启动 ==========

function startLevel(levelNum) {
  resetGame();
  if (typeof startGameStats === 'function') startGameStats(levelNum);
  
  gameState.currentLevel = levelNum;
  const levelData = LEVELS[levelNum - 1];
  
  // 设置阳光
  gameState.sun = levelData.startSun;
  
  // 显示/隐藏植物卡片
  updatePlantCards(levelData.plants);
  
  // 显示/隐藏行（关卡递增草坪�?  const activeRows = getActiveRows(levelNum);
  document.querySelectorAll('.row').forEach(row => {
    const rowNum = parseInt(row.dataset.row);
    row.style.display = activeRows.includes(rowNum) ? '' : 'none';
  });
  // 显示/隐藏小推�?+ 动态重定位（等DOM reflow后根据行位置计算�?  requestAnimationFrame(() => {
    const lawnEl = document.getElementById('lawn');
    const lawnRect = lawnEl.getBoundingClientRect();
    document.querySelectorAll('.lawn-mower').forEach(mower => {
      const rowNum = parseInt(mower.dataset.row);
      if (!activeRows.includes(rowNum)) {
        mower.style.display = 'none';
      } else {
        mower.style.display = '';
        // 找到对应行的元素，获取其在lawn内的相对位置
        const rowEl = document.querySelector(`.row[data-row="${rowNum}"]`);
        if (rowEl) {
          const rowRect = rowEl.getBoundingClientRect();
          const mowerHeight = 40; // mower element height
          const rowHeight = rowRect.height;
          mower.style.top = (rowRect.top - lawnRect.top + (rowHeight - mowerHeight) / 2) + 'px';
        }
      }
    });
  });

  // 移除覆盖�?  const existingOverlay = document.getElementById('game-over-overlay');
  if (existingOverlay) existingOverlay.remove();
  document.querySelectorAll('.wave-announcement').forEach(el => el.remove());
  
  // 初始化网�?  for (let r = 0; r < CONFIG.ROWS; r++) {
    gameState.grid[r] = [];
    for (let c = 0; c < CONFIG.COLS; c++) {
      gameState.grid[r][c] = null;
    }
  }
  
  // 重置选中状�?  gameState.selectedPlant = null;
  gameState.shovelMode = false;
  elements.plantCards.forEach(c => c.classList.remove('selected'));
  elements.shovelBtn.classList.remove('selected');
  
  updateSunDisplay();
  gameState.isRunning = true;
  
  // 播放BGM
  playBGM();
  
  // 显示关卡标题
  showWaveAnnouncement(`${levelData.name} ${levelData.desc}`);
  
  // 更新关卡信息
  const levelInfo = document.getElementById('level-info');
  if (levelInfo) {
    levelInfo.textContent = `${levelData.name} ${levelData.desc} | 波次 1/${levelData.waves}`;
  }
  
  // 更新波次信息的定时器
  clearInterval(gameState._waveInfoTimer);
  gameState._waveInfoTimer = setInterval(() => {
    if (levelInfo && gameState.isRunning && !gameState.isPaused) {
      levelInfo.textContent = `${levelData.name} ${levelData.desc} | 波次 ${Math.min(gameState.currentWave, levelData.waves)}/${levelData.waves}`;
    }
  }, 1000);
  
  // 延迟启动（给玩家准备时间�?  setTimeout(() => {
    startSunDropTimer(levelData.sunInterval);
    startZombieSpawner();
    gameLoop();
  }, 2000);
}

function updatePlantCards(availablePlants) {
  document.querySelectorAll('.plant-card').forEach(card => {
    const plantType = card.dataset.plant;
    if (availablePlants.includes(plantType)) {
      card.style.display = 'flex';
      card.classList.remove('disabled');
    } else {
      card.style.display = 'none';
    }
  });
}

// ========== 暂停功能 ==========

function togglePause() {
  if (!gameState.isRunning) return;
  gameState.isPaused = !gameState.isPaused;
  
  const pauseOverlay = document.getElementById('pause-overlay');
  
  if (gameState.isPaused) {
    // 显示暂停菜单
    if (!pauseOverlay) {
      const overlay = document.createElement('div');
      overlay.id = 'pause-overlay';
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        z-index: 2500;
      `;
      
      const title = document.createElement('h1');
      title.textContent = '游戏暂停';
      title.style.cssText = `font-size: 48px; color: #ffd700; margin-bottom: 30px;`;
      overlay.appendChild(title);
      
      const btnStyle = `
        font-size: 22px; padding: 12px 35px; color: white;
        border: none; border-radius: 10px; cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3); margin: 8px; min-width: 180px;
      `;
      
      const resumeBtn = document.createElement('button');
      resumeBtn.textContent = '继续游戏';
      resumeBtn.style.cssText = btnStyle + `background: linear-gradient(to bottom, #4CAF50, #2E7D32);`;
      resumeBtn.onclick = () => togglePause();
      overlay.appendChild(resumeBtn);
      
      const restartBtn = document.createElement('button');
      restartBtn.textContent = '重新开�?;
      restartBtn.style.cssText = btnStyle + `background: linear-gradient(to bottom, #FF9800, #E65100);`;
      restartBtn.onclick = () => { overlay.remove(); startLevel(gameState.currentLevel); };
      overlay.appendChild(restartBtn);
      
      const menuBtn = document.createElement('button');
      menuBtn.textContent = '返回主菜�?;
      menuBtn.style.cssText = btnStyle + `background: linear-gradient(to bottom, #607D8B, #37474F);`;
      menuBtn.onclick = () => { overlay.remove(); showMainMenu(); };
      overlay.appendChild(menuBtn);
      
      document.body.appendChild(overlay);
    }
  } else {
    // 取消暂停
    if (pauseOverlay) pauseOverlay.remove();
    gameLoop();
    // 暂停期间可能所有僵尸已死，恢复后补检波次
    checkWaveComplete();
  }
}

// ========== 主菜�?==========

function showMainMenu() {
  // 停止当前游戏
  gameState.isRunning = false;
  clearGameTimers();
  resetGame();
  
  // 隐藏游戏UI
  document.getElementById('top-bar').style.display = 'none';
  document.getElementById('game-area').style.display = 'none';
  
  // 移除旧菜�?  const old = document.getElementById('main-menu');
  if (old) old.remove();
  
  const menu = document.createElement('div');
  menu.id = 'main-menu';
  menu.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(to bottom, #1a0a00 0%, #2d1500 30%, #0d3b0d 70%, #0a2a0a 100%);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    z-index: 5000;
    font-family: 'Arial', 'Microsoft YaHei', sans-serif;
  `;
  
  // 标题
  const title = document.createElement('div');
  title.style.cssText = `
    font-size: 56px; font-weight: bold; color: #ffd700;
    text-shadow: 0 0 20px rgba(255,215,0,0.6), 0 4px 8px rgba(0,0,0,0.8);
    margin-bottom: 10px; letter-spacing: 4px;
  `;
  title.textContent = '植物大战僵尸';
  menu.appendChild(title);
  
  const subtitle = document.createElement('div');
  subtitle.style.cssText = `font-size: 18px; color: #8BC34A; margin-bottom: 40px; letter-spacing: 2px;`;
  subtitle.textContent = '网页�?;
  menu.appendChild(subtitle);
  
  // 关卡选择
  const levelGrid = document.createElement('div');
  levelGrid.style.cssText = `
    display: grid; grid-template-columns: repeat(5, 1fr);
    gap: 12px; margin-bottom: 30px; max-width: 600px;
  `;
  
  LEVELS.forEach((level, i) => {
    const btn = document.createElement('button');
    const unlocked = i + 1 <= gameState.maxUnlockedLevel;
    btn.style.cssText = `
      width: 90px; height: 75px; border: 3px solid ${unlocked ? '#8B6914' : '#555'};
      border-radius: 10px; cursor: ${unlocked ? 'pointer' : 'not-allowed'};
      background: ${unlocked ? 'linear-gradient(to bottom, #5d8a3c, #3a5f22)' : 'linear-gradient(to bottom, #444, #333)'};
      color: ${unlocked ? '#fff' : '#777'}; font-size: 14px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      box-shadow: ${unlocked ? '0 3px 8px rgba(0,0,0,0.4)' : 'none'};
      transition: transform 0.1s;
    `;
    btn.innerHTML = `
      <div style="font-size:16px;font-weight:bold">${level.name}</div>
      <div style="font-size:11px;margin-top:2px">${unlocked ? level.desc : '未解�?}</div>
      ${!unlocked ? '<div style="font-size:16px;margin-top:2px">🔒</div>' : ''}
    `;
    if (unlocked) {
      btn.onmouseenter = () => btn.style.transform = 'scale(1.05)';
      btn.onmouseleave = () => btn.style.transform = 'scale(1)';
      const levelNum = i + 1;
      btn.onclick = () => {
        if (typeof requireLogin === 'function' && window.TCB_READY) {
          requireLogin(() => { menu.remove(); showGameUI(); startLevel(levelNum); });
        } else {
          menu.remove(); showGameUI(); startLevel(levelNum);
        }
      };
    }
    levelGrid.appendChild(btn);
  });
  
  menu.appendChild(levelGrid);
  
  // 连续冒险按钮
  const adventureBtn = document.createElement('button');
  adventureBtn.textContent = '冒险模式（从�?关开始）';
  adventureBtn.style.cssText = `
    font-size: 22px; padding: 14px 40px;
    background: linear-gradient(to bottom, #4CAF50, #2E7D32);
    color: white; border: 3px solid #1B5E20;
    border-radius: 12px; cursor: pointer;
    box-shadow: 0 4px 15px rgba(0,0,0,0.4);
    margin-top: 10px;
  `;
  adventureBtn.onclick = () => {
    if (typeof requireLogin === 'function' && window.TCB_READY) {
      requireLogin(() => { menu.remove(); showGameUI(); startLevel(1); });
    } else {
      menu.remove(); showGameUI(); startLevel(1);
    }
  };
  menu.appendChild(adventureBtn);
  
  // 查看图鉴按钮
  const almanacBtn = document.createElement('button');
  almanacBtn.textContent = '查看图鉴';
  almanacBtn.style.cssText = `
    font-size: 22px; padding: 14px 40px;
    background: linear-gradient(to bottom, #795548, #5D4037);
    color: white; border: 3px solid #A1887F;
    border-radius: 12px; cursor: pointer;
    box-shadow: 0 4px 15px rgba(0,0,0,0.4);
    margin-top: 10px;
  `;
  almanacBtn.onclick = () => { menu.remove(); showAlmanac(); };
  menu.appendChild(almanacBtn);
  
  // 一键解锁全部关卡按�?  const unlockAllBtn = document.createElement('button');
  unlockAllBtn.textContent = '一键解锁全部关�?;
  unlockAllBtn.style.cssText = `
    font-size: 18px; padding: 10px 30px;
    background: linear-gradient(to bottom, #FF9800, #F57C00);
    color: white; border: 3px solid #E65100;
    border-radius: 12px; cursor: pointer;
    box-shadow: 0 4px 15px rgba(0,0,0,0.4);
    margin-top: 15px;
  `;
  unlockAllBtn.onclick = () => {
    gameState.maxUnlockedLevel = LEVELS.length;
    menu.remove();
    showMainMenu(); // 刷新菜单显示解锁状�?  };
  menu.appendChild(unlockAllBtn);
  
  document.body.appendChild(menu);
}

function showGameUI() {
  document.getElementById('top-bar').style.display = 'flex';
  document.getElementById('game-area').style.display = 'block';
}

// ========== 游戏初始�?==========

function initGame() {
  // 获取DOM元素（只执行一次）
  elements = {
    sunValue: document.getElementById('sun-value'),
    plantCards: document.querySelectorAll('.plant-card'),
    shovelBtn: document.getElementById('shovel-btn'),
    lawn: document.getElementById('lawn'),
    fallingSuns: document.getElementById('falling-suns')
  };
  
  // 添加暂停按钮到顶�?  let pauseBtn = document.getElementById('pause-btn');
  if (!pauseBtn) {
    pauseBtn = document.createElement('button');
    pauseBtn.id = 'pause-btn';
    pauseBtn.innerHTML = '❚❚';
    pauseBtn.title = '暂停';
    pauseBtn.style.cssText = `
      margin-left: 12px; width: 45px; height: 45px;
      background: linear-gradient(to bottom, #5d4037, #3e2723);
      border: 2px solid #8d6e63; border-radius: 8px;
      color: #fff; font-size: 18px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 3px 6px rgba(0,0,0,0.3);
    `;
    pauseBtn.onclick = togglePause;
    document.getElementById('top-bar').appendChild(pauseBtn);
  }
  
  // 显示关卡信息区域
  let levelInfo = document.getElementById('level-info');
  if (!levelInfo) {
    levelInfo = document.createElement('div');
    levelInfo.id = 'level-info';
    levelInfo.style.cssText = `
      position: fixed; top: 80px; left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.6); color: #ffd700;
      padding: 4px 16px; border-radius: 8px; font-size: 14px;
      z-index: 999; pointer-events: none;
    `;
    document.body.appendChild(levelInfo);
  }
  
  // 监听ESC暂停（只绑定一次）
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') togglePause();
  });
  
  // 初始化交互事件（只绑定一次）
  initPlantCards();
  initShovel();
  initLawn();
  
  console.log('游戏初始化完成，事件监听器已绑定');
  
  // 显示主菜�?  // 如果 Firebase 已配置且用户已登录，显示用户信息
  if (window.TCB_READY && window.PVZ_USER) {
    const nameEl = document.getElementById('user-name');
    if (nameEl && window.PVZ_USER.displayName) nameEl.textContent = '👤 ' + window.PVZ_USER.displayName;
    const ub = document.getElementById('user-bar');
    if (ub) ub.style.display = 'flex';
  }
  // 如果 Firebase 已配置但用户未登录，显示登录界面
  if (window.TCB_READY && !window.PVZ_USER) {
    const authScreen = document.getElementById('auth-screen');
    if (authScreen) authScreen.style.display = 'flex';
    // 继续显示主菜单（在登录界面下方，但被遮盖�?  }
  showMainMenu();
}

// ========== 图鉴系统 ==========

/**
 * 显示图鉴界面
 */
function showAlmanac() {
  const overlay = document.getElementById('almanac-overlay');
  const content = document.getElementById('almanac-content');
  
  overlay.style.display = 'flex';
  
  // 默认显示植物图鉴
  renderAlmanacPlants();
  
  // 绑定标签页切换事�?  document.querySelectorAll('.almanac-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.almanac-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      if (tab.dataset.tab === 'plants') {
        renderAlmanacPlants();
      } else {
        renderAlmanacZombies();
      }
    };
  });
  
  // 绑定关闭按钮
  document.getElementById('almanac-close').onclick = closeAlmanac;
  
  // 点击背景关闭
  overlay.onclick = (e) => {
    if (e.target === overlay) closeAlmanac();
  };
}

/**
 * 关闭图鉴界面
 */
function closeAlmanac() {
  document.getElementById('almanac-overlay').style.display = 'none';
  showMainMenu();
}

/**
 * 渲染植物图鉴
 */
function renderAlmanacPlants() {
  const content = document.getElementById('almanac-content');
  content.innerHTML = '';
  
  ALMANAC_DATA.plants.forEach(plant => {
    const card = document.createElement('div');
    card.className = 'almanac-card';
    card.innerHTML = `
      <div class="almanac-card-icon">${plant.svg}</div>
      <div class="almanac-card-info">
        <div class="almanac-card-name">${plant.name}</div>
        <div class="almanac-card-stats">
          <span class="almanac-stat">价格: <span class="almanac-stat-value">${plant.cost}</span></span>
          <span class="almanac-stat">血�? <span class="almanac-stat-value">${plant.hp}</span></span>
          <span class="almanac-stat">伤害: <span class="almanac-stat-value">${plant.damage}</span></span>
          <span class="almanac-stat">冷却: <span class="almanac-stat-value">${plant.cooldown}</span></span>
        </div>
        <div class="almanac-card-desc">${plant.desc}</div>
      </div>
    `;
    content.appendChild(card);
  });
}

/**
 * 渲染僵尸图鉴
 */
function renderAlmanacZombies() {
  const content = document.getElementById('almanac-content');
  content.innerHTML = '';
  
  ALMANAC_DATA.zombies.forEach(zombie => {
    const card = document.createElement('div');
    card.className = 'almanac-card';
    card.innerHTML = `
      <div class="almanac-card-icon">${zombie.svg}</div>
      <div class="almanac-card-info">
        <div class="almanac-card-name">${zombie.name}</div>
        <div class="almanac-card-stats">
          <span class="almanac-stat">血�? <span class="almanac-stat-value">${zombie.hp}</span></span>
          <span class="almanac-stat">伤害: <span class="almanac-stat-value">${zombie.damage}</span></span>
          <span class="almanac-stat">速度: <span class="almanac-stat-value">${zombie.speed}</span></span>
        </div>
        <div class="almanac-card-desc">${zombie.desc}</div>
      </div>
    `;
    content.appendChild(card);
  });
}

// ========== 启动游戏 ==========
window.addEventListener('DOMContentLoaded', initGame);
