# ==============================================================================
# SCRIPT DE INSTALAÇÃO AUTOMATIZADA: RÁDIO ITAIMBÉ 87.9 FM
# Instalação local do Servidor de Vídeo (Owncast) + FFmpeg + Cloudflare Tunnel
# Executar este script como ADMINISTRADOR no Windows.
# ==============================================================================

# Configurar encoding para utf-8 e parar caso ocorra erros
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  INSTALADOR AUTOMÁTICO: SERVIDOR RÁDIO ITAIMBÉ 87.9 FM" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verificar privilégios de Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "ERRO CRÍTICO: Este instalador DEVE ser executado como Administrador. Clique com o botão direito no PowerShell e escolha 'Executar como Administrador'."
    Exit
}

# 2. Definição de Diretórios e URLs
$baseDir = "C:\RadioItaimbeServer"
$owncastDir = "$baseDir\owncast"
$ffmpegDir = "$baseDir\ffmpeg"
$binDir = "$baseDir\bin"
$logsDir = "$baseDir\logs"
$tempDir = "$baseDir\temp"

$urlOwncast = "https://github.com/owncast/owncast/releases/download/v0.1.3/owncast-0.1.3-windows-64bit.zip"
# FFmpeg Static Builds (essentials zip)
$urlFfmpeg = "https://github.com/GyanD/codexffmpeg/releases/download/6.0/ffmpeg-6.0-essentials_build.zip"
# Cloudflared Windows executable
$urlCloudflared = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"

# Criar estrutura de diretórios
Write-Host "`n[1/7] Criando diretórios do sistema..." -ForegroundColor Yellow
New-Item -Path $baseDir -ItemType Directory -Force | Out-Null
New-Item -Path $owncastDir -ItemType Directory -Force | Out-Null
New-Item -Path $ffmpegDir -ItemType Directory -Force | Out-Null
New-Item -Path $binDir -ItemType Directory -Force | Out-Null
New-Item -Path $logsDir -ItemType Directory -Force | Out-Null
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
Write-Host "✓ Diretórios criados em $baseDir" -ForegroundColor Green

# 3. Baixar e Instalar FFmpeg
Write-Host "`n[2/7] Baixando e extraindo o FFmpeg..." -ForegroundColor Yellow
$zipFfmpeg = "$tempDir\ffmpeg.zip"
if (-not (Test-Path "$binDir\ffmpeg.exe")) {
    Write-Host "Fazendo download do FFmpeg..."
    Invoke-WebRequest -Uri $urlFfmpeg -OutFile $zipFfmpeg -UseBasicParsing
    
    Write-Host "Extraindo FFmpeg..."
    Expand-Archive -Path $zipFfmpeg -DestinationPath $tempDir -Force
    
    # Mover os binários (ffmpeg.exe e ffprobe.exe) para o binDir
    $extractedFfmpegDir = Get-ChildItem -Path $tempDir -Filter "ffmpeg-*" -Directory | Select-Object -First 1
    Move-Item -Path "$($extractedFfmpegDir.FullName)\bin\*" -Destination $binDir -Force
    Write-Host "✓ FFmpeg instalado com sucesso no sistema." -ForegroundColor Green
} else {
    Write-Host "✓ FFmpeg já instalado. Pulando download." -ForegroundColor Green
}

# 4. Baixar e Instalar Owncast
Write-Host "`n[3/7] Baixando e extraindo o Owncast..." -ForegroundColor Yellow
$zipOwncast = "$tempDir\owncast.zip"
if (-not (Test-Path "$owncastDir\owncast.exe")) {
    Write-Host "Fazendo download do Owncast..."
    Invoke-WebRequest -Uri $urlOwncast -OutFile $zipOwncast -UseBasicParsing
    
    Write-Host "Extraindo Owncast..."
    Expand-Archive -Path $zipOwncast -DestinationPath $owncastDir -Force
    Write-Host "✓ Owncast instalado com sucesso em $owncastDir" -ForegroundColor Green
} else {
    Write-Host "✓ Owncast já instalado. Pulando download." -ForegroundColor Green
}

