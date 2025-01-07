const async = require('async');
const { ejecutardesbloqueo } = require('./desbloqueo');
const { cambioDeClave } = require('./cambioDeClave');
const { enviarCorreoDesbloqueo, enviarCorreoCambioClave, enviarCorreoUsuarioNoRegistrado, enviarCorreoCorreoNoCoincide, enviarCorreoUsuarioNoBloqueado } = require('./envioCorreos');
const { iniciarLectorCorreos } = require('./lectorCorreos');
const xlsx = require('xlsx');
const path = require('path');

const rutaBaseDeDatos = 'C:\\Users\\ggonzalez\\Desktop\\jiji\\base_de_datos.xlsx';

const queue = async.queue(async (task, callback) => {
  try {
    await procesarSolicitud(task.usuario, task.accion, task.remitente);
  } catch (error) {
    console.error('Error en la cola:', error);
  } finally {
    callback();
  }
}, 1);

async function procesarSolicitud(usuario, accion, remitente) {
  let resultadoProceso = { exito: false, mensaje: '' };
  try {
    const verificacionUsuario = verificarUsuarioEnBaseDeDatos(usuario, remitente);
    
    if (!verificacionUsuario.usuarioValido) {
      if (verificacionUsuario.tipo === 'no_existe') {
        console.log('Usuario no existe en la base de datos. Enviando correo de usuario no registrado.');
        await enviarCorreoUsuarioNoRegistrado(usuario, remitente);
      } else if (verificacionUsuario.tipo === 'correo_no_coincide') {
        console.log('El correo no coincide con el registrado. Enviando correo de correo no coincide.');
        await enviarCorreoCorreoNoCoincide(usuario, remitente);
      }
      return;
    }

    if (accion === 'desbloqueo') {
      resultadoProceso = await procesarDesbloqueo(usuario);
      if (resultadoProceso.exito) {
        await enviarCorreoDesbloqueo(usuario, remitente);
      } else {
        await enviarCorreoUsuarioNoBloqueado(usuario, remitente);
      }
    } else if (accion === 'cambio de contraseña') {
      await ejecutardesbloqueo(usuario, 'desbloqueo');
      resultadoProceso = await procesarCambioDeClave(usuario);
      if (resultadoProceso.exito) {
        await enviarCorreoCambioClave(usuario, resultadoProceso.contrasena, remitente);
      }
    }
  } catch (error) {
    console.error('Error procesando la solicitud:', error);
    resultadoProceso = { exito: false, mensaje: 'Error interno del sistema' };
  }
}

function verificarUsuarioEnBaseDeDatos(usuario, remitente) {
  try {
    const workbook = xlsx.readFile(rutaBaseDeDatos);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const usuarios = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('Buscando usuario:', usuario);
    console.log('Remitente:', remitente);
    
    const usuarioBuscado = usuario.toString().toLowerCase().trim();
    const remitenteNormalizado = remitente.toString().toLowerCase().trim();
    
    const usuarioEncontrado = usuarios.find(row => {
      if (!row[0]) return false;
      return row[0].toString().toLowerCase().trim() === usuarioBuscado;
    });

    if (!usuarioEncontrado) {
      console.log(`Usuario ${usuario} no encontrado en la base de datos`);
      return { usuarioValido: false, mensaje: 'Usuario no encontrado', tipo: 'no_existe' };
    }

    const correoBaseDatos = usuarioEncontrado[1].toString().toLowerCase().trim();
    if (correoBaseDatos !== remitenteNormalizado) {
      console.log(`El correo ${remitente} no coincide con el registrado para el usuario ${usuario}`);
      return { usuarioValido: false, mensaje: 'El correo del remitente no coincide con el registrado', tipo: 'correo_no_coincide' };
    }

    return { usuarioValido: true, mensaje: 'Usuario válido y correo coincidente' };
  } catch (error) {
    console.error('Error al verificar usuario en base de datos:', error);
    return { usuarioValido: false, mensaje: 'Error al verificar usuario' };
  }
}

async function procesarDesbloqueo(usuario) {
  console.log(`Procesando desbloqueo para el usuario: ${usuario}`);
  const resultado = await ejecutardesbloqueo(usuario, 'desbloqueo');
  return { exito: resultado.exito, contrasena: null, mensaje: resultado.exito ? 'Desbloqueo exitoso' : 'Error en el desbloqueo' };
}

async function procesarCambioDeClave(usuario) {
  console.log(`Procesando cambio de clave para el usuario: ${usuario}`);
  const resultadoCambio = await cambioDeClave(usuario);
  return { exito: resultadoCambio.exito, contrasena: resultadoCambio.contrasena, mensaje: resultadoCambio.exito ? 'Cambio de contraseña exitoso' : 'Error en el cambio de contraseña' };
}

async function verificarSiUsuarioEstaBloqueado(usuario) {
  const resultado = await ejecutardesbloqueo(usuario, 'verificarBloqueo');
  return resultado.exito;
}

iniciarLectorCorreos(async (usuario, accion, remitente) => {
  console.log(`Recibido correo para usuario: ${usuario}, acción: ${accion}, remitente: ${remitente}`);
  const datosUsuario = verificarUsuarioEnBaseDeDatos(usuario, remitente);
  
  if (!datosUsuario.usuarioValido) {
    console.log('Usuario no válido o correo no coincide. Enviando correo correspondiente.');
    if (datosUsuario.tipo === 'no_existe') {
      await enviarCorreoUsuarioNoRegistrado(usuario, remitente);
    } else if (datosUsuario.tipo === 'correo_no_coincide') {
      await enviarCorreoCorreoNoCoincide(usuario, remitente);
    }
    return;
  }
  
  queue.push({ usuario, accion: accion === 'cambio de clave' ? 'cambio de contraseña' : accion, remitente });
});

module.exports = { procesarCambioDeClave, procesarDesbloqueo };
