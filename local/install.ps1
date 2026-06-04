# ==============================================================================
# SCRIPT DE INSTALACAO AUTOMATIZADA (DOCKER): RADIO ITAIMBE 87.9 FM
# Instalacao do Docker Desktop + Cloudflare Tunnel + Atalhos de Gerenciamento
# Executar este script como ADMINISTRADOR no Windows.
# ==============================================================================

# Configurar encoding e parar caso ocorra erros
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  INSTALADOR DOCKER: SERVIDOR RADIO ITAIMBE 87.9 FM" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verificar privilegios de Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "ERRO CRITICO: Este instalador DEVE ser executado como Administrador."
    Exit
}

# 2. Definicao de Diretorios
$baseDir = "C:\RadioItaimbeServer"
$binDir = "$baseDir\bin"
$logsDir = "$baseDir\logs"
$tempDir = "$baseDir\temp"
# Usar a variavel nativa do PowerShell para obter a pasta onde o script esta rodando
$projectLocalDir = $PSScriptRoot

# Criar estrutura de diretorios locais de logs e configs
Write-Host "`n[1/6] Criando diretorios do sistema..." -ForegroundColor Yellow
New-Item -Path $baseDir -ItemType Directory -Force | Out-Null
New-Item -Path $binDir -ItemType Directory -Force | Out-Null
New-Item -Path $logsDir -ItemType Directory -Force | Out-Null
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
Write-Host "[OK] Diretorios criados em $baseDir" -ForegroundColor Green

# 3. Baixar e Instalar Docker Desktop via Winget
Write-Host "`n[2/6] Verificando instalacao do Docker Desktop..." -ForegroundColor Yellow
$dockerCheck = Get-Command docker -ErrorAction SilentlyContinue
if ($null -eq $dockerCheck) {
    Write-Host "Docker Desktop nao encontrado. Iniciando instalacao silenciosa via winget..." -ForegroundColor Cyan
    Write-Host "Isso pode levar alguns minutos (download de aprox. 500MB)..." -ForegroundColor Gray
    
    # Rodar o comando do Winget para instalar o Docker Desktop
    Start-Process -FilePath "winget" -ArgumentList "install --id Docker.DockerDesktop -e --silent --accept-source-agreements --accept-package-agreements" -Wait -NoNewWindow
    
    Write-Host "[OK] Docker Desktop instalado com sucesso!" -ForegroundColor Green
    Write-Host "IMPORTANTE: O Windows pode exigir um reinicio do sistema para ativar o WSL2/Hyper-V apos a instalacao do Docker." -ForegroundColor Yellow
} else {
    Write-Host "[OK] Docker Desktop ja esta instalado na maquina." -ForegroundColor Green
}

# 4. Configurar Regras de Firewall do Windows
Write-Host "`n[3/6] Configurando Firewall do Windows..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "Owncast Web Server (8080)" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null
New-NetFirewallRule -DisplayName "Owncast RTMP Stream Ingest (1935)" -Direction Inbound -LocalPort 1935 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null
Write-Host "[OK] Portas 8080 (Web) e 1935 (RTMP/OBS) liberadas no firewall do Windows." -ForegroundColor Green

# 5. Instalar Cloudflare Tunnel (cloudflared)
Write-Host "`n[4/6] Configurando o Tunel Cloudflare para TV Itaimbe..." -ForegroundColor Yellow
$exeCloudflared = "$binDir\cloudflared.exe"
$urlCloudflared = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"

if (-not (Test-Path $exeCloudflared)) {
    Write-Host "Baixando executavel do cloudflared..."
    Invoke-WebRequest -Uri $urlCloudflared -OutFile $exeCloudflared -UseBasicParsing
    Write-Host "[OK] Cloudflared baixado com sucesso." -ForegroundColor Green
}

Write-Host "`nPara expor a TV Itaimbe na internet de forma segura," -ForegroundColor Cyan
Write-Host "voce precisa colar o TOKEN do tunel criado no painel da Cloudflare." -ForegroundColor Cyan
$cfToken = Read-Host "Cole aqui o TOKEN do seu Cloudflare Tunnel (ou pressione ENTER para pular)"

