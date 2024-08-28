const puppeteer = require('puppeteer');
const xlsx = require('xlsx');
const path = require('path');

async function iniciarSesionOutlook(page) {
    console.log('Iniciando sesión en Outlook...');
    await page.goto('https://outlook.office.com');
    
    // Completa con los selectores y pasos necesarios para iniciar sesión
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'tu-email@dominio.com');
    await page.click('input[type="submit"]');
    // Completa el resto del proceso de inicio de sesión...

    console.log('Sesión iniciada en Outlook.');
}

async function verificarCorreos() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        await iniciarSesionOutlook(page);

        console.log('Verificando correos en la bandeja de entrada...');
        // Aquí navegas hacia la bandeja de entrada y buscas los correos relevantes
        await page.waitForSelector('selector-de-correo-no-leido', { timeout: 10000 });
        const correos = await page.$$('selector-de-correo-no-leido');

        for (const correo of correos) {
            const asunto = await correo.$eval('selector-del-asunto', el => el.innerText.trim().toLowerCase());
            await correo.click();

            await page.waitForSelector('selector-del-cuerpo-del-correo', { timeout: 10000 });
            const body = await page.$eval('selector-del-cuerpo-del-correo', el => el.innerText.trim());

            const usuario = body.replace(/[^a-zA-Z]/g, '').trim();
            
            let accion;
            if (asunto.includes('desbloqueo')) {
                accion = 'desbloqueo';
            } else if (asunto.includes('cambio de contraseña')) {
                accion = 'cambio de contraseña';
            } else {
                console.error('Asunto del correo no válido:', asunto);
                continue;
            }

            console.log(`Procesando solicitud para el usuario: ${usuario}, acción: ${accion}`);

            const usuarioValido = verificarUsuarioEnBaseDeDatos(usuario);
            if (!usuarioValido) {
                console.error('Usuario no encontrado en la base de datos:', usuario);
                continue; // O notifica a app.js de que el usuario no existe
            }

            // Aquí enviarías la información a app.js
            // Ejemplo:
            enviarInformacionAppJS(usuario, accion);
        }

    } catch (error) {
        console.error('Error en la verificación de correos:', error);
    } finally {
        await browser.close();
    }
}

function verificarUsuarioEnBaseDeDatos(usuario) {
    const workbook = xlsx.readFile(path.join(__dirname, 'base_de_datos.xlsx'));
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const usuarios = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    return usuarios.some(row => row[0] === usuario);
}

function enviarInformacionAppJS(usuario, accion) {
    // Aquí envías la información al archivo app.js, por ejemplo, usando un evento o una cola
    console.log(`Enviando información a app.js: Usuario - ${usuario}, Acción - ${accion}`);
}

verificarCorreos();