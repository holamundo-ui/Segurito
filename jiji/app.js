const { ejecutarAutomatizacion } = require('./automatizacion');
const { enviarCorreoExito } = require('./envioCorreo');
const xlsx = require('xlsx');
const path = require('path');

async function procesarSolicitud(usuario, accion) {
    try {
        if (!verificarUsuarioEnBaseDeDatos(usuario)) {
            console.error('Usuario no encontrado en la base de datos:', usuario);
            enviarCorreoError(usuario, 'Usuario no encontrado');
            return;
        }

        const resultado = await ejecutarAutomatizacion(usuario, accion);

        if (resultado.exito) {
            enviarCorreoExito(usuario, accion, resultado.contrasena);
        } else {
            enviarCorreoError(usuario, 'Error en la automatización');
        }
    } catch (error) {
        console.error('Error procesando la solicitud:', error);
        enviarCorreoError(usuario, 'Error interno del sistema');
    }
}

function verificarUsuarioEnBaseDeDatos(usuario) {
    const workbook = xlsx.readFile(path.join(__dirname, 'base_de_datos.xlsx'));
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const usuarios = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    return usuarios.some(row => row[0] === usuario);
}

// Aquí gestionarías la cola y las solicitudes entrantes