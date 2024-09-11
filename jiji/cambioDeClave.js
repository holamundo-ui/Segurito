console.log('Iniciando Script...');

const puppeteer = require('puppeteer');

(async () => {
    let browser;
    try {
        // Lanzar el navegador con slowMo para ralentizar las acciones
        browser = await puppeteer.launch({
            headless: false,  // Para ver lo que está ocurriendo
            executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            slowMo: 50,  // Ralentizar cada acción en 50 ms
			args: ['--start-maximized']
        });

        const page = await browser.newPage();
        console.log('Navegador lanzado.');

        // Inicio de sesión
        await page.goto('https://ad360.consejocaba.org.ar:8443/#/mgmt', { waitUntil: 'networkidle2' });  
        
        await page.waitForSelector('#j_username', { timeout: 8000 });
        await page.click('#j_username');
        await page.type('#j_username', 'usuario');
        
        await page.waitForSelector('#j_password', { timeout: 8000 });
        await page.click('#j_password');
        await page.type('#j_password', 'contraseña);
        await page.click('#loginButton');
        console.log('Inicio de sesión exitoso.');

        // Esperar después del inicio de sesión
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 5000));  // Esperar 5 segundos adicionales para estabilidad

        // Obtener las coordenadas del elemento "Reiniciar contraseña"
        const { x, y } = await page.evaluate(() => {
            const element = document.querySelector('#reportLink_1019 > a');
            const rect = element.getBoundingClientRect();
            return {
                x: rect.x,  // Coordenada X dentro del viewport
                y: rect.y   // Coordenada Y dentro del viewport
            };
        });

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
            await new Promise(resolve => setTimeout(resolve, 1000));  // Espera de 1 segundo
        }

        // Hacer clic en las coordenadas obtenidas
        console.log(`Haciendo clic en las coordenadas x:${x}, y:${y}`);
        await page.mouse.click(x, y);  // Hace clic en la posición especificada

        // Tildar contraseña aleatoria
        await page.waitForSelector('#generatePasswordRow_40001 > td > div > ins', { timeout: 8000 });
        await page.click('#generatePasswordRow_40001 > td > div > ins');
        console.log('Contraseña aleatoria seleccionada...');

        // Forzar cambio de contraseña en próximo inicio de sesión
        await page.waitForSelector('#mustChangePwdRow_40002 > td:nth-child(2) > div.btn-group.bootstrap-select.combox > button', { timeout: 8000 });
        await page.click('#mustChangePwdRow_40002 > td:nth-child(2) > div.btn-group.bootstrap-select.combox > button');
        
        await page.waitForSelector('#mustChangePwdRow_40002 > td:nth-child(2) > div.btn-group.bootstrap-select.combox.open > div > ul > li:nth-child(2) > a', { timeout: 8000 });
        await page.click('#mustChangePwdRow_40002 > td:nth-child(2) > div.btn-group.bootstrap-select.combox.open > div > ul > li:nth-child(2) > a');
        console.log('Forzando cambio de contraseña en el próximo inicio de sesión...');

        // Búsqueda de usuario
        await page.waitForSelector('#searchString > div > input.textfield1.form-control', { timeout: 8000 });
        await page.click('#searchString > div > input.textfield1.form-control');
        await page.type('#searchString > div > input.textfield1.form-control', 'usuario_solicitado');
        
        await page.waitForSelector('#search', { timeout: 8000 });
        await page.click('#search');
        console.log('Buscando usuario...');

		// Efectuar cambio de contraseña
        await page.waitForSelector('#resultList > tbody > tr > td:nth-child(1) > div > label > span', { timeout: 8000 });
        await page.click('#resultList > tbody > tr > td:nth-child(1) > div > label > span');
        
        await page.waitForSelector('#apply', { timeout: 8000 });
        await page.click('#apply');
        console.log('Cambio de contraseña exitoso.');

        // Esperar la finalización de la operación antes de intentar extraer la contraseña generada
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        // Extraer la contraseña generada
        const password = await page.evaluate(() => {
            const passwordElement = document.querySelector('span.blacktxt1');
            return passwordElement ? passwordElement.textContent.trim() : null;
        });

        if (password) {
            console.log(`Contraseña temporal generada: ${password}`);
        } else {
            console.log('No se pudo encontrar la contraseña generada.');
        }

        // Mantener el navegador abierto para depuración
        console.log('Navegador abierto para depuración.');
        await new Promise(resolve => process.on('SIGINT', resolve));

    } catch (error) {
        console.error('Error en la automatización:', error);
    }
})();
