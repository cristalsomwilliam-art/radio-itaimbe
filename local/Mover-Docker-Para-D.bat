@echo off
title Mover Armazenamento do Docker para o Disco D
:: Verificar privilegios de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Solicitando privilegios de administrador...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"
echo ==========================================================
echo   MOVER ARMAZENAMENTO DO DOCKER PARA O DISCO D
echo ==========================================================
echo.
echo IMPORTANTE: Certifique-se de que o Docker Desktop esta FECHADO
echo (clique com o botao direito no icone perto do relogio e selecione Quit).
echo.
pause

echo.
echo [1/5] Desligando o WSL/Docker...
wsl --shutdown

echo.
echo [2/5] Exportando os dados do Docker para D:\docker-desktop-data-backup.tar...
echo Isso pode levar alguns minutos dependendo do tamanho atual...
if not exist "D:\DockerWSLData" mkdir "D:\DockerWSLData"
wsl --export docker-desktop-data "D:\docker-desktop-data-backup.tar"

echo.
echo [3/5] Removendo os dados do disco C:...
wsl --unregister docker-desktop-data

echo.
echo [4/5] Importando os dados no disco D:\DockerWSLData...
wsl --import docker-desktop-data "D:\DockerWSLData" "D:\docker-desktop-data-backup.tar" --version 2

echo.
echo [5/5] Limpando arquivos temporarios...
del "D:\docker-desktop-data-backup.tar"

echo.
echo ==========================================================
echo   CONCLUIDO COM SUCESSO!
echo   O armazenamento do Docker agora esta no disco D:
echo   Abra o Docker Desktop novamente para iniciar.
echo ==========================================================
pause
