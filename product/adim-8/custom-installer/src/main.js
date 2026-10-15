const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec, spawn } = require('child_process');

// Tek Örnek Kilidi
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;

const EMBEDDING_PROFILES = {
  "bge-m3": {
    "id": "bge-m3",
    "name": "Akademik Standart (BAAI/bge-m3)",
    "hf_model": "BAAI/bge-m3",
    "download_size_gb": 2.2,
    "required_disk_gb": 22.2,
    "min_ram_gb": 16,
    "context_tokens": 8192,
    "description": "8192 token kesintisiz bağlam, hibrit anlamsal + terimsel BM25 arama."
  },
  "e5-small": {
    "id": "e5-small",
    "name": "Hafif & Hızlı (multilingual-e5-small)",
    "hf_model": "intfloat/multilingual-e5-small",
    "download_size_gb": 0.5,
    "required_disk_gb": 20.5,
    "min_ram_gb": 8,
    "context_tokens": 512,
    "description": "512 token limiti, 500 MB RAM tüketimi, anında indeksleme."
  },
  "qwen2-7b": {
    "id": "qwen2-7b",
    "name": "Zirve Güç (gte-Qwen2-7B-instruct)",
    "hf_model": "Alibaba-NLP/gte-Qwen2-7B-instruct",
    "download_size_gb": 14.5,
    "required_disk_gb": 34.5,
    "min_ram_gb": 32,
    "context_tokens": 32768,
    "description": "32.768 dev token penceresi, MTEB dünya 1.si anlamsal kavrayış."
  },
  "cloud-gemini": {
    "id": "cloud-gemini",
    "name": "Sıfır Donanım Yükü (Google Bulut API)",
    "hf_model": "models/text-embedding-004",
    "download_size_gb": 0.0,
    "required_disk_gb": 20.0,
    "min_ram_gb": 4,
    "context_tokens": 8192,
    "description": "Sıfır yerel RAM tüketimi, donanımı ve fanları hiç yormaz."
  }
};

function getDrives() {
  return new Promise((resolve) => {
    const cmd = 'powershell.exe -NoProfile -Command "Get-PSDrive -PSProvider FileSystem | Select-Object Name, Used, Free | ConvertTo-Json"';
    exec(cmd, (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve([
          { device: "C:\\", mountpoint: "C:\\", total_gb: 500, free_gb: 100, used_gb: 400, usage_pct: 80 }
        ]);
        return;
      }
      try {
        let raw = JSON.parse(stdout.trim());
        if (!Array.isArray(raw)) raw = [raw];
        const drives = raw.map(d => {
          const usedBytes = d.Used || 0;
          const freeBytes = d.Free || 0;
          const totalBytes = usedBytes + freeBytes;
          const total_gb = Math.round((totalBytes / (1024 ** 3)) * 10) / 10;
          const free_gb = Math.round((freeBytes / (1024 ** 3)) * 10) / 10;
          const used_gb = Math.round((usedBytes / (1024 ** 3)) * 10) / 10;
          const usage_pct = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 1000) / 10 : 0;
          return {
            device: `${d.Name}:\\`,
            mountpoint: `${d.Name}:\\`,
            total_gb,
            free_gb,
            used_gb,
            usage_pct
          };
        });
        resolve(drives);
      } catch (parseErr) {
        resolve([
          { device: "C:\\", mountpoint: "C:\\", total_gb: 500, free_gb: 100, used_gb: 400, usage_pct: 80 }
        ]);
      }
    });
  });
}

