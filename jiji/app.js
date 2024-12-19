const async = require('async');
const { ejecutardesbloqueo, ejecutarcambioDeClave } = require('./desbloqueo');
const { 
    enviarCorreoDesbloqueo, 
    enviarCorreoCambioClave, 
    enviarCorreoUsuarioNoRegistrado, 
    enviarCorreoUsuarioNoBloqueado 
} = require('./envioCorreos'); // Cambio aquí
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
    let resultadoProceso = { exito: false, mensaje: '' };

    try {
        usuarioValido = verificarUsuarioEnBaseDeDatos(usuario);
        if (!usuarioValido) {
            console.error('Usuario no encontrado en la base de datos:', usuario);
            resultadoProceso = { 
                exito: false, 
                mensaje: 'Usuario no encontrado en la base de datos' 
            };
        } else {
            if (accion === 'desbloqueo') {
                resultadoProceso = await procesarDesbloqueo(usuario);
            } else if (accion === 'cambio de contraseña') {
                resultadoProceso = await procesarCambioDeClave(usuario);
            }
        }
    } catch (error) {
        console.error('Error procesando la solicitud:', error);
        resultadoProceso = { 
            exito: false, 
            mensaje: 'Error interno del sistema' 
        };
    } finally {
        // Enviar correo según el resultado
        if (resultadoProceso.exito) {
            if (accion === 'desbloqueo') {
                await enviarCorreoDesbloqueo(usuario); // Enviar correo de desbloqueo
            } else if (accion === 'cambio de contraseña') {
                await enviarCorreoCambioClave(usuario, resultadoProceso.contrasena); // Enviar correo de cambio de clave
            }
        } else if (!usuarioValido) {
            await enviarCorreoUsuarioNoRegistrado(usuario); // Enviar correo de usuario no registrado
        } else {
            await enviarCorreoUsuarioNoBloqueado(usuario); // Enviar correo si el usuario no está bloqueado
        }
    }
}

// Proceso de desbloqueo
async function procesarDesbloqueo(usuario) {
    const resultado = await ejecutardesbloqueo(usuario, 'desbloqueo');
    return {
        exito: resultado.exito,
        contrasena: resultado.contrasena,
        mensaje: resultado.exito 
            ? 'Desbloqueo exitoso' 
            : 'Error en el desbloqueo'
    };
}

// Proceso de cambio de clave
async function procesarCambioDeClave(usuario) {
    const resultadoDesbloqueo = await ejecutardesbloqueo(usuario, 'desbloqueo');
    if (resultadoDesbloqueo.exito) {
        const resultadoCambio = await ejecutarcambioDeClave(usuario, 'cambio de contraseña');
        return {
            exito: resultadoCambio.exito,
            contrasena: resultadoCambio.contrasena,
            mensaje: resultadoCambio.exito 
                ? 'Cambio de contraseña exitoso' 
                : 'Error en el cambio de contraseña'
        };
    } else {
        return {
            exito: false,
            mensaje: 'Error en el desbloqueo previo'
        };
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
