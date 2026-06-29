@echo off
title Iniciar Bot do Discord - Radio Itaimbe
chcp 65001 > nul
cls

echo ==========================================================
echo           INICIADOR DO BOT DO DISCORD - RÁDIO ITAIMBÉ     
echo ==========================================================
echo.

set "BOT_DIR=%~dp0..\discord-bot"

if not exist "%BOT_DIR%" (
    echo [ERRO] Pasta do bot não encontrada em: %BOT_DIR%
    pause
    exit /b
)

cd /d "%BOT_DIR%"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] O Node.js não está instalado ou não foi adicionado ao PATH do Windows.
    echo Por favor, instale o Node.js LTS em https://nodejs.org/ e tente novamente.
    echo.
    pause
    exit /b
)

if not exist ".env" (
    echo [AVISO] O arquivo de configuracao .env nao existe!
    echo Criando o arquivo .env a partir do modelo .env.example...
    copy .env.example .env > nul
    echo.
    echo [IMPORTANTE] Por favor, abra o arquivo .env que foi criado na pasta:
    echo "%BOT_DIR%\.env"
    echo e preencha com o seu token do Discord e chaves do Supabase.
    echo.
    echo Abrindo o arquivo .env no Bloco de Notas para você...
    start notepad.exe .env
    echo.
    echo Depois de configurar e salvar o arquivo .env, aperte qualquer tecla para continuar.
    pause
    cls
    goto loop_check_env
)

:loop_check_env
if not exist ".env" (
    echo [ERRO] O arquivo .env ainda não foi criado ou salvo.
    pause
    goto loop_check_env
)

if not exist "node_modules" (
    echo [INFO] Pasta node_modules não encontrada. Instalando dependências...
    echo Isso pode levar alguns instantes. Por favor, aguarde...
    echo.
    call npm install
    if %errorlevel% neq 0 (
      echo.
      echo [ERRO] Falha ao instalar dependências do npm. Verifique sua conexão.
      pause
      exit /b
    )
    echo.
    echo [SUCESSO] Dependências instaladas com sucesso!
    echo.
)

echo [INFO] Iniciando o Bot do Discord...
echo Pressione Ctrl+C para encerrar o bot a qualquer momento.
echo.
echo ----------------------------------------------------------
node index.js
echo ----------------------------------------------------------
echo.
echo [INFO] Bot finalizado.
pause
