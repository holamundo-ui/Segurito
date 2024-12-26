const nodemailer = require('nodemailer');
const xlsx = require('xlsx');
const path = require('path');

// Configuración del transportador de correos usando SMTP de Azure con tiempos de espera
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // false para STARTTLS
  auth: {
    user: 'segurito@consejocaba.org.ar',
    pass: 'Seginf*1710*'
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  },
  connectionTimeout: 10000, // Tiempo máximo para la conexión (10 segundos)
  socketTimeout: 10000, // Tiempo máximo del socket (10 segundos)
  greetingTimeout: 10000 // Tiempo de espera para el saludo inicial
});

// Función general para enviar correos con manejo de errores y reintento
async function envioCorreo(mailOptions, intentos = 3) {
  try {
    console.log(`Intentando enviar correo... (${4 - intentos}/3)`);
    await transporter.sendMail(mailOptions);
    console.log('Correo enviado con éxito:', mailOptions.subject);
  } catch (error) {
    console.error('Error al enviar el correo:', error.message);
    if (intentos > 1) {
      console.log('Reintentando enviar correo en 5 segundos...');
      setTimeout(() => envioCorreo(mailOptions, intentos - 1), 6000);
    } else {
      console.error('No se pudo enviar el correo después de varios intentos.');
    }
  }
}

// Función para obtener el correo del usuario desde la base de datos
function obtenerCorreoUsuario(usuario) {
  const workbook = xlsx.readFile(path.join(__dirname, 'base_de_datos.xlsx'));
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const usuarios = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  // Buscar el usuario en la base de datos y devolver su correo
  const usuarioData = usuarios.find(row => row[0] === usuario);
  return usuarioData ? usuarioData[1] : null; // Suponiendo que el correo está en la segunda columna (B)
}

// Función para enviar correo de éxito con desbloqueo
async function enviarCorreoDesbloqueo(usuario, remitente) {
  const correoUsuario = obtenerCorreoUsuario(usuario);
  if (!correoUsuario) {
    console.error(`Correo no encontrado para el usuario ${usuario}`);
    return;
  }
  const mailOptions = {
    from: 'segurito@consejocaba.org.ar',
    to: correoUsuario, // Tomamos el correo del usuario de la base de datos
    cc: 'ggonzalez@consejocaba.org.ar', // Agregamos copia
    subject: `Confirmación de desbloqueo para ${usuario}`,
    text: `Estimada/o,\n\nSe procedió a rehabilitar el usuario sin cambio de contraseña.\n\nSaludos cordiales.`
  };
  envioCorreo(mailOptions); // Llama a la función de envío con reintento
}

// Función para enviar correo de éxito con cambio de contraseña
async function enviarCorreoCambioClave(usuario, contrasena) {
  const correoUsuario = obtenerCorreoUsuario(usuario);
  if (!correoUsuario) {
    console.error(`Correo no encontrado para el usuario ${usuario}`);
    return;
  }
  const mailOptions = {
    from: 'segurito@consejocaba.org.ar',
    to: correoUsuario, // Tomamos el correo del usuario de la base de datos
    cc: 'ggonzalez@consejocaba.org.ar', // Agregamos copia
    subject: `Cambio de contraseña para ${usuario}`,
    text: `Estimada/o,\n\nSe procedió al cambio de contraseña. A continuación, dejo la nueva clave temporal:\nNueva clave temporal: ${contrasena}\n\nSaludos cordiales.`
  };
  envioCorreo(mailOptions); // Llama a la función de envío con reintento
}

// Función para enviar correo de error (usuario no registrado)
async function enviarCorreoUsuarioNoRegistrado(usuario, remitente) {
  const correoUsuario = obtenerCorreoUsuario(usuario);
  if (!correoUsuario) {
    console.error(`Correo no encontrado para el usuario ${usuario}`);
    return;
  }
  const mailOptions = {
    from: 'segurito@consejocaba.org.ar',
    to: correoUsuario, // Tomamos el correo del usuario de la base de datos
    cc: 'ggonzalez@consejocaba.org.ar', // Agregamos copia
    subject: `Usuario no registrado: ${usuario}`,
    text: `Estimada/o,\n\nNo encontramos registros que coincidan con los datos enviados. Por favor, contáctese con Seguridad Informática o verifique que el usuario esté bien escrito.\n\nSaludos cordiales.`
  };
  envioCorreo(mailOptions); // Llama a la función de envío con reintento
}

// Función para enviar correo cuando el usuario no está bloqueado
async function enviarCorreoUsuarioNoBloqueado(usuario, remitente) {
  const correoUsuario = obtenerCorreoUsuario(usuario);
  if (!correoUsuario) {
    console.error(`Correo no encontrado para el usuario ${usuario}`);
    return;
  }
  const mailOptions = {
    from: 'segurito@consejocaba.org.ar',
    to: correoUsuario, // Tomamos el correo del usuario de la base de datos
    cc: 'ggonzalez@consejocaba.org.ar', // Agregamos copia
    subject: `Usuario no bloqueado: ${usuario}`,
    text: `Estimado/a,\n\nSu usuario no se encuentra bloqueado.\n\nSaludos cordiales.`
  };
  envioCorreo(mailOptions); // Llama a la función de envío con reintento
}

// Exportar las funciones
module.exports = {
  enviarCorreoDesbloqueo,
  enviarCorreoCambioClave,
  enviarCorreoUsuarioNoRegistrado,
  enviarCorreoUsuarioNoBloqueado
};