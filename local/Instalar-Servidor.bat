@echo off
:: 1. Verificar privilegios de administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    goto :admin
) else (
    echo Solicitando privilegios de administrador...
    :: Reexecutar este mesmo arquivo batch como administrador
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:admin
:: 2. Entrar no diretorio do script e rodar o PowerShell com tratamento de caminhos com espaco
cd /d "%~dp0"
title Instalador Servidor - Radio Itaimbe
echo ==========================================================
echo   Iniciando Instalador Local (Modo Administrador)
echo ==========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -NoExit -File "%~dp0install.ps1"
echo.
echo Processo concluido ou interrompido.
pause
