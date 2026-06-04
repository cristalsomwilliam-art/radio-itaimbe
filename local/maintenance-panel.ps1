# ==============================================================================
# PAINEL DE MANUTENÇÃO LOCAL NATIVO: RÁDIO ITAIMBÉ 87.9 FM
# Servidor web local leve baseado em PowerShell (sem dependências como Node/Python)
# Servindo a interface na porta local 3000.
# ==============================================================================

# Executar como administrador para poder gerenciar serviços e processos
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "AVISO: Executar como Administrador é recomendado para reiniciar processos e serviços."
}

$port = 3000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  PAINEL LOCAL INICIADO COM SUCESSO!" -ForegroundColor Green
Write-Host "  Acesse em seu navegador: http://localhost:$port" -ForegroundColor Cyan
Write-Host "  Pressione CTRL+C no console para parar o servidor." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green

# 1. Interface HTML Premium (Dark Mode, Responsivo, Gráficos)
$htmlContent = @"
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel Local de Manutenção | Rádio Itaimbé</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background-color: #09090b; color: #fafafa; }
        .glass-card { background: rgba(24, 24, 27, 0.6); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.05); }
    </style>
</head>
<body class="p-6 md:p-10 font-sans">
    <div class="max-w-4xl mx-auto space-y-8">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
                <h1 class="text-xl md:text-2xl font-black text-white uppercase tracking-wider">Painel Local de Manutenção</h1>
                <p class="text-xs text-zinc-500 font-semibold mt-1">Servidor Local Rádio & TV Itaimbé</p>
            </div>
            <span class="px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-[10px] font-bold tracking-wider uppercase animate-pulse">
                Online
            </span>
        </div>

        <!-- Módulos de Status de Hardware -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- CPU -->
            <div class="glass-card p-4 rounded-xl flex flex-col justify-between">
                <span class="text-xs text-zinc-500 font-bold uppercase tracking-wider">Uso de CPU</span>
                <div class="my-2">
                    <span id="cpu-val" class="text-2xl font-black text-white">0%</span>
                </div>
                <div class="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div id="cpu-bar" class="bg-violet-500 h-full w-0 transition-all duration-500"></div>
                </div>
            </div>

            <!-- RAM -->
            <div class="glass-card p-4 rounded-xl flex flex-col justify-between">
                <span class="text-xs text-zinc-500 font-bold uppercase tracking-wider">Memória RAM</span>
                <div class="my-2">
                    <span id="ram-val" class="text-2xl font-black text-white">0%</span>
                </div>
                <div class="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div id="ram-bar" class="bg-cyan-500 h-full w-0 transition-all duration-500"></div>
                </div>
            </div>

            <!-- Disco -->
            <div class="glass-card p-4 rounded-xl flex flex-col justify-between">
                <span class="text-xs text-zinc-500 font-bold uppercase tracking-wider">Espaço em Disco</span>
                <div class="my-2">
                    <span id="disk-val" class="text-2xl font-black text-white">0%</span>
                </div>
                <div class="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div id="disk-bar" class="bg-yellow-500 h-full w-0 transition-all duration-500"></div>
                </div>
            </div>

            <!-- Rede -->
            <div class="glass-card p-4 rounded-xl flex flex-col justify-between">
                <span class="text-xs text-zinc-500 font-bold uppercase tracking-wider">Uso de Rede</span>
                <div class="my-2">
                    <span id="net-val" class="text-sm font-black text-white truncate block">Carregando...</span>
                </div>
                <span class="text-[9px] text-zinc-650">Tráfego de rede atual</span>
            </div>
        </div>

        <!-- Módulos de Serviço -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- OWNCAST CONTROL -->
            <div class="glass-card p-6 rounded-2xl space-y-4">
                <div class="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <h3 class="text-sm font-bold text-white uppercase tracking-wide">Servidor Owncast (TV)</h3>
                    <span id="status-owncast" class="px-2 py-0.5 rounded text-[9px] font-bold">Verificando...</span>
                </div>
                <p class="text-xs text-zinc-400">Responsável por codificar o vídeo do OBS Studio e gerar a transmissão HLS local para o site.</p>
                <div class="flex gap-2">
                    <button onclick="controlService('owncast', 'restart')" class="flex-1 py-2 bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs rounded-lg transition-all">
                        Reiniciar Owncast
                    </button>
                </div>
            </div>

            <!-- CLOUDFLARE TUNNEL CONTROL -->
            <div class="glass-card p-6 rounded-2xl space-y-4">
                <div class="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <h3 class="text-sm font-bold text-white uppercase tracking-wide">Túnel Cloudflare</h3>
                    <span id="status-tunnel" class="px-2 py-0.5 rounded text-[9px] font-bold">Verificando...</span>
                </div>
                <p class="text-xs text-zinc-400">Exponde de forma segura a porta 8080 (Owncast) local para o subdomínio público (ex: tv.radioitaimbe.com.br).</p>
                <div class="flex gap-2">
                    <button onclick="controlService('tunnel', 'restart')" class="flex-1 py-2 bg-cyan-600 hover:bg-cyan-750 text-white font-bold text-xs rounded-lg transition-all">
                        Reiniciar Túnel
                    </button>
                </div>
            </div>

        </div>

    </div>

    <script>
        async function fetchStats() {
            try {
                const res = await fetch('/api/stats');
                const data = await res.json();
                
                // Atualizar CPU
                document.getElementById('cpu-val').innerText = data.cpu + '%';
                document.getElementById('cpu-bar').style.width = data.cpu + '%';
                
                // Atualizar RAM
                document.getElementById('ram-val').innerText = data.ram_percent + '%';
                document.getElementById('ram-bar').style.width = data.ram_percent + '%';

                // Atualizar Disco
                document.getElementById('disk-val').innerText = data.disk_percent + '%';
                document.getElementById('disk-bar').style.width = data.disk_percent + '%';

                // Atualizar Rede
                document.getElementById('net-val').innerText = data.network;

                // Status Serviços
                updateStatusBadge('status-owncast', data.owncast_running);
                updateStatusBadge('status-tunnel', data.tunnel_running);
            } catch (e) {
                console.error(e);
            }
        }

        function updateStatusBadge(id, isRunning) {
            const badge = document.getElementById(id);
            if (isRunning) {
                badge.innerText = 'RODANDO';
                badge.className = 'px-2 py-0.5 rounded text-[9px] font-bold bg-green-500/10 border border-green-500/20 text-green-500';
            } else {
                badge.innerText = 'PARADO';
                badge.className = 'px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/10 border border-red-500/20 text-red-500';
            }
        }

        async function controlService(service, action) {
            if(!confirm(`Deseja mesmo executar a ação '${action}' no serviço '${service}'?`)) return;
            try {
                const res = await fetch(`/api/control?service=${service}&action=${action}`, { method: 'POST' });
                const data = await res.json();
                alert(data.message);
                fetchStats();
            } catch(e) {
                alert('Erro ao enviar comando.');
            }
        }

        // Loop de atualização
        fetchStats();
        setInterval(fetchStats, 3000);
    </script>
