@echo off
cd /d "%~dp0"
echo 正在提交并推送更新...
git add -A
git commit -m "更新 %date% %time%"
git push
echo 完成！
pause