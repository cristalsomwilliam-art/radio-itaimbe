@echo off
title Parar Servidor TV Itaimbe (Docker)
echo Parando container do Owncast...
cd /d "%~dp0"
docker compose down
echo Servidor desativado.
timeout /t 3
