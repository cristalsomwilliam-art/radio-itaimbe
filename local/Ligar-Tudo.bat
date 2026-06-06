@echo off
title Iniciar Rádio e TV Itaimbé
echo ============================================
echo   Iniciando Rádio e TV Itaimbé...
echo ============================================
echo.
cd /d "%~dp0"

echo [1/3] Iniciando TV (Docker)...
docker compose up -d

echo [2/3] Iniciando Proxy de Áudio...
start "Proxy de Audio - Radio Itaimbe" python stream_proxy.py

echo [3/3] Iniciando Integrador RadioBOSS (Pedidos)...
start "Integrador RadioBOSS - Radio Itaimbe" python request_worker.py

echo.
echo ============================================
echo   Todos os sistemas foram iniciados!
echo ============================================
timeout /t 5
