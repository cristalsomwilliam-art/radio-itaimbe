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

echo [1/4] Iniciando o Tunel do Cloudflare...
taskkill /f /im cloudflared.exe >nul 2>&1
start "Tunel Cloudflare - Radio Itaimbe" /min "C:\RadioItaimbeServer\bin\cloudflared.exe" tunnel run --token eyJhIjoiYThiM2U4ZjJjYjU5Y2VkN2U3NTg0NTdhYTIzZjcxYmEiLCJ0IjoiMDAzZWQyNjktOTMzMS00YjkwLWE5MGUtZDBiODJkZmExMTFkIiwicyI6Ik56YzRaalUxTW1VdE9HWmxNeTAwTmpZd0xUZzBPVEV0WWpWak1tVTFOMkUyWkRRMyJ9 --protocol http2

echo [2/4] Iniciando Proxy de Audio...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im py.exe >nul 2>&1
py --version >nul 2>&1
if %errorlevel% == 0 (
    start "Proxy de Audio - Radio Itaimbe" /min py stream_proxy.py
) else (
    start "Proxy de Audio - Radio Itaimbe" /min python stream_proxy.py
)

echo [3/4] Iniciando Integrador RadioBOSS (Pedidos)...
py --version >nul 2>&1
if %errorlevel% == 0 (
    start "Integrador RadioBOSS - Radio Itaimbe" /min py request_worker.py
) else (
    start "Integrador RadioBOSS - Radio Itaimbe" /min python request_worker.py
)

echo [4/4] Iniciando Servidor de TV (Docker Owncast)...
docker compose up -d

echo.
echo ============================================
echo   Radio e TV Ligadas com Sucesso!
echo   Pode fechar esta janela.
echo ============================================
timeout /t 5
