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
  let backendExe = '';
  let backendCwd = '';
  let args = [];

  if (isDev) {
    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    backendExe = path.join(projectRoot, 'dev', 'backend', '.venv', 'Scripts', 'python.exe');
    const backendScript = path.join(projectRoot, 'dev', 'backend', 'main.py');
    backendCwd = path.join(projectRoot, 'dev', 'backend');
    args = [backendScript];
  } else {
    // Packaged Electron app: backend executable in extraResources
    backendExe = path.join(process.resourcesPath, 'backend', 'AkademikAsistan_Backend.exe');
    backendCwd = path.join(process.resourcesPath, 'backend');
    args = [];
  }

  console.log('[ELECTRON] Backend başlatılıyor:', backendExe, args);

  try {
    backendProcess = spawn(backendExe, args, {
      cwd: backendCwd,
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
function waitForBackend(callback, retries = 45) {
  if (retries <= 0) {
    console.warn('[ELECTRON] Backend zaman aşımına uğradı, yine de pencere açılıyor.');
    callback();
    return;
  }

  http.get(`http://127.0.0.1:${BACKEND_PORT}/api/sistem-bilgisi`, (res) => {
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
  const isDev = !app.isPackaged;
  const iconPath = isDev
    ? path.join(__dirname, '..', '..', '..', 'Logo', 'icon.ico')
    : path.join(__dirname, '..', 'assets', 'icon.ico');

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#09090b',
    title: 'ORTAC Geo|Science - Akademik Asistan v0.0.1',
    icon: iconPath,
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const distIndex = path.join(__dirname, '..', 'dist', 'index.html');

  if (isDev) {
    http.get(FRONTEND_DEV_URL, (res) => {
      mainWindow.loadURL(FRONTEND_DEV_URL);
    }).on('error', () => {
      mainWindow.loadFile(distIndex);
    });
  } else {
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
  if (backendProcess && backendProcess.pid) {
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