const puppeteer = require('puppeteer');

// Esta función inicia el proceso de lectura de correos
async function iniciarLectorCorreos(callback) {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 50,
        args: ['--start-maximized'],
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('Navegador lanzado.');

    await page.goto('https://outlook.office.com/');
    console.log('Iniciando sesión en Outlook...');

    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'ggonzalez@consejocaba.org.ar');
    await page.click('input[type="submit"]');

    await page.waitForSelector('input[type="password"]');
    await page.type('input[type="password"]', '0000');
    await page.click('input[type="submit"]');
    console.log('Contraseña ingresada.');

    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Esperando para completar MFA...');

    try {
        await page.waitForSelector('input[type="submit"]', { timeout: 10000 });
        await page.click('input[type="submit"]');
    } catch (e) {
        console.log('No se requirió un submit adicional después del MFA.');
    }

    console.log('Verificando correos en la bandeja de entrada...');

    try {
        await page.waitForSelector('button[aria-label="Filtrar"]');
        await page.click('button[aria-label="Filtrar"]');
        console.log('Menú de filtro desplegado.');

        await page.waitForSelector('div[role="menu"] div[role="menuitemradio"][title="No leído"]', { timeout: 10000 });
        await page.click('div[role="menu"] div[role="menuitemradio"][title="No leído"]');

        await page.waitForSelector('div[role="listbox"] div[role="option"]', { timeout: 60000 });

        const correos = await page.$$('div[role="listbox"] div[role="option"]');
        if (correos.length > 0) {
            console.log(`Se encontraron ${correos.length} correos no leídos.`);
            
            await correos[correos.length - 1].click();
            console.log('Correo no leído más antiguo seleccionado.');

            await page.waitForSelector('div[role="document"]', { timeout: 30000 });
            console.log('Panel de lectura abierto correctamente.');

            try {
                const asuntoElement = await page.$('#ItemReadingPaneContainer > div.ubHDG.Waj3A.bwgAh.pinIo > div > div > div > div > div > div > div > div');
                if (asuntoElement) {
                    const asunto = await page.evaluate(element => element.textContent, asuntoElement);
                    console.log('Asunto:', asunto);

                    let accion = null;
                    if (asunto.toLowerCase().includes('desbloqueo')) {
                        accion = 'desbloqueo';
                    } else if (asunto.toLowerCase().includes('cambio de contraseña')) {
                        accion = 'cambio de contraseña';
                    }

                    if (accion) {
                        console.log(`Acción detectada: ${accion}`);

                        // Extraer el cuerpo del correo
                        const cuerpoElement = await page.$('#UniqueMessageBody_1 > div > div');
                        if (cuerpoElement) {
                            const cuerpo = await page.evaluate(element => element.innerText, cuerpoElement);
                            console.log('Cuerpo del correo:', cuerpo);

                            // Buscar el usuario en el cuerpo del correo
                            const lineas = cuerpo.trim().split('\n').filter(line => line.trim() !== '');
                            let usuario = null;

                            // Buscar la línea que contenga solo el nombre de usuario
                            for (let linea of lineas) {
                                linea = linea.trim();
                                if (linea && !linea.includes('Este correo electrónico es externo') && !linea.includes('Obtener Outlook para Android')) {
                                    usuario = linea;
                                    break; // Tomar la primera línea válida
                                }
                            }

                            if (usuario) {
                                console.log(`Usuario detectado: ${usuario}`);
                                callback(usuario, accion);
                            } else {
                                console.log('No se pudo encontrar el usuario en el cuerpo del correo.');
                            }
                        } else {
                            console.log('No se pudo obtener el cuerpo del correo.');
                        }
                    } else {
                        console.log('El asunto no contiene una acción válida.');
                    }
                } else {
                    console.log('No se pudo encontrar el asunto con el selector dado.');
                }
            } catch (error) {
                console.error('Error al obtener el asunto del correo:', error);
            }
        } else {
            console.log('No se encontraron correos no leídos.');
        }
    } catch (error) {
        console.error('Error en la verificación de correos:', error);
    }

    console.log('Manteniendo el navegador abierto. Presiona Ctrl+C para cerrar.');
    await new Promise(resolve => {
        process.on('SIGINT', () => {
            console.log('Cierre del navegador solicitado.');
            browser.close();
            process.exit();
        });
    });
}

module.exports = { iniciarLectorCorreos };
