console.log("Iniciando script");
const puppeteer = require('puppeteer');

(async () => {
    let browser;
    try {
        // Lanzar el navegador
        browser = await puppeteer.launch({
            headless: false,  // Para ver lo que está ocurriendo
            executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'  // Ruta al navegador Chrome
        });

        const page = await browser.newPage();
        console.log('Navegador lanzado.');

        // Ir a la página de inicio de sesión
        await page.goto('https://ad360.consejocaba.org.ar:8443/#/reports', { 
            waitUntil: 'networkidle2', // Esperar hasta que la red esté inactiva
            timeout: 60000 // Aumentar el tiempo de espera a 60 segundos
        });
        console.log('Página cargada.');

        // Completar el inicio de sesión
        await page.waitForSelector('#j_username', { timeout: 10000 });
        await page.type('#j_username', 'usuario');
        
        await page.waitForSelector('#j_password', { timeout: 10000 });
        await page.type('#j_password', 'contraseña');
        await page.click('#loginButton');
        console.log('Inicio de sesión completado.');

        // Espera de 10 segundos
        console.log("Esperando 10 segundos...");
        await new Promise(resolve => setTimeout(resolve, 10000));  // Reemplazo de page.waitForTimeout
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

            if (isElementVisibleInViewport) {
                console.log('El elemento está visible en el viewport.');
            } else {
                console.log('El elemento no está visible en el viewport. Desplazándose...');
                await page.evaluate(() => {
                    document.querySelector('#reportLink_3 > a').scrollIntoView();  // Desplazar al elemento
                });
                // Espera de 1 segundo para que el desplazamiento tenga efecto
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Hacer clic en las coordenadas obtenidas
            console.log(`Haciendo clic en las coordenadas x:${x}, y:${y}`);
            await page.mouse.click(x, y);  // Hace clic en la posición especificada
            console.log('Clic en el reporte realizado.');
        } else {
            console.error('El elemento #reportLink_3 > a no se encuentra en la página.');
        }

        // Hacer clic en el botón "Generar"
        await page.waitForSelector('#ember275 > div.flat-theme > div:nth-child(7) > div > div.admp-body-pane.full-width > div > div.admp-align-center.admp-pt-20.admp-mt-5.admp-bdr-top-thin > input.btn.btn-primary', { timeout: 10000 });
        await page.click('#ember275 > div.flat-theme > div:nth-child(7) > div > div.admp-body-pane.full-width > div > div.admp-align-center.admp-pt-20.admp-mt-5.admp-bdr-top-thin > input.btn.btn-primary');
        console.log('Clic en el botón "Generar" realizado.');

        // Hacer clic en el botón "#searchBtn_0"
        await page.waitForSelector('#searchBtn_0', { timeout: 10000 });
        await page.click('#searchBtn_0');
        console.log('Clic en el botón "#searchBtn_0" realizado.');

        // Hacer clic en el campo de búsqueda
        await page.waitForSelector('#searchValue_1006', { timeout: 10000 });
        await page.click('#searchValue_1006');
        console.log('Campo de búsqueda clickeado.');

        // Forzar el enfoque y escribir en el campo de búsqueda
        await page.evaluate(() => {
            const input = document.querySelector('#searchValue_1006');
            input.focus();
            input.value = '';  // Limpiar el campo si es necesario
        });

        // Esperar un breve momento para que el campo de entrada esté listo
        await new Promise(resolve => setTimeout(resolve, 1000));

        await page.type('#searchValue_1006', 'usuario_solicitado');
        console.log('Campo de búsqueda completado con "usuario_solicitado".');

        // Hacer clic en el botón para realizar la búsqueda
        await page.waitForSelector('#searchCol_0 > td:nth-child(1) > input', { timeout: 10000 });
        await page.click('#searchCol_0 > td:nth-child(1) > input');
        console.log('Clic en el botón de búsqueda realizado.');

        // Esperar a que los resultados se carguen
        await new Promise(resolve => setTimeout(resolve, 3000)); // Espera 3 segundos (ajusta según sea necesario)

        // Verificar si el usuario está bloqueado o no
        const userExists = await page.evaluate(() => {
            // Selector para el usuario en los resultados
            const userElement = document.querySelector('#resultRows_0 > tbody > tr > td:nth-child(3) > div');

            return userElement !== null;  // Si existe el usuario, significa que está bloqueado
        });

        console.log('Verificando si el usuario está bloqueado...');
        if (userExists) {
            console.log('El usuario está bloqueado. Procediendo con el desbloqueo...');

            // Aquí irían los clics del desbloqueo
            await page.waitForSelector('#resultRows_0 > tbody > tr > td:nth-child(1) > div > ins', { timeout: 10000 });
            await page.click('#resultRows_0 > tbody > tr > td:nth-child(1) > div > ins');
            console.log('Usuario seleccionado.');
            
            await page.waitForSelector('#ember1540 > li:nth-child(4)', { timeout: 10000 });
            await page.click('#ember1540 > li:nth-child(4)');
            console.log('El usuario ha sido desbloqueado.');
        } else {
            console.log('El usuario no está bloqueado.');
        }

        // Mantener el navegador abierto para depuración
        console.log('Navegador abierto para depuración.');
        await new Promise(resolve => process.on('SIGINT', resolve));

    } catch (error) {
        console.error('Error en la automatización:', error);
    }
})();
