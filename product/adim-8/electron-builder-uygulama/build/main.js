const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

// --- 1. Tek Örnek Kilidi (Single Instance Lock) ---
// Kullanıcı kısayola art arda tıkladığında birden fazla kopya ve port çakışmasını engeller
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let backendProcess = null;
const BACKEND_PORT = 8000;
const FRONTEND_DEV_URL = 'http://localhost:5173';

// --- 2. Günlükleme (Logging) ---
function getLogPath() {
  try {
    const logDir = path.join(app.getPath('userData'), 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    return path.join(logDir, 'app.log');
  } catch (e) {
    return null;
  }
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(msg);
  const logFile = getLogPath();
  if (logFile) {
    try {
      fs.appendFileSync(logFile, line, 'utf8');
    } catch (e) {}
  }
}

process.on('uncaughtException', (err) => {
  log(`[UNCAUGHT EXCEPTION]: ${err.stack || err}`);
});

process.on('unhandledRejection', (reason) => {
  log(`[UNHANDLED REJECTION]: ${reason}`);
});

// --- 3. Python Backend Sürecini Başlatma ---
function startBackend() {
  const isDev = !app.isPackaged;
  let backendExe = '';
  let backendCwd = '';
  let args = [];

  if (isDev) {
    const localPackagedBackend = path.join(__dirname, '..', 'backend', 'AkademikAsistan_Backend.exe');
    const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
    const devPython = path.join(projectRoot, 'dev', 'backend', '.venv', 'Scripts', 'python.exe');

    if (fs.existsSync(localPackagedBackend)) {
      backendExe = localPackagedBackend;
      backendCwd = path.join(__dirname, '..', 'backend');
      args = [];
    } else if (fs.existsSync(devPython)) {
      backendExe = devPython;
      backendCwd = path.join(projectRoot, 'dev', 'backend');
      args = [path.join(backendCwd, 'main.py')];
    }
  } else {
    // Paketlenmiş Electron: Backend extraResources içinde
    backendExe = path.join(process.resourcesPath, 'backend', 'AkademikAsistan_Backend.exe');
    backendCwd = path.join(process.resourcesPath, 'backend');
    args = [];
  }

  log(`[ELECTRON] Backend başlatılıyor: ${backendExe}`);

  if (!fs.existsSync(backendExe)) {
    log(`[ELECTRON HATA] Backend yürütülebilir dosyası bulunamadı: ${backendExe}`);
    return;
  }

  const appRoot = isDev ? path.resolve(__dirname, '..', '..', '..', '..') : path.dirname(process.resourcesPath);
  const veriDir = path.join(appRoot, 'veri');
  const modelsDir = path.join(veriDir, 'modeller', 'hf');
  const torchDir = path.join(veriDir, 'modeller', 'torch');

  try {
    fs.mkdirSync(path.join(veriDir, 'pdf_kutuphanesi'), { recursive: true });
    fs.mkdirSync(path.join(veriDir, 'chroma_db'), { recursive: true });
    fs.mkdirSync(modelsDir, { recursive: true });
    fs.mkdirSync(torchDir, { recursive: true });
  } catch (e) {}

  const backendEnv = Object.assign({}, process.env, {
    AKADEMIK_ASISTAN_ROOT: appRoot,
    AKADEMIK_ASISTAN_DATA: veriDir,
    HF_HOME: modelsDir,
    TRANSFORMERS_CACHE: modelsDir,
    TORCH_HOME: torchDir,
    HF_HUB_DISABLE_SYMLINKS_WARNING: '1'
  });

  try {
    backendProcess = spawn(backendExe, args, {
      cwd: backendCwd,
      env: backendEnv,
      detached: false,
      stdio: 'pipe',
      windowsHide: true
    });

    backendProcess.stdout.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) log(`[BACKEND STDOUT]: ${msg}`);
    });

    backendProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) log(`[BACKEND STDERR]: ${msg}`);
    });

    backendProcess.on('close', (code) => {
      log(`[BACKEND EXIT]: Süreç kod ${code} ile kapandı.`);
      backendProcess = null;
    });

    backendProcess.on('error', (err) => {
      log(`[BACKEND ERROR]: Süreç başlatılamadı: ${err.message}`);
    });
  } catch (err) {
    log(`[ELECTRON] Backend spawn hatası: ${err.message}`);
  }
}

// --- 4. Ana Pencereyi Oluşturma (ANINDA AÇILIR) ---
function createMainWindow() {
  if (mainWindow) return;

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
    title: `ORTAC Geo|Science - Akademik Asistan v${app.getVersion()}`,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    frame: true,
    show: false, // İlk render tamamlanınca gösterilecek
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log('[ELECTRON] Ana pencere ekrana verildi.');
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

// --- 5. İkinci Örnek Tetiklendiğinde Pencereye Odaklan ---
app.on('second-instance', () => {
  log('[ELECTRON] İkinci bir kopya çalıştırılmak istendi, mevcut pencere öne alınıyor.');
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// --- 6. Uygulama Yaşam Döngüsü ---
app.whenReady().then(() => {
  log('[ELECTRON] Uygulama hazır, pencere ve backend başlatılıyor...');
  createMainWindow();
  startBackend();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  log('[ELECTRON] Tüm pencereler kapatıldı, backend sonlandırılıyor...');
  if (backendProcess && backendProcess.pid) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', backendProcess.pid, '/f', '/t']);
      } else {
        backendProcess.kill();
      }
    } catch (e) {
      log(`[ELECTRON] Backend sonlandırma hatası: ${e.message}`);
    }
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- 7. IPC Kanalları ---
ipcMain.handle('app:check-updates', async () => {
  const currentVersion = app.getVersion();
  return { currentVersion };
});

ipcMain.handle('app:create-shortcut', async () => {
  try {
    const desktopPath = app.getPath('desktop');
    const shortcutPath = path.join(desktopPath, 'ORTAC Akademik Asistan.lnk');
    const iconPath = path.join(__dirname, '..', 'assets', 'icon.ico');
    shell.writeShortcutLink(shortcutPath, {
      target: process.execPath,
      description: 'ORTAC Geo|Science - Akademik Asistan',
      icon: fs.existsSync(iconPath) ? iconPath : undefined,
      iconIndex: 0
    });
    log(`[ELECTRON] Masaüstü kısayolu oluşturuldu: ${shortcutPath}`);
    return { success: true };
  } catch (err) {
    log(`[ELECTRON] Kısayol oluşturma hatası: ${err.message}`);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('app:open-external', async (_, url) => {
  try {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      await shell.openExternal(url);
      return { success: true };
    }
  } catch (err) {
    log(`[ELECTRON] openExternal hatası: ${err.message}`);
    return { success: false, error: err.message };
  }
});