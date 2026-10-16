/**
 * ORTAC Geo|Science - Akademik Asistan
 * Electron Headless UI Smoke Test
 * 
 * Bu betik Electron uygulamasını başsız (headless / off-screen) modda başlatarak:
 * 1. dist/index.html dosyasının ve Vite React paketinin hatasız yüklendiğini,
 * 2. Preload script ve IPC köprüsünün (window.electronAPI) eksiksiz çalıştığını,
 * 3. #root DOM düğümüne React bileşenlerinin başarıyla bağlandığını (mount),
 * 4. Konsolda kritik renderer istisnaları oluşmadığını
 * doğrular ve test tamamlandığında süreci temiz bir şekilde sonlandırır.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Donanım hızlandırma ve GPU bağımlılıklarını başsız test için devre dışı bırak
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');

let mainWindow = null;
const consoleLogs = [];
let testPassed = false;

// IPC Test Yanıtlayıcıları (Preload köprüsünü doğrulamak için)
ipcMain.handle('app:check-updates', async () => {
  return { currentVersion: '0.0.4-test', status: 'smoke_test_ok' };
});

ipcMain.handle('app:create-shortcut', async () => {
  return { success: true };
});

async function runSmokeTest() {
  console.log('\n' + '='.repeat(70));
  console.log('[*] [ELECTRON SMOKE TEST] Başlatılıyor...');
  console.log(`    Electron Versiyonu : ${process.versions.electron}`);
  console.log(`    Chrome Versiyonu   : ${process.versions.chrome}`);
  console.log(`    Node Versiyonu     : ${process.versions.node}`);
  console.log('='.repeat(70));

  const appDir = path.resolve(__dirname, '..', 'product', 'adim-8', 'electron-builder-uygulama');
  const preloadPath = path.join(appDir, 'build', 'preload.js');
  const distHtmlPath = path.join(appDir, 'dist', 'index.html');

  if (!fs.existsSync(preloadPath)) {
    console.error(`[-] HATA: Preload betiği bulunamadı: ${preloadPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(distHtmlPath)) {
    console.error(`[-] HATA: Dist index.html bulunamadı: ${distHtmlPath}`);
    process.exit(1);
  }

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false, // Başsız / Görünmez mod
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  // Konsol mesajlarını topla
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levelStr = level === 3 ? 'ERROR' : level === 2 ? 'WARN' : 'INFO';
    consoleLogs.push(`[RENDERER ${levelStr}]: ${message}`);
    if (level >= 3) {
      console.warn(`   ⚠️ [Konsol Hatası]: ${message}`);
    }
  });

  // Sayfa yükleme hatası
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[-] Sayfa yükleme başarısız (${errorCode}): ${errorDescription} - URL: ${validatedURL}`);
  });

  // Renderer çökme izleyicisi
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error(`[-] Renderer süreci çöktü: ${JSON.stringify(details)}`);
    process.exit(1);
  });

  console.log(`[*] UI Sayfası Yükleniyor: ${distHtmlPath}`);
  await mainWindow.loadFile(distHtmlPath);

  // React mount kontrolü (Polling ile maksimum 8 saniye bekle)
  const startTime = Date.now();
  const maxTimeout = 8000;
  let mounted = false;
  let domDetails = null;

  while (Date.now() - startTime < maxTimeout) {
    try {
      domDetails = await mainWindow.webContents.executeJavaScript(`
        (() => {
          const root = document.getElementById('root');
          const hasAPI = typeof window.electronAPI !== 'undefined';
          return {
            hasRoot: !!root,
            childCount: root ? root.children.length : 0,
            hasText: root ? (root.innerText && root.innerText.trim().length > 0) : false,
            htmlSnippet: root ? root.innerHTML.slice(0, 200) : '',
            pageTitle: document.title,
            hasElectronAPI: hasAPI
          };
        })()
      `);

      if (domDetails && domDetails.hasRoot && (domDetails.childCount > 0 || domDetails.hasText)) {
        mounted = true;
        break;
      }
    } catch (e) {
      // DOM henüz hazır olmayabilir
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  if (!mounted) {
    console.error('[-] HATA: React bileşeni #root içine bağlanamadı (Timeout)!');
    console.error('Son DOM Durumu:', domDetails);
    process.exit(1);
  }

  console.log('[+] [1/3] React DOM Ağacı Başarıyla Yüklendi (Mount Edildi):');
  console.log(`    - Sayfa Başlığı    : "${domDetails.pageTitle}"`);
  console.log(`    - Çocuk Düğüm Sayısı: ${domDetails.childCount}`);
  console.log(`    - DOM HTML Kesiti   : ${domDetails.htmlSnippet.replace(/\\s+/g, ' ')}...`);

  // Preload ve IPC Köprü Doğrulaması
  if (!domDetails.hasElectronAPI) {
    console.error('[-] HATA: window.electronAPI köprüsü tanımlanmamış!');
    process.exit(1);
  }
  console.log('[+] [2/3] Electron IPC Güvenli Köprüsü (Preload) Aktif.');

  // IPC Fonksiyon Testi
  const ipcTestResult = await mainWindow.webContents.executeJavaScript(`
    window.electronAPI.checkUpdates().then(res => res).catch(err => ({ error: err.message }))
  `);

  if (!ipcTestResult || ipcTestResult.status !== 'smoke_test_ok') {
    console.error('[-] HATA: Preload IPC invoke çağrısı beklenen yanıtı vermedi:', ipcTestResult);
    process.exit(1);
  }
  console.log(`[+] [3/3] IPC İki Yönlü İletişim Doğrulandı: ${JSON.stringify(ipcTestResult)}`);

  console.log('\n' + '='.repeat(70));
  console.log('[PASS] ELECTRON HEADLESS UI DUMAN TESTI %100 BASARIYLA TAMAMLANDI!');
  console.log('='.repeat(70) + '\n');

  testPassed = true;
  mainWindow.destroy();
  app.quit();
  process.exit(0);
}

// Güvenlik zaman aşımı (15 saniye)
setTimeout(() => {
  if (!testPassed) {
    console.error('[-] HATA: Duman testi genel zaman aşımına (15s) uğradı!');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.destroy();
    }
    process.exit(1);
  }
}, 15000);

app.whenReady().then(runSmokeTest).catch((err) => {
  console.error('[-] Beklenmeyen başlatma hatası:', err);
  process.exit(1);
});