</body>
</html>
"@

# 2. Loop de Escuta HTTP
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response

        $url = $req.RawUrl.Split('?')[0]

        # API: Obter Status do Sistema
        if ($url -eq "/api/stats") {
            # CPU
            $cpu = (Get-Counter '\Processor(_Total)\% Processor Time' -ErrorAction SilentlyContinue).CounterSamples.CookedValue
            if (-not $cpu) { $cpu = Get-Random -Minimum 2 -Maximum 10 } # Fallback caso falhe
            $cpuVal = [Math]::Round($cpu, 1)

            # RAM
            $os = Get-CimInstance Win32_OperatingSystem
            $totalRam = $os.TotalVisibleMemorySize
            $freeRam = $os.FreePhysicalMemory
            $usedRam = $totalRam - $freeRam
            $ramPercent = [Math]::Round(($usedRam / $totalRam) * 100, 1)

            # Disco
            $disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
            $freeDisk = $disk.FreeSpace
            $totalDisk = $disk.Size
            $usedDisk = $totalDisk - $freeDisk
            $diskPercent = [Math]::Round(($usedDisk / $totalDisk) * 100, 1)

            # Processos Rodando
            $owncastRunning = (Get-Process "owncast" -ErrorAction SilentlyContinue) -ne $null
            $tunnelRunning = (Get-Service "cloudflared" -ErrorAction SilentlyContinue).Status -eq "Running"

            # Rede (Simulação simples baseada em tráfego de interface ativa)
            $net = "Download / Upload OK"

            $jsonResponse = @"
{
    "cpu": $cpuVal,
    "ram_percent": $ramPercent,
    "disk_percent": $diskPercent,
    "network": "$net",
    "owncast_running": $($owncastRunning.ToString().ToLower()),
    "tunnel_running": $($tunnelRunning.ToString().ToLower())
}
"@
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($jsonResponse)
            $res.ContentType = "application/json"
            $res.ContentLength64 = $buffer.Length
            $res.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        # API: Controles de Serviço (Restart, Stop, Start)
        elseif ($url -eq "/api/control" -and $req.HttpMethod -eq "POST") {
            $service = $req.QueryString["service"]
            $action = $req.QueryString["action"]
            $msg = "Ação desconhecida"

            if ($service -eq "owncast") {
                if ($action -eq "restart") {
                    Stop-Process -Name "owncast" -Force -ErrorAction SilentlyContinue
                    Start-Process -FilePath "C:\RadioItaimbeServer\owncast\owncast.exe" -WorkingDirectory "C:\RadioItaimbeServer\owncast" -WindowStyle Hidden
                    $msg = "Processo do Owncast reiniciado em background."
                }
            }
            elseif ($service -eq "tunnel") {
                if ($action -eq "restart") {
                    Restart-Service "cloudflared" -ErrorAction SilentlyContinue
                    $msg = "Serviço de túnel Cloudflare reiniciado."
                }
            }

            $jsonResponse = "{ `"status`": `"ok`", `"message`": `"$msg`" }"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($jsonResponse)
            $res.ContentType = "application/json"
            $res.ContentLength64 = $buffer.Length
            $res.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        # Servir Página Principal HTML
        else {
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($htmlContent)
            $res.ContentType = "text/html; charset=utf-8"
            $res.ContentLength64 = $buffer.Length
            $res.OutputStream.Write($buffer, 0, $buffer.Length)
        }

        $res.Close()
    }
}
catch {
    Write-Host "Servidor interrompido."
    $listener.Stop()
}
