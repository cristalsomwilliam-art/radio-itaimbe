@echo off
:: 1. Verificar privilegios de administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :admin
) else (
    echo Solicitando privilegios de administrador para parar o tunel...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:admin
title Parar Radio Itaimbe - Completo (PC da Radio)
echo ============================================
echo   Parando Radio Itaimbe no PC da Radio...
echo ============================================
echo.

cd /d "%~dp0"

echo [1/3] Parando Servidor de TV (Docker Owncast)...
docker compose down

echo [2/3] Parando o Tunel do Cloudflare...
net stop Cloudflared >nul 2>&1
taskkill /f /im cloudflared.exe >nul 2>&1

echo [3/3] Fechando o Proxy e o Integrador do RadioBOSS...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im py.exe >nul 2>&1

echo.
echo ============================================
echo   Sistemas da Radio e TV parados com sucesso!
echo ============================================
timeout /t 3
