#!/usr/bin/env python3
"""
小推车部件拼合脚本
将19个LawnMower部件拼合成完整的小推车精灵图
"""

from PIL import Image
import os

# 路径配置
ui_dir = r'D:\实训\pvz-game\游戏资源\UI'
output_dir = r'D:\实训\pvz-game\images\ui'
output_path = os.path.join(output_dir, 'lawnmower.png')

# 创建输出目录
os.makedirs(output_dir, exist_ok=True)

# 加载所有部件
print("正在加载部件...")
parts = {}
for filename in os.listdir(ui_dir):
    if filename.lower().startswith('lawnmower') and filename.endswith('.png'):
        part_name = filename.replace('LawnMower_', '').replace('.png', '')
        filepath = os.path.join(ui_dir, filename)
        try:
            img = Image.open(filepath).convert('RGBA')
            parts[part_name] = img
            print(f"  已加载: {part_name} ({img.size[0]}x{img.size[1]})")
        except Exception as e:
            print(f"  加载失败: {part_name} - {e}")

print(f"\n共加载 {len(parts)} 个部件")

# 检查必需部件
if 'body' not in parts:
    print("错误: 缺少必需部件 'body'")
    exit(1)

# 获取body尺寸作为参考
body = parts['body']
print(f"\nBody尺寸: {body.size[0]}x{body.size[1]}")

# 创建画布 - 使用较大尺寸以容纳所有部件
# 根据典型PvZ小推车布局：body在中间，车轮在两侧
canvas_width = body.width + 300  # 为车轮预留空间
canvas_height = body.height + 200  # 为特效预留空间

print(f"创建画布: {canvas_width}x{canvas_height}")
canvas = Image.new('RGBA', (canvas_width, canvas_height), (0, 0, 0, 0))

# 定位参考点：body放置在画布中心附近
body_x = 150
body_y = 100
canvas.paste(body, (body_x, body_y), body)
print(f"放置 body 在 ({body_x}, {body_y})")

# 放置engine（在body上方）
if 'engine' in parts:
    engine = parts['engine']
    # engine居中放置在body上方
    engine_x = body_x + (body.width - engine.width) // 2
    engine_y = body_y - engine.height + 50  # 调整位置
    canvas.paste(engine, (engine_x, engine_y), engine)
    print(f"放置 engine 在 ({engine_x}, {engine_y})")

# 放置前轮（body右侧）
for wheel_name in ['frontwheel1', 'frontwheel2']:
    if wheel_name in parts:
        wheel = parts[wheel_name]
        wheel_x = body_x + body.width - 20
        wheel_y = body_y + body.height - wheel.height + 30
        canvas.paste(wheel, (wheel_x, wheel_y), wheel)
        print(f"放置 {wheel_name} 在 ({wheel_x}, {wheel_y})")

# 放置后轮（body左侧）
for wheel_name in ['backwheel1', 'backwheel2']:
    if wheel_name in parts:
        wheel = parts[wheel_name]
        wheel_x = body_x - wheel.width + 20
        wheel_y = body_y + body.height - wheel.height + 30
        canvas.paste(wheel, (wheel_x, wheel_y), wheel)
        print(f"放置 {wheel_name} 在 ({wheel_x}, {wheel_y})")

# 放置车轮连接件
for piece_name in ['frontwheelpiece1', 'frontwheelpiece2', 'backwheelpiece1', 'backwheelpiece2', 'wheelpiece']:
    if piece_name in parts:
        piece = parts[piece_name]
        if 'front' in piece_name:
            piece_x = body_x + body.width - 40
        else:
            piece_x = body_x - piece.width + 40
        piece_y = body_y + body.height - piece.height + 40
        canvas.paste(piece, (piece_x, piece_y), piece)
        print(f"放置 {piece_name} 在 ({piece_x}, {piece_y})")

# 放置车轮光泽效果
for shine_name in ['frontshine1', 'frontshine2']:
    if shine_name in parts and 'frontwheel1' in parts:
        shine = parts[shine_name]
        ref_wheel = parts['frontwheel1']
        shine_x = body_x + body.width - 20 + (ref_wheel.width - shine.width) // 2
        shine_y = body_y + body.height - ref_wheel.height + 30 - 10
        canvas.paste(shine, (shine_x, shine_y), shine)
        print(f"放置 {shine_name} 在 ({shine_x}, {shine_y})")

for shine_name in ['backshine1', 'backshine2']:
    if shine_name in parts and 'backwheel1' in parts:
        shine = parts[shine_name]
        ref_wheel = parts['backwheel1']
        shine_x = body_x - ref_wheel.width + 20 + (ref_wheel.width - shine.width) // 2
        shine_y = body_y + body.height - ref_wheel.height + 30 - 10
        canvas.paste(shine, (shine_x, shine_y), shine)
        print(f"放置 {shine_name} 在 ({shine_x}, {shine_y})")

# 放置排气管（左侧）
if 'exhaust' in parts:
    exhaust = parts['exhaust']
    exhaust_x = body_x - exhaust.width + 10
    exhaust_y = body_y + body.height // 2 - exhaust.height // 2
    canvas.paste(exhaust, (exhaust_x, exhaust_y), exhaust)
    print(f"放置 exhaust 在 ({exhaust_x}, {exhaust_y})")

# 放置拉手（右侧）
if 'pull' in parts:
    pull = parts['pull']
    pull_x = body_x + body.width - pull.width + 10
    pull_y = body_y + body.height // 2 - pull.height // 2
    canvas.paste(pull, (pull_x, pull_y), pull)
    print(f"放置 pull 在 ({pull_x}, {pull_y})")

# 放置装饰性engine（如果存在）
if 'engine_tricked' in parts:
    engine_tricked = parts['engine_tricked']
    et_x = body_x + (body.width - engine_tricked.width) // 2
    et_y = body_y - engine_tricked.height + 30
    canvas.paste(engine_tricked, (et_x, et_y), engine_tricked)
    print(f"放置 engine_tricked 在 ({et_x}, {et_y})")

# 放置额外车轮（如果存在）
if 'wheel2' in parts:
    wheel2 = parts['wheel2']
    w2_x = body_x + body.width + 10
    w2_y = body_y + body.height - wheel2.height + 30
    canvas.paste(wheel2, (w2_x, w2_y), wheel2)
    print(f"放置 wheel2 在 ({w2_x}, {w2_y})")

# 裁剪画布到实际内容
print("\n裁剪画布...")
bbox = canvas.getbbox()
if bbox:
    canvas = canvas.crop(bbox)
    print(f"裁剪后尺寸: {canvas.size[0]}x{canvas.size[1]}")

# 保存结果
print(f"\n保存到: {output_path}")
canvas.save(output_path)

# 关闭所有图片
for part in parts.values():
    part.close()

print("\n完成！小推车拼合成功。")
print(f"输出文件: {output_path}")
print(f"最终尺寸: {canvas.size[0]}x{canvas.size[1]}")