document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('user-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    if (userInput.trim() === "") return;

    addMessage(userInput, 'user-message');
    document.getElementById('user-input').value = '';

    // Aquí puedes agregar lógica para responder al usuario
    const botResponse = getBotResponse(userInput);
    addMessage(botResponse, 'bot-message');
}

function addMessage(message, className) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message ' + className;
    messageElement.innerText = message;
    document.getElementById('messages').appendChild(messageElement);
    document.getElementById('chat-box').scrollTop = document.getElementById('chat-box').scrollHeight;
}

function getBotResponse(input) {
    // Lógica básica del bot
    if (input.toLowerCase().includes('hola')) {
        return '¡Hola! ¿En qué puedo ayudarte hoy?';
    } else if (input.toLowerCase().includes('clave')) {
        return 'Puedo ayudarte a cambiar tu clave. ¿Cuál es tu nombre de usuario?';
    }
    return 'Lo siento, no entiendo tu solicitud.';
}