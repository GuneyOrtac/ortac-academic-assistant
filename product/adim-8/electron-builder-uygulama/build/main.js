const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow = null;
let backendProcess = null;
const BACKEND_PORT = 8000;
const FRONTEND_DEV_URL = 'http://localhost:5173';

// 1. Python Backend Sürecini Başlatma
function startBackend() {
  const isDev = !app.isPackaged;
  const projectRoot = path.resolve(__dirname, '..', '..', '..');
  const pythonExecutable = path.join(projectRoot, 'dev', 'backend', '.venv', 'Scripts', 'python.exe');
  const backendScript = path.join(projectRoot, 'dev', 'backend', 'main.py');

  console.log('[ELECTRON] Backend başlatılıyor:', pythonExecutable, backendScript);

  try {
    backendProcess = spawn(pythonExecutable, [backendScript], {
      cwd: path.join(projectRoot, 'dev', 'backend'),
      detached: false,
      stdio: 'pipe'
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`[BACKEND STDOUT]: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`[BACKEND STDERR]: ${data}`);
    });

    backendProcess.on('close', (code) => {
      console.log(`[BACKEND EXIT]: Kod ${code}`);
    });
  } catch (err) {
    console.error('[ELECTRON] Backend başlatılamadı:', err);
  }
}

// 2. Backend'in Hazır Olduğunu Kontrol Etme (Polling)
function waitForBackend(callback, retries = 30) {
  if (retries <= 0) {
    console.warn('[ELECTRON] Backend zaman aşımına uğradı, yine de pencere açılıyor.');
    callback();
    return;
  }

  http.get(`http://localhost:${BACKEND_PORT}/api/sistem-bilgisi`, (res) => {
    if (res.statusCode === 200) {
      console.log('[ELECTRON] Backend başarıyla yanıt verdi.');
      callback();
    } else {
      setTimeout(() => waitForBackend(callback, retries - 1), 1000);
    }
  }).on('error', () => {
    setTimeout(() => waitForBackend(callback, retries - 1), 1000);
  });
}

// 3. Ana Pencereyi Oluşturma
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#09090b',
    title: 'ORTAC Geo|Science - Akademik Asistan',
    icon: path.join(__dirname, '..', '..', '..', 'Logo', 'icon.ico'),
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    // Geliştirme modunda Vite dev sunucusunu dene, açılamazsa yerel dist'i yükle
    http.get(FRONTEND_DEV_URL, (res) => {
      mainWindow.loadURL(FRONTEND_DEV_URL);
    }).on('error', () => {
      const distIndex = path.join(__dirname, '..', '..', '..', 'dev', 'frontend', 'dist', 'index.html');
      mainWindow.loadFile(distIndex);
    });
  } else {
    const distIndex = path.join(__dirname, '..', '..', '..', 'dev', 'frontend', 'dist', 'index.html');
    mainWindow.loadFile(distIndex);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 4. Uygulama Yaşam Döngüsü (Lifecycle)
app.whenReady().then(() => {
  startBackend();
  waitForBackend(() => {
    createMainWindow();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  // Backend sürecini güvenle sonlandır
  if (backendProcess) {
    console.log('[ELECTRON] Backend süreci sonlandırılıyor...');
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', backendProcess.pid, '/f', '/t']);
      } else {
        backendProcess.kill();
      }
    } catch (e) {
      console.error('[ELECTRON] Backend sonlandırma hatası:', e);
    }
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC: GitHub Güncelleme Kontrolü
ipcMain.handle('app:check-updates', async () => {
  const currentVersion = app.getVersion();
  return { currentVersion };
});