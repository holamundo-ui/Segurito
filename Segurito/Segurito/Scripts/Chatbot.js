function getBotResponse(input) {
    if (input.toLowerCase().includes('clave')) {
        return 'Puedo ayudarte a cambiar tu clave. ¿Cuál es tu nombre de usuario?';
    } else if (input.toLowerCase().startsWith('usuario')) {
        const username = input.split(' ')[1];
        unlockUser(username);
        return Procesando desbloqueo para el usuario ${username}...;
    }
    return 'Lo siento, no entiendo tu solicitud.';
}

function unlockUser(username) {
    fetch('/unlock', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
    })
    .then(response => response.text())
    .then(data => addMessage(data, 'bot-message'))
    .catch(error => addMessage('Error al desbloquear usuario', 'bot-message'));
}