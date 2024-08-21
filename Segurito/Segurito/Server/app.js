const express = require('express');
const { exec } = require('child_process');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json()); // Para poder recibir JSON

// Endpoint para desbloquear el usuario
app.post('/unlock', (req, res) => {
    const username = req.body.username;
    
    if (!username) {
        return res.status(400).send('No username provided');
    }

    // Ejecutar el script de PowerShell
    exec(powershell.exe -File ./scripts/unlockUser.ps1 -Username ${username}, (error, stdout, stderr) => {
        if (error) {
            console.error(Error: ${stderr});
            return res.status(500).send('Error desbloqueando usuario');
        }
        console.log(Output: ${stdout});
        res.send('Usuario desbloqueado con éxito');
    });
});

app.listen(port, () => {
    console.log(Servidor escuchando en http://localhost:${port});
});