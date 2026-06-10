# Unity资源导入脚本
# 将提取的PNG精灵图转换为游戏可用的格式

import os
import shutil

# 路径配置
extracted_dir = r"D:\实训\pvz-game\modeling\extracted\rh_assets"
output_dir = r"D:\实训\pvz-game\images"

# 创建输出目录
os.makedirs(os.path.join(output_dir, "plants"), exist_ok=True)
os.makedirs(os.path.join(output_dir, "zombies"), exist_ok=True)
os.makedirs(os.path.join(output_dir, "ui"), exist_ok=True)
os.makedirs(os.path.join(output_dir, "effects"), exist_ok=True)

print("=" * 60)
print("Unity资源导入 - 植物大战僵尸")
print("=" * 60)

# 定义主要植物资源映射（原版风格）
plant_mapping = {
    # 基本植物 - 使用无前缀版本
    "sunflower": "Sunflower.png",
    "peashooter": "Peashooter.png",
    "wallnut": "Wallnut.png",
    "cherrybomb": "CherryBomb.png",
    "snowpea": "SnowPeaShooter.png",
    "chomper": "Chomper.png",
    "squash": "Squash.png",
    "tallnut": "TallNut.png",
    "jalapeno": "Jalapeno.png",
    "gravebuster": "Gravebuster.png",
    "sunshroom": "SunShroom.png",
    "blover": "Blover.png",
    "cattail": "CattailLour.png",
    "cactus": "Cactus.png",
    "magnetshroom": "MagnetShroom.png",
    "melon": "Melon.png",
    "pumpkin": "Pumpkin.png",
    "garlic": "Garlic.png",
    "umbrella": "Umbrellaleaf.png",
}

# 定义主要僵尸资源映射
zombie_mapping = {
    "normal": "ConeZombie.png",  # 普通僵尸用路障僵尸作为基础
    "cone": "ConeZombie.png",
    "bucket": "BucketZombie.png",
    "flag": "FlagZombie.png",
    "polevault": "PoleVaultingZombie.png",
    "newspaper": "NewspaperZombie.png",
    "screenDoor": "ScreenDoorZombie.png",
    "football": "FootballZombie.png",
}

# 统计
plant_count = 0
zombie_count = 0
error_count = 0

# 处理植物
print("\n=== 导入植物资源 ===")
plants_dir = os.path.join(extracted_dir, "plants")
for plant_id, src_name in plant_mapping.items():
    src_path = os.path.join(plants_dir, src_name)
    dst_path = os.path.join(output_dir, "plants", f"{plant_id}.png")
    
    if os.path.exists(src_path):
        shutil.copy2(src_path, dst_path)
        plant_count += 1
        print(f"✓ {plant_id} <- {src_name}")
    else:
        print(f"✗ {plant_id} <- {src_name} (未找到)")
        error_count += 1

# 处理僵尸
print("\n=== 导入僵尸资源 ===")
zombies_dir = os.path.join(extracted_dir, "zombies")
for zombie_id, src_name in zombie_mapping.items():
    src_path = os.path.join(zombies_dir, src_name)
    dst_path = os.path.join(output_dir, "zombies", f"{zombie_id}.png")
    
    if os.path.exists(src_path):
        shutil.copy2(src_path, dst_path)
        zombie_count += 1
        print(f"✓ {zombie_id} <- {src_name}")
    else:
        print(f"✗ {zombie_id} <- {src_name} (未找到)")
        error_count += 1

# 复制UI资源
print("\n=== 导入UI资源 ===")
ui_files = [
    ("Almanac_PlantBack.png", "almanac_plant_back.png"),
    ("Almanac_PlantCard.png", "almanac_plant_card.png"),
    ("Almanac_ZombieBack.png", "almanac_zombie_back.png"),
    ("Almanac_ZombieCard.png", "almanac_zombie_card.png"),
    ("AlmanacPlant.png", "almanac_plant_main.png"),
    ("Almanac_ZombieWindow.png", "almanac_zombie_window.png"),
]

for src_name, dst_name in ui_files:
    src_path = os.path.join(plants_dir, src_name)
    if not os.path.exists(src_path):
        src_path = os.path.join(zombies_dir, src_name)
    
    if os.path.exists(src_path):
        dst_path = os.path.join(output_dir, "ui", dst_name)
        shutil.copy2(src_path, dst_path)
        print(f"✓ {dst_name}")

print("\n" + "=" * 60)
print("导入完成!")
print("=" * 60)
print(f"植物: {plant_count} 个")
print(f"僵尸: {zombie_count} 个")
print(f"失败: {error_count} 个")
print(f"\n输出目录: {output_dir}")