function createWindow() {
  const iconPath = path.join(__dirname, '..', 'assets', 'icon.ico');

  mainWindow = new BrowserWindow({
    width: 1220,
    height: 840,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: '#09090b',
    title: 'ORTAC Geo|Science - Akademik Asistan Kurulum Sihirbazı',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    frame: true,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC HANDLERS ---

ipcMain.handle('installer:get-system-info', async () => {
  const drives = await getDrives();
  const total_ram_gb = Math.round((os.totalmem() / (1024 ** 3)) * 10) / 10;
  const bos_ram_gb = Math.round((os.freemem() / (1024 ** 3)) * 10) / 10;
  const cpu_cekirdek = os.cpus().length || 8;

  return {
    donanim: {
      toplam_ram_gb,
      bos_ram_gb,
      cpu_cekirdek
    },
    suruculer: drives,
    profiller: EMBEDDING_PROFILES,
    is_installer: true
  };
});

ipcMain.handle('installer:select-directory', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Akademik Asistan Kurulum ve Kütüphane Klasörünü Seçin',
    properties: ['openDirectory', 'createDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('installer:start-installation', async (event, params) => {
  const { targetDir, modelProfile, apiMode, customApiKey } = params;

  function sendProgress(data) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('installer:progress', data);
    }
  }

  try {
    // 1. Hedef Dizin Doğrulama
    sendProgress({ step: 1, message: `Hedef dizin oluşturuluyor: ${targetDir}`, percent: 10 });
    fs.mkdirSync(targetDir, { recursive: true });
    await new Promise(r => setTimeout(r, 400));
    sendProgress({ step: 1, completed: true, percent: 20 });

    // 2. Paket Dosyalarının Hedefe Açılması
    sendProgress({ step: 2, message: 'Program çekirdeği ve yerel yapay zekâ motoru aktarılıyor...', percent: 25 });
    
    // Payload zip dosyasının yolunu bul
    let payloadZip = '';
    const devPayload = path.join(__dirname, '..', 'payload', 'payload.zip');
    const packagedPayload = path.join(process.resourcesPath, 'payload', 'payload.zip');

    if (fs.existsSync(packagedPayload)) {
      payloadZip = packagedPayload;
    } else if (fs.existsSync(devPayload)) {
      payloadZip = devPayload;
    } else {
      throw new Error(`Kurulum paketi (payload.zip) bulunamadı!`);
    }

    // Windows dahili tar.exe ile multithreaded çıkartma
    await new Promise((resolve, reject) => {
      const tarCmd = `tar -xf "${payloadZip}" -C "${targetDir}"`;
      exec(tarCmd, (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`Arşiv ayıklama hatası: ${err.message || stderr}`));
        } else {
          resolve(true);
        }
      });
    });

    sendProgress({ step: 2, completed: true, percent: 75 });

    // 3. Yapılandırma ve Model Profilinin Kaydedilmesi
    sendProgress({ step: 3, message: 'Yapay zekâ model profili ve ayarlar yapılandırılıyor...', percent: 80 });

    const veriDir = path.join(targetDir, 'veri');
    const pdfDir = path.join(veriDir, 'pdf_kutuphanesi');
    const chromaDir = path.join(veriDir, 'chroma_db');
    fs.mkdirSync(pdfDir, { recursive: true });
    fs.mkdirSync(chromaDir, { recursive: true });

    // Hem hedef kök dizine hem de resources/backend içine settings.json ve .env yaz
    const defaultGeminiKey = "AQ.Ab8RN6I9y5x8mhUuqNm-eI0qwHbCbujU8LWANFf6Z2ZCFS8ULA";
    const finalGeminiKey = (customApiKey && customApiKey.trim()) ? customApiKey.trim() : defaultGeminiKey;

    const settingsPayload = {
      onboarding_completed: true,
      embedding_profile: modelProfile || "bge-m3",
      api_mode: apiMode || "system_default",
      workspace: {
        storage_path: veriDir,
        pdf_dir: pdfDir,
        chroma_dir: chromaDir
      },
      api_keys: {
        gemini: finalGeminiKey,
        openai: "",
        deepseek: "",
        perplexity: "",
        anthropic: "",
        groq: "",
        nvidia: ""
      },
      models: {
        chat: { label: "Genel Sohbet & RAG", provider: "gemini", model: "gemini-3.8-flash" },
        drafting: { label: "Makale Taslağı (OpenDraft)", provider: "gemini", model: "gemini-3.8-flash" },
        vision: { label: "PDF & Doküman Analizi", provider: "gemini", model: "gemini-3.1-flash-lite" }
      }
    };

    const targetBackendDir = path.join(targetDir, 'resources', 'backend');
    const targetBackendVeri = path.join(targetBackendDir, 'veri');
    fs.mkdirSync(targetBackendVeri, { recursive: true });
    fs.writeFileSync(path.join(targetBackendVeri, 'settings.json'), JSON.stringify(settingsPayload, null, 2), 'utf8');
    fs.writeFileSync(path.join(veriDir, 'settings.json'), JSON.stringify(settingsPayload, null, 2), 'utf8');

    // .env dosyası oluştur (Python backend ve venv için)
    const envContent = `GEMINI_API_KEY="${finalGeminiKey}"\nGOOGLE_API_KEY="${finalGeminiKey}"\nHF_HUB_DISABLE_SYMLINKS_WARNING=1\n`;
    try {
      fs.writeFileSync(path.join(targetBackendDir, '.env'), envContent, 'utf8');
      fs.writeFileSync(path.join(targetDir, '.env'), envContent, 'utf8');
    } catch (e) {}

    await new Promise(r => setTimeout(r, 400));
    sendProgress({ step: 3, completed: true, percent: 90 });

    // 4. Masaüstü Kısayolunun Oluşturulması
    sendProgress({ step: 4, message: 'Masaüstü kısayolu oluşturuluyor...', percent: 93 });

    const targetExe = path.join(targetDir, 'Akademik Asistan.exe');
    const targetIcon = path.join(targetDir, 'icon.ico');
    
    // İkon dosyasını hedefe kopyala
    const sourceIcon = path.join(__dirname, '..', 'assets', 'icon.ico');
    if (fs.existsSync(sourceIcon)) {
      try {
        fs.copyFileSync(sourceIcon, targetIcon);
      } catch (e) {}
    }

    const desktopPath = app.getPath('desktop');
    const shortcutPath = path.join(desktopPath, 'ORTAC Akademik Asistan.lnk');

    shell.writeShortcutLink(shortcutPath, {
      target: targetExe,
      cwd: targetDir,
      description: 'ORTAC Geo|Science - Akademik Asistan',
      icon: fs.existsSync(targetIcon) ? targetIcon : targetExe,
      iconIndex: 0
    });

    await new Promise(r => setTimeout(r, 400));
    sendProgress({ step: 4, completed: true, percent: 98 });

    // 5. Tamamlandı
    sendProgress({ step: 5, completed: true, message: 'Kurulum Başarıyla Tamamlandı!', percent: 100 });

    return { success: true, targetDir, targetExe };
  } catch (err) {
    sendProgress({ error: err.message });
    return { success: false, error: err.message };
  }
});

ipcMain.handle('installer:launch-app', async (event, targetExe) => {
  if (fs.existsSync(targetExe)) {
    const targetDir = path.dirname(targetExe);
    spawn(targetExe, [], {
      cwd: targetDir,
      detached: true,
      stdio: 'ignore'
    }).unref();
  }
  app.quit();
});
