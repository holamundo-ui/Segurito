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

        // Ejemplo de inicio de sesión
        await page.goto('https://ad360.consejocaba.org.ar:8443/#/reports');  // Reemplaza con la URL correcta
        await page.waitForSelector('#j_username', { timeout: 10000 });
        await page.type('#j_username', 'ggonzalez');
        
        await page.waitForSelector('#j_password', { timeout: 10000 });
        await page.type('#j_password', 'Gaby2023*');
        await page.click('#loginButton');

        // Reemplazo de waitForTimeout con setTimeout en una promesa
        console.log("Esperando 10 segundos...");
        await new Promise(resolve => setTimeout(resolve, 10000));
        console.log("Espera de 10 segundos completada.");

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

        // Hacer clic en el botón "Generar" con el nuevo selector
        await page.waitForSelector('#ember275 > div.flat-theme > div:nth-child(7) > div > div.admp-body-pane.full-width > div > div.admp-align-center.admp-pt-20.admp-mt-5.admp-bdr-top-thin > input.btn.btn-primary', { timeout: 10000 });
        await page.click('#ember275 > div.flat-theme > div:nth-child(7) > div > div.admp-body-pane.full-width > div > div.admp-align-center.admp-pt-20.admp-mt-5.admp-bdr-top-thin > input.btn.btn-primary');
        console.log('Clic en el botón "Generar" realizado.');

        // Mantener el navegador abierto para depuración
        console.log('Navegador abierto para depuración.');
        await new Promise(resolve => process.on('SIGINT', resolve));

    } catch (error) {
        console.error('Error en la automatización:', error);
    }
})();