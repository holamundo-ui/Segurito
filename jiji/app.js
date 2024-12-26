const async = require('async');
const { ejecutardesbloqueo } = require('./desbloqueo');
const { cambioDeClave } = require('./cambioDeClave');
const { 
    enviarCorreoDesbloqueo, 
    enviarCorreoCambioClave, 
    enviarCorreoUsuarioNoRegistrado, 
    enviarCorreoUsuarioNoBloqueado 
} = require('./envioCorreos');
const { iniciarLectorCorreos } = require('./lectorCorreos');
const xlsx = require('xlsx');
const path = require('path');

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
        if (accion === 'desbloqueo') {
            resultadoProceso = await procesarDesbloqueo(usuario);
        } else if (accion === 'cambio de contraseña') {
            resultadoProceso = await procesarCambioDeClave(usuario);
        }

        if (resultadoProceso.exito) {
            if (accion === 'desbloqueo') {
                await enviarCorreoDesbloqueo(usuario, remitente);
            } else if (accion === 'cambio de contraseña') {
                await enviarCorreoCambioClave(usuario, remitente, resultadoProceso.contrasena);
            }
        } else {
            await enviarCorreoUsuarioNoBloqueado(usuario, remitente);
        }
    } catch (error) {
        console.error('Error procesando la solicitud:', error);
        resultadoProceso = { 
            exito: false, 
            mensaje: 'Error interno del sistema' 
        };
    }
}

function verificarUsuarioEnBaseDeDatos(usuario, remitente) {
    const workbook = xlsx.readFile(path.join(__dirname, 'base_de_datos.xlsx'));
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const usuarios = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    const usuarioEncontrado = usuarios.find(row => row[0] === usuario);
    
    if (!usuarioEncontrado) {
        console.log(`Usuario ${usuario} no encontrado en la base de datos`);
        return { 
            usuarioValido: false, 
            mensaje: 'Usuario no encontrado' 
        };
    }

    if (usuarioEncontrado[1] !== remitente) {
        console.log(`El correo ${remitente} no coincide con el registrado para el usuario ${usuario}`);
        return { 
            usuarioValido: false, 
            mensaje: 'El correo del remitente no coincide con el registrado' 
        };
    }

    return { 
        usuarioValido: true, 
        mensaje: 'Usuario válido y correo coincidente' 
    };
}

async function procesarDesbloqueo(usuario) {
    console.log(`Procesando desbloqueo para el usuario: ${usuario}`);
    const resultado = await ejecutardesbloqueo(usuario, 'desbloqueo');
    return {
        exito: resultado.exito,
        contrasena: null,
        mensaje: resultado.exito 
            ? 'Desbloqueo exitoso' 
            : 'Error en el desbloqueo'
    };
}

async function procesarCambioDeClave(usuario) {
    console.log(`Procesando cambio de clave para el usuario: ${usuario}`);
    const resultadoCambio = await cambioDeClave(usuario);
    return {
        exito: resultadoCambio.exito,
        contrasena: resultadoCambio.contrasena,
        mensaje: resultadoCambio.exito 
            ? 'Cambio de contraseña exitoso' 
            : 'Error en el cambio de contraseña'
    };
}

async function verificarSiUsuarioEstaBloqueado(usuario) {
    const resultado = await ejecutardesbloqueo(usuario, 'verificarBloqueo');
    return resultado.exito;
}

iniciarLectorCorreos(async (usuario, accion, remitente) => {
    console.log(`Recibido correo para usuario: ${usuario}, acción: ${accion}, remitente: ${remitente}`);
    
    const datosUsuario = verificarUsuarioEnBaseDeDatos(usuario, remitente);
    
    if (!datosUsuario.usuarioValido) {
        console.log('Usuario no válido o correo no coincide. Enviando correo de usuario no registrado.');
        await enviarCorreoUsuarioNoRegistrado(usuario, remitente);
        return;
    }

    if (accion === 'cambio de clave') {
        const estaBloqueado = await verificarSiUsuarioEstaBloqueado(usuario);
        if (estaBloqueado) {
            console.log(`Usuario ${usuario} está bloqueado, ejecutando desbloqueo.`);
            queue.push({ usuario, accion: 'desbloqueo', remitente });
        } else {
            console.log(`Usuario ${usuario} no está bloqueado, ejecutando cambio de clave.`);
            queue.push({ usuario, accion: 'cambio de contraseña', remitente });
        }
    } else {
        queue.push({ usuario, accion, remitente });
    }
});

module.exports = { procesarCambioDeClave, procesarDesbloqueo };