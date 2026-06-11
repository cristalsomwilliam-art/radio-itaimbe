$WshShell = New-Object -ComObject WScript.Shell
$desktopPath = [System.Environment]::GetFolderPath("Desktop")

# Shortcut for starting Radio
$shortcutStart = $WshShell.CreateShortcut("$desktopPath\Ligar Radio Itaimbe (PC da Radio).lnk")
$shortcutStart.TargetPath = "D:\Projeto Radio Itaimbé\local\Iniciar-Radio-Completo.bat"
$shortcutStart.WorkingDirectory = "D:\Projeto Radio Itaimbé\local"
$shortcutStart.IconLocation = "shell32.dll,27" # Play/Start icon
$shortcutStart.Save()

# Shortcut for stopping Radio
$shortcutStop = $WshShell.CreateShortcut("$desktopPath\Desligar Radio Itaimbe (PC da Radio).lnk")
$shortcutStop.TargetPath = "D:\Projeto Radio Itaimbé\local\Parar-Radio-Completo.bat"
$shortcutStop.WorkingDirectory = "D:\Projeto Radio Itaimbé\local"
$shortcutStop.IconLocation = "shell32.dll,131" # Stop icon
$shortcutStop.Save()

Write-Host "Atalhos da rádio criados com sucesso na Área de Trabalho do PC da Rádio!"
