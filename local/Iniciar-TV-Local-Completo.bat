@echo off
title Iniciar TV Itaimbe - Completo (PC da Live)
echo ============================================
echo   Iniciando TV Itaimbe no PC da Live...
echo ============================================
echo.

cd /d "%~dp0"

echo [1/3] Iniciando container do Owncast...
docker compose up -d

echo.
echo [2/3] Iniciando Proxy de Áudio...
start "Proxy de Audio - Radio Itaimbe" /min python stream_proxy.py

echo.
echo [3/3] Iniciando Tunel do Cloudflare...
start "Tunel Cloudflare - TV Itaimbe" /min "C:\RadioItaimbeServer\bin\cloudflared.exe" tunnel run --token eyJhIjoiYThiM2U4ZjJjYjU5Y2VkN2U3NTg0NTdhYTIzZjcxYmEiLCJ0IjoiMDAzZWQyNjktOTMzMS00YjkwLWE5MGUtZDBiODJkZmExMTFkIiwicyI6Ik56YzRaalUxTW1VdE9HWmxNeTAwTmpZd0xUZzBPVEV0WWpWak1tVTFOMkUyWkRRMyJ9 --protocol http2

echo.
echo ============================================
echo   Tudo Pronto!
echo   - Local Admin: http://localhost:8080/admin
echo   - Site Publico: https://tv.radioitaimbe.com.br
echo ============================================
timeout /t 5
