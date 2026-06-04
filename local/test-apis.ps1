# ==============================================================================
# UTILIÁRIO DE TESTE DE APIs: RÁDIO ITAIMBÉ 87.9 FM
# Envia requisições de teste simuladas para validar o funcionamento do site.
# ==============================================================================

$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         TESTE DE APIS - RÁDIO ITAIMBÉ" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Definir URL Base (Local ou Vercel)
$siteUrl = Read-Host "Digite a URL do seu site (Pressione ENTER para usar: http://localhost:3000)"
if ([string]::IsNullOrEmpty($siteUrl)) {
    $siteUrl = "http://localhost:3000"
}

# Remover barra no final se houver
if ($siteUrl.EndsWith("/")) {
    $siteUrl = $siteUrl.Substring(0, $siteUrl.Length - 1)
}

# 2. Escolher qual API testar
Write-Host "`nSelecione o teste que deseja executar:" -ForegroundColor Yellow
Write-Host "1. Simular troca de música (RadioBOSS)"
Write-Host "2. Simular início de Live da TV (Owncast)"
Write-Host "3. Simular encerramento de Live da TV (Owncast)"
Write-Host "4. Sair"
$opcao = Read-Host "Opção (1-4)"

switch ($opcao) {
    "1" {
        $token = Read-Host "Digite o token do RadioBOSS (Pressione ENTER para: itaimbe_secret_token_879)"
        if ([string]::IsNullOrEmpty($token)) { $token = "itaimbe_secret_token_879" }
        
        $artist = Read-Host "Nome do Artista (ENTER para: Alok)"
        if ([string]::IsNullOrEmpty($artist)) { $artist = "Alok" }
        
        $song = Read-Host "Nome da Música (ENTER para: Hear Me Now)"
        if ([string]::IsNullOrEmpty($song)) { $song = "Hear Me Now" }

        $listeners = Read-Host "Quantidade de ouvintes (ENTER para: 38)"
        if ([string]::IsNullOrEmpty($listeners)) { $listeners = "38" }

        $url = "$siteUrl/api/radioboss-metadata?pass=$token&artist=$([uri]::EscapeDataString($artist))&title=$([uri]::EscapeDataString($song))&listeners=$listeners"
        
        Write-Host "`nEnviando requisição para: $url" -ForegroundColor Gray
        try {
            $response = Invoke-RestMethod -Uri $url -Method Get
            Write-Host "`n✓ Sucesso! Resposta do servidor:" -ForegroundColor Green
            $response | ConvertTo-Json
        } catch {
            Write-Host "`n❌ Erro ao enviar requisição. Verifique se o servidor está rodando ou se a URL está correta." -ForegroundColor Red
            Write-Host $_.Exception.Message -ForegroundColor Red
        }
    }
    
    "2" {
        $secret = Read-Host "Digite o segredo do Webhook Owncast (Pressione ENTER para: itaimbe_owncast_secret_879)"
        if ([string]::IsNullOrEmpty($secret)) { $secret = "itaimbe_owncast_secret_879" }

        $title = Read-Host "Nome do Programa da Live (ENTER para: Ao Vivo Especial)"
        if ([string]::IsNullOrEmpty($title)) { $title = "Ao Vivo Especial" }

        $url = "$siteUrl/api/owncast-webhook?secret=$secret"
        $body = @{
            type = "STREAM_STARTED"
            eventData = @{
                stream = @{
                    title = $title
                }
            }
        } | ConvertTo-Json

        Write-Host "`nEnviando POST para: $url" -ForegroundColor Gray
        try {
            $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
            Write-Host "`n✓ Sucesso! Resposta do servidor:" -ForegroundColor Green
            $response | ConvertTo-Json
        } catch {
            Write-Host "`n❌ Erro ao enviar webhook. Verifique se o servidor está rodando ou se a URL está correta." -ForegroundColor Red
            Write-Host $_.Exception.Message -ForegroundColor Red
        }
    }

    "3" {
        $secret = Read-Host "Digite o segredo do Webhook Owncast (Pressione ENTER para: itaimbe_owncast_secret_879)"
        if ([string]::IsNullOrEmpty($secret)) { $secret = "itaimbe_owncast_secret_879" }

        $url = "$siteUrl/api/owncast-webhook?secret=$secret"
        $body = @{
            type = "STREAM_STOPPED"
        } | ConvertTo-Json

        Write-Host "`nEnviando POST para: $url" -ForegroundColor Gray
        try {
            $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
            Write-Host "`n✓ Sucesso! Resposta do servidor:" -ForegroundColor Green
            $response | ConvertTo-Json
        } catch {
            Write-Host "`n❌ Erro ao enviar webhook. Verifique se o servidor está rodando ou se a URL está correta." -ForegroundColor Red
            Write-Host $_.Exception.Message -ForegroundColor Red
        }
    }
    
    "4" {
        Write-Host "Saindo..."
    }
    
    default {
        Write-Host "Opção inválida." -ForegroundColor Red
    }
}
Write-Host "`nPressione qualquer tecla para sair..."
$null = [Console]::ReadKey($true)
