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

echo [1/2] Parando o Tunel do Cloudflare (Liberando para a Live)...
net stop Cloudflared >nul 2>&1

echo [2/2] Fechando o Proxy e o Integrador do RadioBOSS...
taskkill /f /im python.exe >nul 2>&1

echo.
echo ============================================
echo   Sistemas da Radio parados com sucesso!
echo   (Tunel liberado para uso no PC da Live)
echo ============================================
timeout /t 3
