@echo off
cd /d "%~dp0"
cls
echo Iniciando Mesa RPG - Player v11...
echo.
echo Abra/aguarde: http://127.0.0.1:8787/index.html?v=11
echo Para parar, feche esta janela ou pressione CTRL+C.
echo.
start "" "http://127.0.0.1:8787/index.html?v=11"
node server.js
pause
