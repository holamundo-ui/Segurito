const nodemailer = require('nodemailer');
const xlsx = require('xlsx');
const path = require('path');

function enviarCorreoExito(usuario, accion, contrasena = '') {
    const workbook = xlsx.readFile(path.join(__dirname, 'base_de_datos.xlsx'));
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const usuarios = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    const usuarioData = usuarios.find(row => row[0] === usuario);
    const correoPersonal = usuarioData ? usuarioData[1] : null;
    const correoCorporativo = usuarioData ? usuarioData[2] : null;

    if (!correoPersonal || !correoCorporativo) {
        console.error('Error: Usuario no tiene correos asociados en la base de datos.');
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'tu-casilla@dominio.com',
            pass: 'tu-contraseña'
        }
    });

    let mailOptions = {
        from: 'tu-casilla@dominio.com',
        to: correoPersonal,
        cc: correoCorporativo,
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

module.exports = { enviarCorreoExito };