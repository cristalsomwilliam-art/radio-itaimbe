@echo off
title Servidor TV Itaimbe (Docker)
echo Iniciando container do Owncast...
cd /d "%~dp0"
docker compose up -d
echo.
echo Servidor iniciado em segundo plano na porta 8080!
echo Acesse: http://localhost:8080/admin
timeout /t 5
