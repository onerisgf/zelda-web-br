@echo off
echo ========================================================
echo   Zelda Web - A Link to the Past (PT-BR)
echo ========================================================
echo.
echo Abra no seu navegador:
echo   No PC:     http://localhost:8080
echo   No iPhone: http://192.168.1.2:8080  (conectado no mesmo Wi-Fi)
echo.
echo Pressione Ctrl+C para encerrar o servidor.
echo ========================================================
cd /d "%~dp0"
python -m http.server 8080
pause
