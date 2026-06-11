@echo off
title Parar TV Itaimbe - Completo (PC da Live)
echo ============================================
echo   Parando TV Itaimbe no PC da Live...
echo ============================================
echo.

cd /d "%~dp0"

echo [1/2] Parando container do Owncast...
docker compose down

echo.
echo [2/2] Fechando o Tunel do Cloudflare e o Proxy de Áudio...
taskkill /f /im cloudflared.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1

echo.
echo ============================================
echo   Sistemas da TV desligados com sucesso!
echo ============================================
timeout /t 3
