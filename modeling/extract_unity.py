# Unity 资源提取脚本 - 植物大战僵尸融合版 2.8.2
# 使用UnityPy提取PNG精灵图

import os
from UnityPy import load

# 路径配置
game_dir = r"D:\植物大战僵尸融合版全新安装包\植物大战僵尸融合版2.8.2\植物大战僵尸融合版2.8.2"
output_dir = r"D:\实训\pvz-game\modeling\extracted\rh_assets"

# 创建输出目录
os.makedirs(output_dir, exist_ok=True)
os.makedirs(os.path.join(output_dir, "plants"), exist_ok=True)
os.makedirs(os.path.join(output_dir, "zombies"), exist_ok=True)
os.makedirs(os.path.join(output_dir, "other"), exist_ok=True)

print("=" * 60)
print("Unity Asset Extractor - 植物大战僵尸融合版 2.8.2")
print("=" * 60)
print(f"游戏目录: {game_dir}")

# 加载环境
print("\n正在加载Unity资源...")
env = load(game_dir)
print(f"总资源数: {len(env.objects)}")

# 统计
total_images = 0
plant_count = 0
zombie_count = 0
other_count = 0

# 关键词
plant_keywords = ["pea", "sunflower", "wallnut", "cherrybomb", "chomper", "snowpea", 
                  "repeater", "squash", "tallnut", "jalapeno", "gravebuster", "hypnoshroom", 
                  "iceshroom", "doomshroom", "puffshroom", "sunshroom", "blover", "cattail", 
                  "cactus", "magnetshroom", "cabbage", "corn", "caltrop", "firepea", "goldpea",
                  "cob", "gloom", "spike", "coffee", "stinky", "tangle", "scaredy", "fumeshroom",
                  "plant", "pot", "umbrella", "spikeweed", "bonk", "chard", "garlic", "lettuce",
                  "melon", "pumpkin", "kern", "sun", "flower", "mushroom", "shroom", "pea"]

zombie_keywords = ["zombie", "cone", "bucket", "flag", "dancer", "dolphin", "polevaulter", "pogo",
                   "digger", "gargantuar", "balloon", "newspaper", "ducky", "ladder", "zamboni",
                   "yeti", "football", "disco", "bungi", "backup", "diamond", "gardener",
                   "jackbox", "paper", "snorkle", "skeleton", "necromancer", "jackson", "shark",
                   "seademon", "sleep", "drive", "brain", "imp", "toss", "walrus"]

def get_safe_name(name):
    """清理文件名"""
    if not name:
        return None
    name = str(name)
    for char in ['/', '\\', ':', '?', '*', '"', '<', '>', '|']:
        name = name.replace(char, '_')
    return name

def classify(name):
    """分类资源"""
    if not name:
        return "other"
    
    name_lower = name.lower()
    
    # 优先检查植物
    for kw in plant_keywords:
        if kw in name_lower:
            return "plants"
    
    # 检查僵尸
    for kw in zombie_keywords:
        if kw in name_lower:
            return "zombies"
    
    return "other"

# 处理过的文件
processed = {}

# 处理Sprite资源
print("\n正在提取Sprite资源...")
print("-" * 40)

sprite_count = 0

for obj in env.objects:
    if obj.type.name != "Sprite":
        continue
    
    try:
        tree = obj.read()
        name = get_safe_name(tree.m_Name)
        
        if not name:
            continue
        
        if not name.endswith('.png'):
            name = name + '.png'
        
        # 避免重复
        if name in processed:
            continue
        processed[name] = True
        
        # 提取图片数据
        img = tree.image
        if img is None:
            continue
        
        # 分类
        category = classify(name)
        
        # 保存
        save_path = os.path.join(output_dir, category, name)
        img.save(save_path, "PNG")
        
        sprite_count += 1
        total_images += 1
        
        if category == "plants":
            plant_count += 1
        elif category == "zombies":
            zombie_count += 1
        else:
            other_count += 1
        
        if sprite_count % 100 == 0:
            print(f"已提取 Sprite: {sprite_count}")
            
    except Exception as e:
        continue

# 处理Texture2D资源
print(f"\nSprite提取完成: {sprite_count} 个")
print("正在提取Texture2D资源...")

texture_count = 0

for obj in env.objects:
    if obj.type.name != "Texture2D":
        continue
    
    try:
        tree = obj.read()
        name = get_safe_name(tree.name)
        
        if not name:
            continue
        
        if not name.endswith('.png'):
            name = name + '.png'
        
        # 避免重复
        if name in processed:
            continue
        processed[name] = True
        
        # 提取图片数据
        img = tree.image
        if img is None:
            continue
        
        # 分类
        category = classify(name)
        
        # 保存
        save_path = os.path.join(output_dir, category, name)
        img.save(save_path, "PNG")
        
        texture_count += 1
        total_images += 1
        
        if category == "plants":
            plant_count += 1
        elif category == "zombies":
            zombie_count += 1
        else:
            other_count += 1
            
    except Exception as e:
        continue

print("\n" + "=" * 60)
print("提取完成!")
print("=" * 60)
print(f"Sprite数量: {sprite_count}")
print(f"Texture2D数量: {texture_count}")
print(f"")
print(f"植物资源: {plant_count} 个")
print(f"僵尸资源: {zombie_count} 个")
print(f"其他资源: {other_count} 个")
print(f"总计: {total_images} 个")
print(f"\n输出目录: {output_dir}")
print("\n提示: 检查 plants/ 和 zombies/ 文件夹中的精灵图")