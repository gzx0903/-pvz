# 直接替换PLANT_SVG对象
import os
import re

game_js = r"D:\实训\pvz-game\game.js"

plant_images = {
    'sunflower': 'images/plants/sunflower.png',
    'peashooter': 'images/plants/peashooter.png',
    'wallnut': 'images/plants/wallnut.png',
    'cherrybomb': 'images/plants/cherrybomb.png',
    'snowpea': 'images/plants/snowpea.png',
    'chomper': 'images/plants/chomper.png',
    'squash': 'images/plants/squash.png',
    'tallnut': 'images/plants/tallnut.png',
    'jalapeno': 'images/plants/jalapeno.png',
}

with open(game_js, 'r', encoding='utf-8') as f:
    content = f.read()

# 构建新的PLANT_SVG
new_plant_svg = "const PLANT_SVG = {\n"
for plant_type, img_path in sorted(plant_images.items()):
    new_plant_svg += f"  {plant_type}: `<img src='{img_path}' width='70' height='70' style='object-fit:contain;' />`,\n"
new_plant_svg += "};\n"

# 查找并替换PLANT_SVG块
# 匹配从 "const PLANT_SVG = {" 到下一个 "};"
pattern = r'const PLANT_SVG = \{[^}]+\};'
match = re.search(pattern, content, re.DOTALL)

if match:
    content = content[:match.start()] + new_plant_svg + content[match.end():]
    print("PLANT_SVG replaced successfully!")
else:
    print("PLANT_SVG block not found")

# 保存
with open(game_js, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done!")