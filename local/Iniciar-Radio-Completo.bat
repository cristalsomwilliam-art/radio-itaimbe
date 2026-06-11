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

:: Garantir que o Python do Windows Apps esteja no PATH ao rodar como Admin
set "PATH=%PATH%;C:\Users\crist\AppData\Local\Microsoft\WindowsApps"

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
docker info >nul 2>&1
if %errorlevel% == 0 goto :docker_ok

echo Docker nao esta rodando! Tentando iniciar o Docker Desktop...
net start com.docker.service >nul 2>&1
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
echo Aguardando a inicializacao do Docker (limite de 90 segundos)...
set /a count=0

:wait_docker
set /a count+=1
if %count% gtr 18 (
    echo.
    echo [ERRO] Nao foi possivel iniciar o Docker Desktop automaticamente.
    echo Por favor, abra o Docker Desktop manualmente e tente novamente.
    goto :end_docker
)
timeout /t 5 >nul
docker info >nul 2>&1
if %errorlevel% == 0 goto :docker_success
echo [%count%/18] Aguardando o Docker iniciar...
goto :wait_docker

:docker_success
echo Docker iniciado com sucesso!
goto :end_docker

:docker_ok
echo Docker ja esta rodando.

:end_docker
docker info >nul 2>&1
if %errorlevel% == 0 (
    docker compose up -d
) else (
    echo [ERRO] O container de TV nao pode ser iniciado porque o Docker nao esta rodando.
)

echo.
echo ============================================
echo   Radio e TV Ligadas com Sucesso!
echo   Pode fechar esta janela.
echo ============================================
timeout /t 5

