const nodemailer = require('nodemailer');
const xlsx = require('xlsx');
const path = require('path');

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: 'segurito@consejocaba.org.ar',
    pass: 'Seginf*1710*'
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
  greetingTimeout: 10000
});

async function envioCorreo(mailOptions, intentos = 6) {
  try {
    console.log(`Intentando enviar correo... (${7 - intentos}/6)`);
    await transporter.sendMail(mailOptions);
    console.log('Correo enviado con éxito:', mailOptions.subject);
  } catch (error) {
    console.error('Error al enviar el correo:', error.message);
    if (intentos > 1) {
      console.log('Reintentando enviar correo en 7 segundos...');
      setTimeout(() => envioCorreo(mailOptions, intentos - 1), 7000);
    } else {
      console.error('No se pudo enviar el correo después de varios intentos.');
    }
  }
}

function obtenerCorreoUsuario(usuario) {
  const workbook = xlsx.readFile(path.join(__dirname, 'base_de_datos.xlsx'));
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const usuarios = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  const usuarioBuscado = usuario.toLowerCase().trim();
  const usuarioData = usuarios.find(row => row[0] && row[0].toString().toLowerCase().trim() === usuarioBuscado);
  return usuarioData ? usuarioData[1].toString().toLowerCase().trim() : null;
}

async function enviarCorreoDesbloqueo(usuario, remitente) {
  const correoUsuario = obtenerCorreoUsuario(usuario);
  if (!correoUsuario) {
    console.error(`Correo no encontrado para el usuario ${usuario}`);
    return;
  }
  const mailOptions = {
    from: 'segurito@consejocaba.org.ar',
    to: correoUsuario,
    cc: 'ggonzalez@consejocaba.org.ar',
    subject: `Confirmación de desbloqueo para ${usuario}`,
    text: `Estimada/o,\n\nSe procedió a rehabilitar el usuario sin cambio de contraseña.\n\nSaludos cordiales.`
  };
  envioCorreo(mailOptions);
}

async function enviarCorreoCambioClave(usuario, contrasena) {
  const correoUsuario = obtenerCorreoUsuario(usuario);
  if (!correoUsuario) {
    console.error(`Correo no encontrado para el usuario ${usuario}`);
    return;
  }
  const mailOptions = {
    from: 'segurito@consejocaba.org.ar',
    to: correoUsuario,
    cc: 'ggonzalez@consejocaba.org.ar',
    subject: `Cambio de contraseña para ${usuario}`,
    text: `Estimada/o,\n\nSe procedió al cambio de contraseña. A continuación, dejo la nueva clave temporal:\nNueva clave temporal: ${contrasena}\n\nSaludos cordiales.`
  };
  envioCorreo(mailOptions);
}

async function enviarCorreoUsuarioNoRegistrado(usuario, remitente) {
  const mailOptions = {
    from: 'segurito@consejocaba.org.ar',
    to: remitente,
    cc: 'ggonzalez@consejocaba.org.ar',
    subject: `Usuario no encontrado en la base de datos: ${usuario}`,
    text: `Estimado/a,\n\nNo encontramos el usuario "${usuario}" en nuestra base de datos.\n\nPor favor, contáctese con Seguridad Informática o verifique que el usuario esté bien escrito.\n\nSaludos cordiales.`
  };
  envioCorreo(mailOptions);
}

async function enviarCorreoUsuarioNoBloqueado(usuario, remitente) {
  const correoUsuario = obtenerCorreoUsuario(usuario);
  if (!correoUsuario) {
    console.error(`Correo no encontrado para el usuario ${usuario}`);
    return;
  }
  const mailOptions = {
    from: 'segurito@consejocaba.org.ar',
    to: correoUsuario,
    cc: 'ggonzalez@consejocaba.org.ar',
    subject: `Usuario no bloqueado: ${usuario}`,
    text: `Estimado/a,\n\nSu usuario no se encuentra bloqueado.\n\nSaludos cordiales.`
  };
  envioCorreo(mailOptions);
}

async function enviarCorreoCorreoNoCoincide(usuario, remitente) {
  const mailOptions = {
    from: 'segurito@consejocaba.org.ar',
    to: remitente,
    cc: 'ggonzalez@consejocaba.org.ar',
    subject: `El usuario ${usuario} no está informado con este correo`,
    text: `Estimado/a,\n\nEl usuario ${usuario} no está informado con este correo.\n\nSaludos cordiales.`
  };
  envioCorreo(mailOptions);
}

async function enviarCorreoUsuarioNoCoincide(usuario, remitente) {
  const correoUsuario = obtenerCorreoUsuario(usuario);
  if (!correoUsuario) {
    console.error(`Correo no encontrado para el usuario ${usuario}`);
    return;
  }
  const mailOptions = {
    from: 'segurito@consejocaba.org.ar',
    to: correoUsuario,
    cc: 'ggonzalez@consejocaba.org.ar',
    subject: `El correo no está informado con el usuario ${usuario}`,
    text: `Estimado/a,\n\nEl correo no está informado con el usuario ${usuario}.\n\nSaludos cordiales.`
  };
  envioCorreo(mailOptions);
}

module.exports = {
  enviarCorreoDesbloqueo,
  enviarCorreoCambioClave,
  enviarCorreoUsuarioNoRegistrado,
  enviarCorreoUsuarioNoBloqueado,
  enviarCorreoCorreoNoCoincide,
  enviarCorreoUsuarioNoCoincide
};
