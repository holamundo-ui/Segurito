const imaps = require('imap-simple');
const { exec } = require('child_process');

const config = {
    imap: {
        user: 'ezeuielalvares466@gmail.com',
        password: '0000',
        host: 'imap.gmail.com', // Cambia esto según tu servidor de correo
        port: 993,
        tls: true,
        authTimeout: 3000
    }
};

// Función para verificar correos cada 5 minutos
async function verificarCorreos() {
    try {
        console.log('Conectando al servidor de correo...');
        const connection = await imaps.connect(config);
        console.log('Conexión establecida.');
        await connection.openBox('INBOX');
        console.log('Bandeja de entrada abierta.');

        // Buscar correos no leídos
        const searchCriteria = ['UNSEEN']; // Puedes cambiar a ['UNSEEN'] para no leídos
        const fetchOptions = { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'] };

        const mensajes = await connection.search(searchCriteria, fetchOptions);
        console.log('Correos encontrados:', mensajes.length);

        for (const msg of mensajes) {
            const body = msg.parts.filter(part => part.which === 'TEXT')[0].body.trim();
            const asunto = msg.parts.filter(part => part.which === 'HEADER.FIELDS (FROM TO SUBJECT DATE)')[0].body.subject[0].toLowerCase().trim();

            // Eliminar cualquier carácter que no sea letra
            const usuario = body.replace(/[^a-zA-Z]/g, '').trim();

            if (!usuario) {
                console.error('Formato de correo no válido: nombre de usuario no encontrado.');
                continue;
            }

            // Verificar el asunto del correo para determinar la acción
            let accion;
            if (asunto.includes('desbloqueo')) {
                accion = 'desbloquear';
            } else if (asunto.includes('cambio de contraseña')) {
                accion = 'rehabilitar';
            } else {
                console.error('Asunto del correo no válido:', asunto);
                continue;
            }

            console.log(`Procesando solicitud para el usuario: ${usuario}, acción: ${accion}`);
            ejecutarAutomatizacion(usuario, accion);
        }

        await connection.end();
    } catch (error) {
        console.error('Error al verificar correos:', error);
    }
}

// Ejecutar la automatización
function ejecutarAutomatizacion(usuario, accion) {
    const script = accion === 'desbloquear' 
        ? `C:\\Users\\ggonzalez\\Desktop\\jiji\\automatizacion.js ${usuario}`
        : `C:\\Users\\ggonzalez\\Desktop\\jiji\\automatizacion.js ${usuario}`;

    exec(script, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error ejecutando el script para ${usuario}:`, error);
            return;
        }
        console.log(`Resultado para ${usuario}:, stdout`);
    });
}

// Verificar correos cada 5 minutos
setInterval(verificarCorreos, 300000); // 300000ms = 5 minutos
