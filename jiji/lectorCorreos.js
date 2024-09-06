const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 50, // Ralentizar las acciones para poder ver el proceso
        args: ['--start-maximized'], // Maximiza la ventana
        executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' // Ruta a tu instalación de Chrome
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 0, height: 0 }); // Forzar maximización de ventana

    console.log('Navegador lanzado.');

    // Navegar a la página de inicio de sesión de Outlook
    await page.goto('https://outlook.office.com/');
    console.log('Iniciando sesión en Outlook...');

    // Ingresar correo electrónico
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'usuario@dominio.org.ar');
    await page.click('input[type="submit"]');

    // Esperar a que cargue la página de contraseña
    await page.waitForSelector('input[type="password"]');
    await page.type('input[type="password"]', 'contraseña');
    await page.click('input[type="submit"]');
    console.log('Contraseña ingresada.');

    // Esperar para completar el MFA si es necesario
    await new Promise(resolve => setTimeout(resolve, 10000)); // Ajusta este tiempo según sea necesario para completar el MFA
    console.log('Esperando para completar MFA...');

    // Detectar si el MFA está completo o si requiere más interacción
    try {
        await page.waitForSelector('input[type="submit"]', { timeout: 10000 });
        await page.click('input[type="submit"]'); // Si se requiere otro "submit" después del MFA
    } catch (e) {
        console.log('No se requirió un submit adicional después del MFA.');
    }

    console.log('Verificando correos en la bandeja de entrada...');

    // Seleccionar la opción "No leído" en el filtro
    try {
        // Esperar que se despliegue el menú del filtro
        await page.waitForSelector('button[aria-label="Filtrar"]');
        await page.click('button[aria-label="Filtrar"]');
        console.log('Menú de filtro desplegado.');

        // Esperar a que el menú de filtro esté visible
        await page.waitForSelector('div[role="menu"] div[role="menuitemradio"][title="No leído"]', { timeout: 10000 });
        await page.click('div[role="menu"] div[role="menuitemradio"][title="No leído"]');

        // Esperar que carguen los correos no leídos
        await page.waitForSelector('div[role="listbox"] div[role="option"]');
        const correos = await page.$$('div[role="listbox"] div[role="option"]');
        if (correos.length > 0) {
            console.log(`Se encontraron ${correos.length} correos no leídos.`);
            
            // Seleccionar el correo más antiguo (último en la lista)
            await correos[correos.length - 1].click();
            console.log('Correo no leído más antiguo seleccionado.');

            // Verificar si se abre el panel de lectura
            const panelAbierto = await page.$('div[role="document"]');
            if (!panelAbierto) {
                console.log('El panel de lectura no se abrió, intentando abrir manualmente...');
                await correos[correos.length - 1].click(); // Reintentar la apertura del correo
            } else {
                console.log('Panel de lectura abierto correctamente.');
            }

			// Obtener el asunto del correo usando XPath
			const [asuntoElement] = await page.$x('//*[@id="ConversationReadingPaneContainer"]/div[1]/div/div/div/div/div/div/div/div/span[1]');
			if (asuntoElement) {
				const asunto = await page.evaluate(element => element.textContent, asuntoElement);
				console.log('Asunto:', asunto);
			} else {
				console.log('No se pudo encontrar el asunto.');
			}

            // Verificar si el asunto contiene "desbloqueo" o "cambio de contraseña"
            let accion = null;
            if (asunto.toLowerCase().includes('desbloqueo')) {
                accion = 'desbloqueo';
            } else if (asunto.toLowerCase().includes('cambio de contraseña')) {
                accion = 'cambio de contraseña';
            }

            if (accion) {
                console.log(`Acción detectada: ${accion}`);

                // Extraer el cuerpo del correo (usuario)
                const cuerpo = await page.$eval('div[data-test-id="message-body-content"]', el => el.innerText);
                const usuario = cuerpo.trim().toLowerCase();
                console.log(`Usuario detectado: ${usuario}`);

                // Aquí es donde puedes pasar estos datos a app.js o donde sea necesario
            } else {
                console.log('El asunto no contiene una acción válida.');
            }
        } else {
            console.log('No se encontraron correos no leídos.');
        }
    } catch (error) {
        console.error('Error en la verificación de correos:', error);
    }

    // Mantener el navegador abierto para inspección manual
    await new Promise(resolve => setTimeout(resolve, 60000)); // Mantener el navegador abierto por 1 minuto
    await browser.close();
})();
