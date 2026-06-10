# PvZ 精灵图动画系统 v1.0

> 基于精灵图（Sprite Sheet）的原版画风实现方案

## 📁 文件结构

```
modeling/
├── sprite_sheet.css          # CSS精灵图动画框架
├── sprite_controller.js      # JavaScript精灵控制器
├── sprite_generator.html     # 框架演示页面
├── detailed_svg_plants.js   # SVG植物模型（备用）
├── detailed_animations.css   # SVG配套动画
└── demo_detailed.html       # SVG模型演示
```

## 🎮 快速开始

### 1. 引入文件

```html
<link rel="stylesheet" href="modeling/sprite_sheet.css">
<script src="modeling/sprite_controller.js"></script>
```

### 2. 初始化控制器

```javascript
const controller = new SpriteController(gameContainer);
controller.loadConfig(SPRITE_CONFIG);
```

### 3. 创建精灵

```javascript
// 创建植物精灵
const sunflower = controller.createSprite('sunflower', 'plants');
gameArea.appendChild(sunflower);

// 创建僵尸精灵
const zombie = controller.createSprite('zombie_normal', 'zombies');
gameArea.appendChild(zombie);
```

### 4. 播放动画

```javascript
// 循环播放
controller.play(sprite, 'sway', true);

// 单次播放（完成后自动恢复默认）
controller.playOnce(sprite, 'produce', () => {
    console.log('动画完成');
});
```

## 🎨 精灵图规格

### 图片要求

| 参数 | 值 |
|------|-----|
| 格式 | PNG（透明背景） |
| 单帧尺寸 | 80x100px |
| 布局 | 横向排列 |
| 行数 | 按动画数量 |

### 目录结构

```
sprites/
├── plants/
│   ├── sunflower.png      # 8帧 x 3行 = 24帧
│   ├── peashooter.png    # 5帧 x 2行 = 10帧
│   └── ...
├── zombies/
│   ├── zombie_normal.png
│   ├── zombie_cone.png
│   └── ...
└── effects/
    ├── pea.png
    ├── sun.png
    └── explosion.png
```

### 精灵图布局示例

```
sunflower.png (800x300)
┌────┬────┬────┬────┬────┬────┬────┬────┐
│idle│sway│sway│sway│prod│prod│prod│prod│  Row 0
├────┼────┼────┼────┼────┼────┼────┼────┤
│idle│sway│sway│sway│prod│prod│prod│prod│  Row 1
├────┼────┼────┼────┼────┼────┼────┼────┤
│idle│sway│sway│sway│prod│prod│prod│prod│  Row 2
└────┴────┴────┴────┴────┴────┴────┴────┘
 80px   80px  80px  80px  80px  80px  80px  80px
```

## 🌻 植物精灵配置

| 植物 | 类型名 | 动画 | 帧数 |
|------|--------|------|------|
| 向日葵 | sunflower | idle, sway, produce | 1+4+6 |
| 豌豆射手 | peashooter | idle, shoot | 1+5 |
| 坚果墙 | wallnut | idle, hurt1, hurt2, crumble | 1+4+4+3 |
| 雪花豌豆 | snowpea | idle, shoot | 1+5 |
| 樱桃炸弹 | cherrybomb | idle, fuse, explode | 1+3+5 |
| 大嘴花 | chomper | idle, chomp, chew | 1+6+4 |
| 双发射手 | repeater | idle, shoot | 1+6 |
| 倭瓜 | squash | idle, jump, slam | 1+6+4 |
| 三线发射器 | threepeater | idle, shoot | 1+5 |
| 缠绕海带 | tenacious | wave, wrap | 4+6 |
| 火爆辣椒 | jalapeno | idle, ignite, burn | 1+4+5 |
| 棘草 | thorn | rustle, attack | 4+4 |
| 火把木 | torchwood | idle, flame | 1+3 |
| 高坚果 | tallnut | idle, hurt | 1+4 |
| 海蘑菇 | puffshroom | idle, shoot | 1+4 |
| 炮雾蘑菇 | froast | idle, fog | 1+6 |
| 阳光蘑菇 | sunshroom | idle, glow | 1+4 |
| 胆小蘑菇 | shy | tremble, hide | 4+3 |
| 催眠蘑菇 | hypnoshroom | idle, spin | 1+6 |
| 墓碑吞噬者 | shroom | idle, chomp | 1+5 |
| 冰蘑菇 | iceshroom | idle, blast | 1+5 |
| 末日蘑菇 | doom | pulse, explode | 1+4+6 |
| 睡莲 | lily | idle, float | 1+4 |

## 🧟 僵尸精灵配置

| 僵尸 | 类型名 | 动画 | 帧数 |
|------|--------|------|------|
| 普通僵尸 | zombie_normal | walk, attack, hurt, death | 8+4+4+3 |
| 路障僵尸 | zombie_cone | walk, attack, coneLost, hurt, death | 8+4+4+4+3 |
| 铁桶僵尸 | zombie_bucket | walk, attack, bucketLost, hurt, death | 8+4+4+4+3 |
| 摇旗僵尸 | zombie_flag | walk, wave, attack, hurt, death | 8+4+4+4+3 |

