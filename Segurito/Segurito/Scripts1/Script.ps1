# Desbloquear usuario y forzar cambio de contraseña en el próximo inicio de sesión
Param (
    [string]$Username
)

# Desbloquear la cuenta de usuario
Unlock-ADAccount -Identity $Username

# Forzar el cambio de contraseña
Set-ADUser -Identity $Username -PasswordNeverExpires $false -ChangePasswordAtLogon $true

Write-Output "Usuario desbloqueado y contraseña solicitada al inicio de sesión"