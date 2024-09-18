const nodemailer = require('nodemailer');

// Función para enviar correo de éxito
function enviarCorreoExito(usuario, correoPersonal, accion, contrasena = '') {
    const transporter = nodemailer.createTransport({
        service: 'outlook',
        auth: {
            user: 'ggonzalez@consejocaba.org.ar',
            pass: 'Gaby29*46*'
        }
    });

    let mailOptions = {
        from: 'tu-casilla@dominio.com',
        to: correoPersonal,
        subject: `Confirmación de ${accion} para ${usuario}`,
        text: `La acción de ${accion} para el usuario ${usuario} fue realizada con éxito.`
    };

    if (accion === 'cambio de contraseña') {
        mailOptions.text += `\n\nLa nueva contraseña es: ${contrasena}`;
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.error('Error al enviar el correo:', error);
        }
        console.log('Correo enviado con éxito:', info.response);
    });
}

// Función para enviar correo de error
function enviarCorreoError(usuario, correoPersonal, mensaje) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'tu-casilla@dominio.com',
            pass: 'tu-contraseña'
        }
    });

    const mailOptions = {
        from: 'tu-casilla@dominio.com',
        to: correoPersonal,
        subject: `Error en la automatización para ${usuario}`,
        text: `Se ha producido un error en la automatización para el usuario ${usuario}.\n\nMensaje de error: ${mensaje}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.error('Error al enviar el correo de error:', error);
        }
        console.log('Correo de error enviado con éxito:', info.response);
    });
}

module.exports = { enviarCorreoExito, enviarCorreoError };