## 🎬 CSS动画类

### 植物动画

```css
.sprite-sunflower-idle      /* 向日葵待机 */
.sprite-sunflower-produce   /* 向日葵生产 */
.sprite-peashooter-idle     /* 豌豆待机 */
.sprite-peashooter-shoot    /* 豌豆射击 */
.sprite-wallnut-hurt        /* 坚果受伤 */
.sprite-cherrybomb-explode  /* 樱桃爆炸 */
.sprite-squash-jump         /* 倭瓜跳跃 */
.sprite-torchwood-flame     /* 火把火焰 */
```

### 僵尸动画

```css
.sprite-zombie-walk        /* 僵尸走路 */
.sprite-zombie-attack      /* 僵尸攻击 */
.sprite-zombie-hurt        /* 僵尸受伤 */
.sprite-zombie-death       /* 僵尸死亡 */
.sprite-cone-walk          /* 路障走路 */
.sprite-bucket-walk        /* 铁桶走路 */
.sprite-flag-walk          /* 摇旗走路 */
```

### 特效

```css
.sprite-pea-fly            /* 豌豆飞行 */
.sprite-snowpea-fly        /* 冰豌豆飞行 */
.sprite-fireball           /* 火球 */
.sprite-sun-rotate         /* 阳光旋转 */
.sprite-explosion          /* 爆炸 */
```

### 状态效果

```css
.sprite-frozen             /* 冰冻状态 */
.sprite-burning            /* 燃烧状态 */
.sprite-damaged            /* 受损状态 */
.sprite-hidden             /* 隐身状态 */
```

## 🔧 JavaScript API

### SpriteController 类

```javascript
// 创建控制器
const controller = new SpriteController(container);

// 加载配置
controller.loadConfig(SPRITE_CONFIG);

// 创建精灵
const sprite = controller.createSprite('sunflower', 'plants');

// 播放动画
controller.play(sprite, 'sway', true);           // 循环
controller.playOnce(sprite, 'produce');            // 单次

// 停止动画
controller.stop(sprite);

// 添加效果
controller.addEffect(sprite, 'frozen');
controller.removeEffect(sprite, 'frozen');

// 销毁
controller.destroy(sprite);
```

### 快捷函数

```javascript
// 初始化
initSpriteSystem(container);

// 创建植物
createPlantSprite('sunflower', container);

// 创建僵尸
createZombieSprite('zombie_normal', container);

// 播放动画
playPlantAnim(sprite, 'sway', true);
playZombieAnim(sprite, 'walk', true);

// 单次动画
playSpriteAnimOnce(sprite, 'produce', () => {});

// 添加效果
addSpriteEffect(sprite, 'frozen');
removeSpriteEffect(sprite, 'frozen');

// 销毁
destroySprite(sprite);
```

## 🎨 制作工具推荐

### 2D精灵图制作

1. **Aseprite** (推荐)
   - 专门为像素艺术设计
   - 支持动画时间轴
   - 导出为精灵图

2. **Photoshop**
   - 功能强大
   - 需要手动排版

3. **在线工具**
   - [piq.codeus.net](https://piq.codeus.net)
   - [pixelanimator.me](https://pixelanimator.me)

### 从SVG转换

如果有现成的SVG，可以使用以下工具转换：

1. **SVG to PNG批量转换**
   - 使用Inkscape命令行
   - 或在线工具

2. **Canvas渲染**
   - 使用detailed_svg_plants.js中的SVG
   - 渲染到Canvas后导出

## 📋 制作清单

### 植物精灵图

- [ ] sunflower.png (800x300)
- [ ] peashooter.png (500x200)
- [ ] wallnut.png (900x400)
- [ ] snowpea.png (500x200)
- [ ] cherrybomb.png (600x200)
- [ ] chomper.png (700x200)
- [ ] repeater.png (600x200)
- [ ] squash.png (700x400)
- [ ] threepeater.png (500x200)
- [ ] tenacious.png (900x200)
- [ ] jalapeno.png (600x200)
- [ ] thorn.png (700x200)
- [ ] torchwood.png (400x200)
- [ ] tallnut.png (500x400)
- [ ] puffshroom.png (500x200)
- [ ] froast.png (600x200)
- [ ] sunshroom.png (400x160)
- [ ] shy.png (400x160)
- [ ] hypnoshroom.png (600x200)
- [ ] shroom.png (600x200)
- [ ] iceshroom.png (600x200)
- [ ] doom.png (700x300)
- [ ] lily.png (500x160)

### 僵尸精灵图

- [ ] zombie_normal.png (880x400)
- [ ] zombie_cone.png (880x500)
- [ ] zombie_bucket.png (880x500)
- [ ] zombie_flag.png (880x500)

### 特效精灵图

- [ ] pea.png (80x20)
- [ ] snowpea.png (80x20)
- [ ] sun.png (360x60)
- [ ] explosion.png (600x100)

## 📄 许可证

本项目仅供学习交流使用，植物大战僵尸版权归PopCap Games/EA所有。
