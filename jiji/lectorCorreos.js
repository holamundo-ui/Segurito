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
    await page.type('input[type="email"]', 'segurito@consejocaba.org.ar');
    await page.click('input[type="submit"]');

    await page.waitForSelector('input[type="password"]');
    await page.type('input[type="password"]', 'Seginf*1710*');
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

        // Aumentamos el tiempo de espera para asegurarnos de que los correos carguen correctamente
        await page.waitForSelector('div[role="listbox"] div[role="option"]', { timeout: 60000 });

        // Verifica cuántos correos están presentes
        const correos = await page.$$('div[role="listbox"] div[role="option"]');
        console.log(`Número de correos no leídos encontrados: ${correos.length}`); // Depuración

        if (correos.length > 0) {
            console.log(`Se encontraron ${correos.length} correos no leídos.`);
            
            // Realizamos un scroll para asegurarnos de que los correos estén completamente cargados y visibles
            await page.evaluate(() => {
                const scrollableContainer = document.querySelector('div[role="listbox"]');
                scrollableContainer.scrollTop = scrollableContainer.scrollHeight;
            });
            await new Promise(resolve => setTimeout(resolve, 1000)); // Espera después de hacer scroll

            // Reobtenemos la lista de correos después del scroll
            const nuevoCorreos = await page.$$('div[role="listbox"] div[role="option"]');
            if (nuevoCorreos.length > 0) {
                const correo = nuevoCorreos[nuevoCorreos.length - 1]; // Seleccionamos el último correo
                await correo.scrollIntoViewIfNeeded(); // Desplazamos el correo a la vista

                // Esperamos brevemente para asegurarnos de que el correo esté visible
                await new Promise(resolve => setTimeout(resolve, 500));

                try {
                    // Intentamos hacer clic en el correo
                    await correo.click();
                    console.log('Correo no leído más antiguo seleccionado.');

                    // Esperamos que el correo se cargue completamente
                    await page.waitForSelector('#UniqueMessageBody_2', { timeout: 30000 });
                    console.log('Panel de lectura abierto correctamente.');

                    // Buscar al usuario dentro de #UniqueMessageBody_2
                    const cuerpoElement = await page.$('#UniqueMessageBody_2');
                    if (cuerpoElement) {
                        const cuerpo = await page.evaluate(element => element.innerText, cuerpoElement);
                        console.log('Cuerpo del correo:', cuerpo);

                        // Dividir el cuerpo del correo en líneas y buscar el usuario
                        const lineas = cuerpo.trim().split('\n').filter(line => line.trim() !== '');
                        let usuario = null;

                        for (let linea of lineas) {
                            linea = linea.trim();
                            if (linea && !linea.includes('Este correo electrónico es externo') && !linea.includes('Obtener Outlook para Android')) {
                                usuario = linea;
                                break;
                            }
                        }

                        if (usuario) {
                            console.log(`Usuario detectado: ${usuario}`);
                            callback(usuario, 'desbloqueo'); // Llama al callback con usuario y acción
                        } else {
                            console.log('No se pudo encontrar el usuario en el cuerpo del correo.');
                        }
                    } else {
                        console.log('No se pudo encontrar el cuerpo del correo con el selector dado.');
                    }
                } catch (error) {
                    console.error('Error al hacer clic en el correo:', error);
                }
            } else {
                console.log('No se encontraron correos disponibles después de hacer scroll.');
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
