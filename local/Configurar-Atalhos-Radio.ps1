$WshShell = New-Object -ComObject WScript.Shell
$desktopPath = [System.Environment]::GetFolderPath("Desktop")

# Detectar pasta atual onde o script está sendo rodado
$currentDir = $PSScriptRoot
if ([string]::IsNullOrEmpty($currentDir)) {
    $currentDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
}

# Shortcut for starting Radio
$shortcutStart = $WshShell.CreateShortcut("$desktopPath\Ligar Radio Itaimbe (PC da Radio).lnk")
$shortcutStart.TargetPath = "$currentDir\Iniciar-Radio-Completo.bat"
$shortcutStart.WorkingDirectory = "$currentDir"
$shortcutStart.IconLocation = "shell32.dll,27" # Play/Start icon
$shortcutStart.Save()

# Shortcut for stopping Radio
$shortcutStop = $WshShell.CreateShortcut("$desktopPath\Desligar Radio Itaimbe (PC da Radio).lnk")
$shortcutStop.TargetPath = "$currentDir\Parar-Radio-Completo.bat"
$shortcutStop.WorkingDirectory = "$currentDir"
$shortcutStop.IconLocation = "shell32.dll,131" # Stop icon
$shortcutStop.Save()

Write-Host "Atalhos da rádio criados com sucesso na Área de Trabalho do PC da Rádio!"

