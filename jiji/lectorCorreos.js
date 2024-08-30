const puppeteer = require('puppeteer');
const xlsx = require('xlsx');
const path = require('path');

async function iniciarSesionOutlook(page) {
    console.log('Iniciando sesión en Outlook...');
    await page.goto('https://outlook.office.com');

    // Completa con los selectores y pasos necesarios para iniciar sesión
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'ggonzalez@consejocaba.org.ar');
    await page.click('input[type="submit"]');
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.type('input[type="password"]', '3*');
    await page.click('input[type="submit"]');

    // Completa MFA si es necesario...
    // Aquí podrías esperar e interactuar con MFA si está habilitado

    console.log('Sesión iniciada en Outlook.');
}

async function verificarCorreos() {
    let browser;
    try {
        // Lanzar el navegador
        browser = await puppeteer.launch({
            headless: false,  // Para ver lo que está ocurriendo
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'  // Ruta al navegador Chrome
        });

        const page = await browser.newPage();
        console.log('Navegador lanzado.');

        await iniciarSesionOutlook(page);

        console.log('Verificando correos en la bandeja de entrada...');

        // Hacer clic en el botón de rayas para filtrar correos no leídos
        await page.waitForSelector('#mailListFilterMenu', { timeout: 10000 });
        await page.click('#mailListFilterMenu');

        // Seleccionar la opción "No leído"
        await page.waitForSelector('body > div:nth-child(17) > div > div > div:nth-child(3)', { timeout: 10000 });
        await page.click('body > div:nth-child(17) > div > div > div:nth-child(3)');

        // Esperar y seleccionar el primer correo no leído
        await page.waitForSelector('div[role="row"]', { timeout: 10000 });
        const correos = await page.$$('div[role="row"][aria-label*="No leído"]');

        if (correos.length === 0) {
            console.log('No hay correos no leídos.');
            return;
        }

        // Selecciona el correo no leído más antiguo (último en la lista)
        const correo = correos[correos.length - 1];
        await correo.click();

        console.log('Correo no leído seleccionado.');

        // Espera y obtiene el asunto del correo
        await page.waitForSelector('#ItemReadingPaneContainer > div.ubHDG.Waj3A.bwgAh.pinIo > div > div > div > div > div > div > div > div > span.JdFsz', { timeout: 10000 });
        const asunto = await page.$eval('#ItemReadingPaneContainer > div.ubHDG.Waj3A.bwgAh.pinIo > div > div > div > div > div > div > div > div > span.JdFsz', el => el.innerText.trim().toLowerCase());

        // Espera y obtiene el cuerpo del correo
        await page.waitForSelector('#UniqueMessageBody_24 > div > div > font > span > div', { timeout: 10000 });
        const body = await page.$eval('#UniqueMessageBody_24 > div > div > font > span > div', el => el.innerText.trim());

        // Limpiar el cuerpo del correo para obtener el nombre de usuario sin caracteres especiales
        const usuario = body.replace(/[^a-zA-Z]/g, '').trim();

        // Validar que el usuario sea no vacío
        if (!usuario) {
            console.error('Formato de correo no válido: nombre de usuario no encontrado.');
            return;
        }

        // Definir la acción en función del asunto del correo
        let accion;
        if (asunto.includes('desbloqueo')) {
            accion = 'desbloqueo';
        } else if (asunto.includes('cambio de contraseña')) {
            accion = 'cambio de contraseña';
        } else {
            console.error('Asunto del correo no válido:', asunto);
            return;
        }

        console.log(`Procesando solicitud para el usuario: ${usuario}, acción: ${accion}`);

        const usuarioValido = verificarUsuarioEnBaseDeDatos(usuario);
        if (!usuarioValido) {
            console.error('Usuario no encontrado en la base de datos:', usuario);
            return;
        }

        // Marcar el correo como leído
        console.log('Marcando el correo como leído...');
        await page.waitForSelector('#ItemReadingPaneContainer > div.Q8TCC.yyYQP.customScrollBar > div > div.wide-content-host > div > div.uSg02 > div.DgV2h.l8Tnu > div.lT19A > div > div > div.ms-OverflowSet-overflowButton.overflowButton-175 > div > button > span > i > span > i', { timeout: 10000 });
        await page.click('#ItemReadingPaneContainer > div.Q8TCC.yyYQP.customScrollBar > div > div.wide-content-host > div > div.uSg02 > div.DgV2h.l8Tnu > div.lT19A > div > div > div.ms-OverflowSet-overflowButton.overflowButton-175 > div > button > span > i > span > i');

        await page.waitForSelector('#id__12188-menu > div > ul > li:nth-child(3) > button > div > span', { timeout: 10000 });
        await page.click('#id__12188-menu > div > ul > li:nth-child(3) > button > div > span');

        // Aquí enviarías la información a app.js
        enviarInformacionAppJS(usuario, accion);

    } catch (error) {
        console.error('Error en la verificación de correos:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
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
