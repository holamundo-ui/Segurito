const puppeteer = require('puppeteer');

async function ejecutardesbloqueo(usuario) {
    let browser;
    try {
        // Lanzar el navegador
        browser = await puppeteer.launch({
            headless: false,  // Para ver lo que está ocurriendo
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            slowMo: 50,  // Ralentizar cada acción en 50 ms
            args: ['--start-maximized']
        });

        const page = await browser.newPage();
        console.log('Navegador lanzado.');

        // Inicio de sesión
        await page.goto('https://ad360.consejocaba.org.ar:8443/#/reports', { 
            waitUntil: 'networkidle2', // Esperar hasta que la red esté inactiva
            timeout: 60000 // Aumentar el tiempo de espera a 60 segundos
        });
        console.log('Página cargada.');

        await page.waitForSelector('#j_username', { timeout: 10000 });
        await page.type('#j_username', 'segurito');  // Reemplazar con el usuario correcto
        
        await page.waitForSelector('#j_password', { timeout: 10000 });
        await page.type('#j_password', 'Seginf*1710*');  // Reemplazar con la contraseña correcta
        await page.click('#loginButton');
        console.log('Inicio de sesión completado.');

        // Espera de 10 segundos usando setTimeout
        console.log("Esperando 10 segundos...");
        await new Promise(resolve => setTimeout(resolve, 10000));  // Espera de 10 segundos
        console.log("Espera de 10 segundos completada.");

        // Comprobar si el elemento existe antes de obtener coordenadas
        const elementExists = await page.evaluate(() => {
            return document.querySelector('#reportLink_3 > a') !== null;
        });

        if (elementExists) {
            // Obtener las coordenadas del elemento usando getBoundingClientRect() desde Puppeteer
            const { x, y } = await page.evaluate(() => {
                const element = document.querySelector('#reportLink_3 > a > span');
                const rect = element.getBoundingClientRect();
                return {
                    x: rect.x,  // Coordenada X dentro del viewport
                    y: rect.y   // Coordenada Y dentro del viewport
                };
            });

            console.log(`Coordenadas obtenidas: x=${x}, y=${y}`);

            // Verificar si el elemento está visible en el viewport
            const isElementVisibleInViewport = await page.evaluate(() => {
                const element = document.querySelector('#reportLink_3 > a');
                const rect = element.getBoundingClientRect();
                return (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                );
            });

            if (!isElementVisibleInViewport) {
                console.log('El elemento no está visible en el viewport. Desplazándose...');
                await page.evaluate(() => {
                    document.querySelector('#reportLink_3 > a').scrollIntoView();  // Desplazar al elemento
                });
                await new Promise(resolve => setTimeout(resolve, 1000));  // Espera de 1 segundo
            }

            // Hacer clic en las coordenadas obtenidas
            console.log(`Haciendo clic en las coordenadas x:${x}, y:${y}`);
            await page.mouse.click(x, y);  // Hace clic en la posición especificada
            console.log('Clic en el reporte realizado.');
        } else {
            console.error('El elemento #reportLink_3 > a no se encuentra en la página.');
            return { exito: false, mensaje: 'Elemento no encontrado.' };
        }

        // Generar reporte de usuarios bloqueados
        await page.waitForSelector('#ember275 > div.flat-theme > div:nth-child(7) > div > div.admp-body-pane.full-width > div > div.admp-align-center.admp-pt-20.admp-mt-5.admp-bdr-top-thin > input.btn.btn-primary', { timeout: 10000 });
        await page.click('#ember275 > div.flat-theme > div:nth-child(7) > div > div.admp-body-pane.full-width > div > div.admp-align-center.admp-pt-20.admp-mt-5.admp-bdr-top-thin > input.btn.btn-primary');
        console.log('Clic en el botón "Generar" realizado.');

        // Búsqueda de usuario
        await page.waitForSelector('#searchBtn_0', { timeout: 15000 });
        await page.click('#searchBtn_0');
        console.log('Clic en el botón "#searchBtn_0" realizado.');

        await page.waitForSelector('#searchValue_1006', { timeout: 10000 });
        await page.click('#searchValue_1006');
        console.log('Campo de búsqueda clickeado.');

        await page.evaluate(() => {
            const input = document.querySelector('#searchValue_1006');
            input.focus();
            input.value = '';  // Limpiar el campo si es necesario
        });

        await new Promise(resolve => setTimeout(resolve, 1000));  // Esperar 1 segundo
        await page.type('#searchValue_1006', usuario);
        console.log(`Campo de búsqueda completado con "${usuario}".`);

        // Hacer clic en el botón para realizar la búsqueda
        await page.waitForSelector('#searchCol_0 > td:nth-child(1) > input', { timeout: 10000 });
        await page.click('#searchCol_0 > td:nth-child(1) > input');
        console.log('Clic en el botón de búsqueda realizado.');

        // Verificar si el usuario está bloqueado
        await new Promise(resolve => setTimeout(resolve, 3000));  // Esperar a que los resultados se carguen

        const userExists = await page.evaluate(() => {
            const userElement = document.querySelector('#resultRows_0 > tbody > tr > td:nth-child(1)');
            return userElement !== null;
        });

        console.log('Verificando si el usuario está bloqueado...');
        if (userExists) {
            console.log('El usuario está bloqueado. Procediendo con el desbloqueo.');

            // Desbloquear el usuario
            await page.waitForSelector('#resultRows_0 > tbody > tr > td:nth-child(1) > div > ins', { timeout: 10000 });
            await page.click('#resultRows_0 > tbody > tr > td:nth-child(1) > div > ins');
            console.log('Usuario seleccionado.');

            await page.waitForSelector('a[data-original-title="Unlock"]', { timeout: 10000 });
            await page.click('a[data-original-title="Unlock"]');

            await page.waitForSelector('#alertBox > div > div > div.modal-footer.bdr-none.admp-pt-0.admp-pb-20 > div > button.btn.btn-primary.btn-classic', { timeout: 10000 });
            await page.click('#alertBox > div > div > div.modal-footer.bdr-none.admp-pt-0.admp-pb-20 > div > button.btn.btn-primary.btn-classic');
            console.log('El usuario ha sido desbloqueado.');
            return { exito: true, mensaje: 'Usuario desbloqueado.' };
        } else {
            console.log('El usuario no está bloqueado.');
            return { exito: false, mensaje: 'El usuario no está bloqueado.' };
        }
    } catch (error) {
        console.error('Error en la automatización:', error);
        return { exito: false, mensaje: error.message };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = { ejecutardesbloqueo };
