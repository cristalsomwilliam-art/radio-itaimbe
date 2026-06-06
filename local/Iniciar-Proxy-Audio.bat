@echo off
title Proxy de Audio - Radio Itaimbe
echo Iniciando proxy do stream de audio (Porta 8000)...
cd /d "%~dp0"
python stream_proxy.py
pause
