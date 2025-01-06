const puppeteer = require('puppeteer');

async function cambioDeClave(usuario) {
  let browser;
  try {
    console.log(`Usuario recibido para cambio de clave: ${usuario}`);

    // Lanzar el navegador
    browser = await puppeteer.launch({
      headless: false,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      slowMo: 50,
      args: ['--start-maximized'],
    });

    const page = await browser.newPage();
    console.log('Navegador lanzado.');

    // Navegar a la página de inicio de sesión
    await page.goto('https://ad360.consejocaba.org.ar:8443/#/mgmt', { waitUntil: 'networkidle2' });

    // Ingresar las credenciales
    await page.type('#j_username', 'segurito@consejocaba.org.ar');
    await page.type('#j_password', 'Seginf*1710*');
    await page.click('#loginButton');
    console.log('Inicio de sesión exitoso.');

    // Esperar la navegación post-login
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 5000)); // Espera adicional

    // Obtener las coordenadas del elemento "Reiniciar contraseña"
    const { x, y } = await page.evaluate(() => {
      const element = document.querySelector('#reportLink_1019 > a');
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y };
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
        document.querySelector('#reportLink_1019 > a').scrollIntoView();
      });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Espera de 1 segundo
    }

    // Hacer clic en las coordenadas obtenidas
    console.log(`Haciendo clic en las coordenadas x:${x}, y:${y}`);
    await page.mouse.click(x, y);

    // Tildar contraseña aleatoria
    await page.waitForSelector('#generatePasswordRow_40001 > td > div > ins', { timeout: 8000 });
    await page.click('#generatePasswordRow_40001 > td > div > ins');
    console.log('Contraseña aleatoria seleccionada...');

    // Forzar cambio de contraseña en próximo inicio de sesión
    await page.waitForSelector('#mustChangePwdRow_40002 > td:nth-child(2) > div.btn-group.bootstrap-select.combox > button', {
      timeout: 8000,
    });
    await page.click('#mustChangePwdRow_40002 > td:nth-child(2) > div.btn-group.bootstrap-select.combox > button');
    await page.waitForSelector(
      '#mustChangePwdRow_40002 > td:nth-child(2) > div.btn-group.bootstrap-select.combox.open > div > ul > li:nth-child(2) > a',
      { timeout: 8000 }
    );
    await page.click('#mustChangePwdRow_40002 > td:nth-child(2) > div.btn-group.bootstrap-select.combox.open > div > ul > li:nth-child(2) > a');
    console.log('Forzando cambio de contraseña en el próximo inicio de sesión...');

    // Búsqueda de usuario
    await page.waitForSelector('#searchString > div > input.textfield1.form-control', { timeout: 8000 });
    await page.click('#searchString > div > input.textfield1.form-control');
    await page.type('#searchString > div > input.textfield1.form-control', usuario);
    await page.waitForSelector('#search', { timeout: 8000 });
    await page.click('#search');
    console.log('Buscando usuario...');

    // Extraer la contraseña generada
    await page.waitForSelector('#resultList > tbody > tr > td:nth-child(1) > div > label > span', { timeout: 8000 });
    await page.click('#resultList > tbody > tr > td:nth-child(1) > div > label > span');
    console.log(`Usuario ${usuario} seleccionado.`);

    // Aplicar el cambio de contraseña
    await page.click('#apply');
    console.log('Cambio de contraseña aplicado.');

    // Esperar 3 segundos para que aparezca la clave
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Extraer la contraseña generada
    const newPassword = await page.evaluate(() => {
      const element = document.querySelector('span.blacktxt1');
      return element ? element.textContent.trim() : null;
    });
    console.log('Nueva contraseña obtenida:', newPassword);

    // Retornar la contraseña obtenida
    return { exito: true, contrasena: newPassword, mensaje: 'Cambio de contraseña exitoso' };
  } catch (error) {
    console.error('Error en la automatización:', error);
    return { exito: false, contrasena: null, mensaje: 'Error en el cambio de contraseña' };
  } finally {
    if (browser) await browser.close();
  }
}

// Exportar la función para usarla en otros scripts
module.exports = { cambioDeClave };
