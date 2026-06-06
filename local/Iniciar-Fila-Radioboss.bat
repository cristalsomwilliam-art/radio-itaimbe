@echo off
title Integrador RadioBOSS - Radio Itaimbe
echo ==========================================================
echo   Iniciando Monitor de Pedidos do RadioBOSS
echo ==========================================================
echo.
cd /d "%~dp0"

:: 1. Tentar usar o inicializador 'py'
py --version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Usando inicializador Python 'py'...
    py request_worker.py
    goto :concluido
)

:: 2. Tentar usar o comando 'python'
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Usando comando 'python' padrão...
    python request_worker.py
    goto :concluido
)

echo ----------------------------------------------------------
echo [ERRO] O Windows nao conseguiu encontrar o Python instalado.
echo.
echo Como resolver:
echo 1. Se voce acabou de instalar, tente reiniciar o computador.
echo 2. Se ja reiniciou, execute o instalador do Python que voce baixou
echo    (ex: python-3.12.exe), escolha "Modify" (Modificar) ou "Instalar de novo"
echo    e garanta que a caixinha "Add Python.exe to PATH" esteja marcada.
echo ----------------------------------------------------------
pause
exit /b

:concluido
echo.
pause
