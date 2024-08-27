console.log('Iniciando Script...');

const { execSync } = require('child_process');
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

        // Inicio de sesión
        await page.goto('https://ad360.consejocaba.org.ar:8443/#/mgmt');  
        
        await page.waitForSelector('#j_username', { timeout: 8000 });
        await page.click('#j_username');
        await page.type('#j_username', 'ggonzalez');
        
        await page.waitForSelector('#j_password', { timeout: 8000 });
        await page.click('#j_password');
        await page.type('#j_password', '*');
        await page.click('#loginButton');

        // Esperar después del inicio de sesión
        await page.waitForTimeout(10000);

        // Obtener las coordenadas del elemento "Reiniciar contraseña"
        const { x, y } = await page.evaluate(() => {
            const element = document.querySelector('#reportLink_1019 > a');
            const rect = element.getBoundingClientRect();
            return {
                x: rect.x,  // Coordenada X dentro del viewport
                y: rect.y   // Coordenada Y dentro del viewport
            };
        });

        // Corregir el uso de comillas invertidas para interpolar las variables
        console.log(`Coordenadas obtenidas: x=${x}, y=${y}`);

        // Verificar si el elemento está visible en el viewport
        const isElementVisibleInViewport = await page.evaluate(() => {
            const element = document.querySelector('#reportLink_1019 > a');
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
                document.querySelector('#reportLink_1019 > a').scrollIntoView();  // Desplazar al elemento
            });
            await page.waitForTimeout(1000);  // Espera de 1 segundo para que el desplazamiento tenga efecto
        }

        // Hacer clic en las coordenadas obtenidas
        console.log(`Haciendo clic en las coordenadas x:${x}, y:${y}`);
        await page.mouse.click(x, y);  // Hace clic en la posición especificada

		// Tildar contraseña aleatoria
		await page.waitForSelector('#generatePasswordRow_40001 > td > div > ins', { timeout: 8000 });
        await page.click('#generatePasswordRow_40001 > td > div > ins');

		// Forzar cambio de contraseña en próximo inicio de sesión
		await page.waitForSelector('#mustChangePwdRow_40002 > td:nth-child(2) > div.btn-group.bootstrap-select.combox > button', { timeout: 8000 });
        await page.click('#mustChangePwdRow_40002 > td:nth-child(2) > div.btn-group.bootstrap-select.combox > button');
		
		await page.waitForSelector('#mustChangePwdRow_40002 > td:nth-child(2) > div.btn-group.bootstrap-select.combox.open > div > ul > li:nth-child(2) > a', { timeout: 8000 });
        await page.click('#mustChangePwdRow_40002 > td:nth-child(2) > div.btn-group.bootstrap-select.combox.open > div > ul > li:nth-child(2) > a');

		// Busqueda de usuario
		await page.waitForSelector('#searchString > div > input.textfield1.form-control', { timeout: 8000 });
        await page.click('#searchString > div > input.textfield1.form-control');
        await page.type('#searchString > div > input.textfield1.form-control', 'ggonzalez');
		
		await page.waitForSelector('#search', { timeout: 8000 });
        await page.click('#search');
		
		// Efectuar cambio de contraseña
		await page.waitForSelector('#resultList > tbody > tr > td:nth-child(1) > div > label > span', { timeout: 8000 });
        await page.click('#resultList > tbody > tr > td:nth-child(1) > div > label > span');
		
		await page.waitForSelector('#apply', { timeout: 8000 });
        await page.click('#apply');

        // Mantener el navegador abierto para depuración
        console.log('Clic realizado. Navegador abierto para depuración.');
        await new Promise(resolve => process.on('SIGINT', resolve));

    } catch (error) {
        console.error('Error en la automatización:', error);
        if (browser) {
            await browser.close();
        }
    }
})();
