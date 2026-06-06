@echo off
title Desligar Rádio e TV Itaimbé
echo ============================================
echo   Desligando Rádio e TV Itaimbé...
echo ============================================
echo.
cd /d "%~dp0"

echo [1/3] Parando TV (Docker)...
docker compose down

echo [2/3] Parando Proxy de Áudio...
taskkill /f /fi "windowtitle eq Proxy de Audio - Radio Itaimbe" >nul 2>&1

echo [3/3] Parando Integrador RadioBOSS...
taskkill /f /fi "windowtitle eq Integrador RadioBOSS - Radio Itaimbe" >nul 2>&1

echo.
echo ============================================
echo   Todos os sistemas foram desativados!
echo ============================================
timeout /t 5