if (-not [string]::IsNullOrEmpty($cfToken)) {
    Write-Host "Instalando servico do Cloudflare Tunnel..."
    # Remover servico antigo se existir para evitar conflitos
    Start-Process -FilePath $exeCloudflared -ArgumentList "service uninstall" -Wait -NoNewWindow -ErrorAction SilentlyContinue
    # Instalar novo servico
    Start-Process -FilePath $exeCloudflared -ArgumentList "service install $cfToken" -Wait -NoNewWindow
    Write-Host "[OK] Servico Cloudflare Tunnel instalado como servico do Windows!" -ForegroundColor Green
} else {
    Write-Host "[AVISO] Instalacao do Cloudflare Tunnel ignorada temporariamente." -ForegroundColor Yellow
}

# 6. Criar scripts Batch de inicio rapido do Docker
Write-Host "`n[5/6] Criando scripts de controle do Docker..." -ForegroundColor Yellow

$startBatch = "$projectLocalDir\Iniciar-TV-Docker.bat"
$startBatchContent = @"
@echo off
title Servidor TV Itaimbe (Docker)
echo Iniciando container do Owncast...
cd /d "%~dp0"
docker compose up -d
echo.
echo Servidor iniciado em segundo plano na porta 8080!
echo Acesse: http://localhost:8080/admin
timeout /t 5
"@
$startBatchContent | Out-File -FilePath $startBatch -Encoding ascii

$stopBatch = "$projectLocalDir\Parar-TV-Docker.bat"
$stopBatchContent = @"
@echo off
title Parar Servidor TV Itaimbe (Docker)
echo Parando container do Owncast...
cd /d "%~dp0"
docker compose down
echo Servidor desativado.
timeout /t 3
"@
$stopBatchContent | Out-File -FilePath $stopBatch -Encoding ascii

Write-Host "[OK] Scripts de controle gerados em $projectLocalDir" -ForegroundColor Green

# 7. Criar Atalhos na Area de Trabalho
Write-Host "`n[6/6] Gerando atalhos na Area de Trabalho..." -ForegroundColor Yellow
$WshShell = New-Object -ComObject WScript.Shell
$desktopPath = [System.Environment]::GetFolderPath("Desktop")

# Atalho Iniciar TV
$shortcutStart = $WshShell.CreateShortcut("$desktopPath\Ligar TV Itaimbe (Docker).lnk")
$shortcutStart.TargetPath = $startBatch
$shortcutStart.WorkingDirectory = $projectLocalDir
$shortcutStart.IconLocation = "shell32.dll,27" # Icone de play/execucao
$shortcutStart.Save()

# Atalho Parar TV
$shortcutStop = $WshShell.CreateShortcut("$desktopPath\Desligar TV Itaimbe.lnk")
$shortcutStop.TargetPath = $stopBatch
$shortcutStop.WorkingDirectory = $projectLocalDir
$shortcutStop.IconLocation = "shell32.dll,131" # Icone de desligar/stop
$shortcutStop.Save()

# Atalho Owncast Admin Local
$shortcutAdmin = $WshShell.CreateShortcut("$desktopPath\Owncast Admin Local.lnk")
$shortcutAdmin.TargetPath = "http://localhost:8080/admin"
$shortcutAdmin.IconLocation = "shell32.dll,14" # Icone de globo/web
$shortcutAdmin.Save()

# Limpar temporarios
Remove-Item -Path $tempDir -Recurse -Force | Out-Null

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  INSTALACAO DOCKER CONCLUIDA!" -ForegroundColor Green
Write-Host "  Use os atalhos criados na Area de Trabalho para gerenciar:" -ForegroundColor Green
Write-Host "  - Ligar TV Itaimbe (Docker): Inicia a transmissao em video." -ForegroundColor Green
Write-Host "  - Desligar TV Itaimbe: Pausa a transmissao local." -ForegroundColor Green
Write-Host "  - Owncast Admin Local: Abre a pagina de configuracao." -ForegroundColor Green
Write-Host "  NOTA: Caso o Docker Desktop solicite reiniciar a maquina, reinicie-a." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green
