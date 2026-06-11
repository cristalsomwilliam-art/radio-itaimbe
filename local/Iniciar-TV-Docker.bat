@echo off
:: 1. Verificar privilegios de administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :admin
) else (
    echo Solicitando privilegios de administrador para iniciar o Docker da TV...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:admin
title Servidor TV Itaimbe (Docker)
cd /d "%~dp0"

:: Garantir que o Python do Windows Apps esteja no PATH ao rodar como Admin
set "PATH=%PATH%;C:\Users\crist\AppData\Local\Microsoft\WindowsApps"

echo Iniciando container do Owncast...
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
    echo.
    echo Servidor iniciado em segundo plano na porta 8080!
    echo Acesse: http://localhost:8080/admin
) else (
    echo [ERRO] O container de TV nao pode ser iniciado porque o Docker nao esta rodando.
)
timeout /t 5

