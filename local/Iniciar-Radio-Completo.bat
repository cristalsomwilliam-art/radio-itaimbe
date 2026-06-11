@echo off
:: 1. Verificar privilegios de administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :admin
) else (
    echo Solicitando privilegios de administrador para ligar o tunel...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:admin
title Iniciar Radio Itaimbe - Completo (PC da Radio)
echo ============================================
echo   Iniciando Radio Itaimbe no PC da Radio...
echo ============================================
echo.

cd /d "%~dp0"

echo [1/3] Iniciando o Tunel do Cloudflare...
sc config Cloudflared start= demand >nul 2>&1
net start Cloudflared >nul 2>&1

echo [2/3] Iniciando Proxy de Audio...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im py.exe >nul 2>&1
py --version >nul 2>&1
if %errorlevel% == 0 (
    start "Proxy de Audio - Radio Itaimbe" /min py stream_proxy.py
) else (
    start "Proxy de Audio - Radio Itaimbe" /min python stream_proxy.py
)

echo [3/3] Iniciando Integrador RadioBOSS (Pedidos)...
py --version >nul 2>&1
if %errorlevel% == 0 (
    start "Integrador RadioBOSS - Radio Itaimbe" /min py request_worker.py
) else (
    start "Integrador RadioBOSS - Radio Itaimbe" /min python request_worker.py
)

echo.
echo ============================================
echo   Radio Ligada com Sucesso!
echo   Pode fechar esta janela.
echo ============================================
timeout /t 5
