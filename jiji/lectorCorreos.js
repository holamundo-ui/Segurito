const puppeteer = require('puppeteer');

async function iniciarLectorCorreos(callback) {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--start-maximized'],
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
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
  await page.type('input[type="password"]', '');
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

  async function verificarCorreos() {
    console.log('Verificando correos en la bandeja de entrada...');
    try {
      await page.goto('https://outlook.office.com/mail/inbox');
      await page.waitForSelector('button[aria-label="Filtrar"]');
      await page.click('button[aria-label="Filtrar"]');
      console.log('Menú de filtro desplegado.');
      await page.waitForSelector('div[role="menu"] div[role="menuitemradio"][title="No leído"]', { timeout: 10000 });
      await page.click('div[role="menu"] div[role="menuitemradio"][title="No leído"]');
      await page.waitForSelector('div[role="listbox"] div[role="option"]', { timeout: 90000 });
      const correos = await page.$$('div[role="listbox"] div[role="option"]');
      console.log(`Número de correos no leídos encontrados: ${correos.length}`);
      for (const correo of correos) {
        try {
          await correo.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log('Correo no leído seleccionado.');
          await page.waitForSelector('#UniqueMessageBody_2', { timeout: 30000 });
          const cuerpoElement = await page.$('#UniqueMessageBody_2');
          const asuntoElement = await page.$('#ConversationReadingPaneContainer > div.NTPm6.idxFD.WWy1F > div > div > div > div > div > div > div > div > span.JdFsz');
          const remitenteElement = await page.$('#focused > div.uSg02 > div.DgV2h.l8Tnu.lAKmW > div.x9jfA > div.bz1XJ > div > span > span > div > span');
          if (cuerpoElement && asuntoElement && remitenteElement) {
            const cuerpo = await page.evaluate(element => element.innerText, cuerpoElement);
            const asunto = await page.evaluate(element => element.innerText, asuntoElement);
            const remitente = await page.evaluate(element => element.innerText, remitenteElement);
            console.log('Cuerpo del correo:', cuerpo);
            console.log('Asunto del correo:', asunto);
            console.log('Remitente del correo:', remitente);
            let usuario = null;
            let accion = null;
            const lineas = cuerpo.trim().split('\n').filter(line => line.trim() !== '');
            for (let linea of lineas) {
              if (!linea.includes('Este correo electrónico es externo') && !linea.includes('Obtener Outlook para Android')) {
                if (!usuario) {
                  usuario = linea.trim();
                }
              }
            }
            if (asunto.toLowerCase().includes('desbloqueo')) {
              accion = 'desbloqueo';
            } else if (asunto.toLowerCase().includes('cambio de clave')) {
              accion = 'cambio de clave';
            }
            if (!accion) {
              accion = 'desbloqueo';
            }
            if (usuario && accion && remitente) {
              const correoRemitente = remitente.match(/<(.+)>/)[1];
              callback(usuario, accion, correoRemitente);
            } else {
              console.log('No se pudo determinar el usuario, la acción o el remitente del correo.');
            }
          } else {
            console.log('No se pudo encontrar el cuerpo, asunto o remitente del correo con los selectores dados.');
          }
          await page.keyboard.press('KeyQ'); // Marcar como leído
          console.log('Correo marcado como leído.');
        } catch (error) {
          console.error('Error procesando un correo:', error);
        }
      }
      console.log('Finalizado el procesamiento de correos.');
    } catch (error) {
      console.error('Error verificando correos:', error);
    }
    console.log('Esperando 30 segundos antes de volver a verificar...');
    setTimeout(verificarCorreos, 30000); // Esperar 30 segundos y verificar de nuevo
  }

  verificarCorreos();
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
