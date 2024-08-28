console.log("Iniciando script");
const puppeteer = require('puppeteer');

(async () => {
    let browser;
    try {
        // Lanzar el navegador
        browser = await puppeteer.launch({
            headless: false,  // Para ver lo que está ocurriendo
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'  // Ruta al navegador Chrome
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
        await page.type('#j_username', 'ggonzalez');
        
        await page.waitForSelector('#j_password', { timeout: 10000 });
        await page.type('#j_password', 'Gaby2023*');
        await page.click('#loginButton');
        console.log('Inicio de sesión completado.');

        // Reemplazo de waitForTimeout con setTimeout en una promesa
        console.log("Esperando 10 segundos...");
        await new Promise(resolve => setTimeout(resolve, 10000));
        console.log("Espera de 10 segundos completada.");

        // Comprobar si el elemento existe antes de obtener coordenadas
        const elementExists = await page.evaluate(() => {
            return document.querySelector('#reportLink_3 > a') !== null;
        });

        if (elementExists) {
            // Obtener las coordenadas del elemento usando getBoundingClientRect() desde Puppeteer
            const { x, y } = await page.evaluate(() => {
                const element = document.querySelector('#reportLink_3 > a');
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
                // Reemplazo de waitForTimeout con setTimeout en una promesa
                await new Promise(resolve => setTimeout(resolve, 1000));  // Espera de 1 segundo para que el desplazamiento tenga efecto
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

        // Completar el campo de búsqueda con el usuario
        await page.waitForSelector('#searchValue_1006', { timeout: 10000 });
        
        // Usar page.evaluate para manipular el valor del campo directamente
        await page.evaluate(() => {
            document.querySelector('#searchValue_1006').value = 'ggonzalez';
        });
        
        // Enviar el evento de input para asegurar que el valor se registre correctamente
        await page.evaluate(() => {
            const event = new Event('input', { bubbles: true });
            document.querySelector('#searchValue_1006').dispatchEvent(event);
        });

        console.log('Campo de búsqueda completado con "ggonzalez".');

        // Mantener el navegador abierto para depuración
        console.log('Navegador abierto para depuración.');
        await new Promise(resolve => process.on('SIGINT', resolve));

    } catch (error) {
        console.error('Error en la automatización:', error);
    }
})();