# 5. Adicionar FFmpeg ao PATH e configurar Owncast
Write-Host "`n[4/7] Configurando variáveis de ambiente..." -ForegroundColor Yellow
# Registrar binDir no PATH da máquina caso não esteja lá
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentPath -notlike "*$binDir*") {
    $newPath = $currentPath + ";" + $binDir
    [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
    $env:Path += ";$binDir"
    Write-Host "✓ Pasta de binários adicionada ao PATH do sistema." -ForegroundColor Green
} else {
    Write-Host "✓ Diretório de binários já está no PATH." -ForegroundColor Green
}

# 6. Configurar Regras de Firewall do Windows
Write-Host "`n[5/7] Configurando Firewall do Windows..." -ForegroundColor Yellow
# Porta do Owncast Web (8080) e RTMP Streaming (1935)
New-NetFirewallRule -DisplayName "Owncast Web Server (8080)" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null
New-NetFirewallRule -DisplayName "Owncast RTMP Stream Ingest (1935)" -Direction Inbound -LocalPort 1935 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null
Write-Host "✓ Portas 8080 (Web) e 1935 (RTMP/OBS) liberadas no firewall local." -ForegroundColor Green

# 7. Configuração do Túnel do Cloudflare (cloudflared)
Write-Host "`n[6/7] Configurando o Túnel Cloudflare para TV Itaimbé..." -ForegroundColor Yellow
$exeCloudflared = "$binDir\cloudflared.exe"
if (-not (Test-Path $exeCloudflared)) {
    Write-Host "Baixando executável do cloudflared..."
    Invoke-WebRequest -Uri $urlCloudflared -OutFile $exeCloudflared -UseBasicParsing
    Write-Host "✓ Cloudflared baixado com sucesso." -ForegroundColor Green
}

Write-Host "`nPara expor a TV Itaimbé na internet de forma segura," -ForegroundColor Cyan
Write-Host "você precisa colar o TOKEN do túnel criado no painel da Cloudflare." -ForegroundColor Cyan
Write-Host "Caso ainda não tenha o Token, você poderá pular e configurar depois." -ForegroundColor Cyan
$cfToken = Read-Host "Cole aqui o TOKEN do seu Cloudflare Tunnel (ou pressione ENTER para pular)"

if (-not [string]::IsNullOrEmpty($cfToken)) {
    Write-Host "Instalando serviço do Cloudflare Tunnel..."
    # Executar instalação do serviço utilizando o token fornecido
    Start-Process -FilePath $exeCloudflared -ArgumentList "service install $cfToken" -Wait -NoNewWindow
    Write-Host "✓ Serviço Cloudflare Tunnel instalado e iniciado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "⚠ Instalação do Cloudflare Tunnel ignorada. Você precisará rodar o serviço manualmente depois." -ForegroundColor Yellow
}

# 8. Criar Atalhos na Área de Trabalho do Windows
Write-Host "`n[7/7] Gerando atalhos na Área de Trabalho..." -ForegroundColor Yellow
$WshShell = New-Object -ComObject WScript.Shell
$desktopPath = [System.Environment]::GetFolderPath("Desktop")

# Atalho para Painel de Administração do Owncast (Local)
$shortcutAdmin = $WshShell.CreateShortcut("$desktopPath\Owncast Admin Local.lnk")
$shortcutAdmin.TargetPath = "http://localhost:8080/admin"
$shortcutAdmin.IconLocation = "shell32.dll,14" # Ícone de globo/web
$shortcutAdmin.Save()

# Atalho para iniciar o Owncast localmente (Painel de Inicialização Rápida)
$batchStartOwncast = "$baseDir\Iniciar-Owncast.bat"
"@echo off
cd /d $owncastDir
title Servidor Owncast - Rádio Itaimbé
echo Iniciando Servidor Owncast local na porta 8080 (RTMP na 1935)...
owncast.exe
pause" | Out-File -FilePath $batchStartOwncast -Encoding ascii

$shortcutStart = $WshShell.CreateShortcut("$desktopPath\Iniciar Servidor Owncast.lnk")
$shortcutStart.TargetPath = $batchStartOwncast
$shortcutStart.WorkingDirectory = $owncastDir
$shortcutStart.IconLocation = "shell32.dll,27" # Ícone de play/execução
$shortcutStart.Save()

# 9. Limpar arquivos temporários
Remove-Item -Path $tempDir -Recurse -Force | Out-Null

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  INSTALAÇÃO CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
Write-Host "  Use os atalhos criados na Área de Trabalho para gerenciar." -ForegroundColor Green
Write-Host "  - Iniciar Servidor Owncast: Executa o servidor de TV." -ForegroundColor Green
Write-Host "  - Owncast Admin Local: Abre a página de configuração (senha padrão própria)." -ForegroundColor Green
Write-Host "  Pasta de Instalação: $baseDir" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
