const async = require('async');
const { ejecutardesbloqueo, ejecutarcambioDeClave } = require('./desbloqueo');
const { enviarCorreoExito, enviarCorreoError } = require('./envioCorreo');
const { iniciarLectorCorreos } = require('./lectorCorreos'); 
const xlsx = require('xlsx');
const path = require('path');

// Configurar la cola con un límite de 1 para procesamiento secuencial
const queue = async.queue(async (task, callback) => {
    try {
        await procesarSolicitud(task.usuario, task.accion);
    } catch (error) {
        console.error('Error en la cola:', error);
    } finally {
        callback(); // Asegúrate de llamar a callback al final
    }
}, 1);

// Función principal para procesar solicitudes
async function procesarSolicitud(usuario, accion) {
    let usuarioValido = false;

    try {
        usuarioValido = verificarUsuarioEnBaseDeDatos(usuario);
        if (!usuarioValido) {
            console.error('Usuario no encontrado en la base de datos:', usuario);
            await enviarCorreoError(usuario, 'Usuario no encontrado en la base de datos');
            return;
        }

        if (accion === 'desbloqueo') {
            await procesarDesbloqueo(usuario);
        } else if (accion === 'cambio de contraseña') {
            await procesarCambioDeClave(usuario);
        }
    } catch (error) {
        console.error('Error procesando la solicitud:', error);
        await enviarCorreoError(usuario, 'Error interno del sistema');
    }
}

// Proceso de desbloqueo
async function procesarDesbloqueo(usuario) {
    const resultado = await ejecutardesbloqueo(usuario, 'desbloqueo');
    if (resultado.exito) {
        await enviarCorreoExito(usuario, 'desbloqueo', resultado.contrasena);
    } else {
        await enviarCorreoError(usuario, 'Error en el desbloqueo');
    }
}

// Proceso de cambio de clave
async function procesarCambioDeClave(usuario) {
    const resultadoDesbloqueo = await ejecutardesbloqueo(usuario, 'desbloqueo');
    if (resultadoDesbloqueo.exito) {
        const resultadoCambio = await ejecutarcambioDeClave(usuario, 'cambio de contraseña');
        if (resultadoCambio.exito) {
            await enviarCorreoExito(usuario, 'cambio de contraseña', resultadoCambio.contrasena);
        } else {
            await enviarCorreoError(usuario, 'Error en el cambio de contraseña');
        }
    } else {
        await enviarCorreoError(usuario, 'Error en el desbloqueo previo');
    }
}

// Verificar si el usuario está en la base de datos
function verificarUsuarioEnBaseDeDatos(usuario) {
    const workbook = xlsx.readFile(path.join(__dirname, 'base_de_datos.xlsx'));
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const usuarios = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    return usuarios.some(row => row[0] === usuario);
}

// Iniciar el lector de correos y agregar la solicitud a la cola
iniciarLectorCorreos((usuario, accion) => {
    console.log(`Recibido correo para usuario: ${usuario}, acción: ${accion}`);
    queue.push({ usuario, accion });
});
