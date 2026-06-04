@echo off
title Servidor de Manutencao - Radio Itaimbe
echo Iniciando Painel de Manutencao Local da Radio Itaimbe...
echo Este painel precisa rodar em modo administrador para gerenciar servicos.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%~dp0maintenance-panel.ps1\"' -Verb RunAs"
echo Iniciado! Pode fechar esta janela. O painel abrira em segundo plano.
timeout /t 3
