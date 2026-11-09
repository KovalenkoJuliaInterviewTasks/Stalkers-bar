@echo off
chcp 65001 >nul
title Stalkers - печать
cd /d "%~dp0"
:loop
node agent.js
echo Программа печати остановилась, перезапуск через 5 секунд...
timeout /t 5 /nobreak >nul
goto loop
