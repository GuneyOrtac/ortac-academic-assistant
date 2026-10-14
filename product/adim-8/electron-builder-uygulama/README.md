# Akademik Asistan - Adım 8: .exe Sarmalayıcısı

## 📦 Amaç

Masaüstü uygulama olarak çalışan, otomatik güncelleme destekli AI asistan uygulaması oluşturma.

## 🛠️ Kullanılacak Teknolojiler

### Seçenek A: Electron Builder (Önerilen)
- Electron 28+ v3
- electron-builder
- Vite + React SPA

### Seçenek B: PyWebVIEW + Flask
- Python alternatif yaklaşımı
- Daha az sistem kaynağı kullanır

## 📁 Proje Yapısı

```
electron-builder-uygulama/
├── build/              # Vite dağıtım ve Electron entry
│   ├── main.js           # Ana entry noktası
│   └── index.html        # Frontend root
├── node_modules/        # NPM paketleri
├── dist/                # Vite dağıtımı
├── package.json         # Bağımlılıklar ve build script'leri
└── README.md            # Bu dosya

pywebview-uygulama/    # TODO: Python alternatifine ağırlaştırılacak
└── pywebview_app.py     # TODO
```

## 🎯 Ana Özellikler

### 1. Electron Sarmalayıcı (packaging)
- FastAPI + Uvicorn detached process modu çalışır
- React SPA yükleme (Vite dağıtımı)
- Graceful shutdown (pencere kapanışı)

### 2. Process Lifecycle Yönetimi
```javascript
// Başlangıç
app.on('ready', async () => {
  startBackendServer(); // Detached subprocess olarak başlat
  createMainWindow();
});

// Kapanış
app.on('window-all-closed', async () => {
  await stopBackendServer(); // Uygulama kapandığında sonlandır
});
```

### 3. GitHub Releases API Entegrasyonu
- Sürüm kontrolü: `https://api.github.com/repos/akademik-asistan/Akademik-Asistan/releases/latest`
- Semver karşılaştırması (`maj.minor.patch`)
- Update badge gösterimi (sağ üst köşe)

### 4. Veri Klasörü Koruma
- ChromaDB persistence klasörü (`veri/`) kopyalama
- `appData/AkademikAsistan/` altına taşıma

## 🚀 Kurulum ve Çalıştırma

### İlk Kurulum (Development)
```powershell
# 1. Bağımlılıkları yükle
cd "E:\Makale YZ\product\adim-8\electron-builder-uygulama"
npm install

# 2. Vite + electron dev server başlat
npm run dev
```

### Packaging (.exe) İçin
```powershell
# Electron Builder ile paket oluştur
npm run package
```

### Sürüm Kontrolü
```bash
# GitHub API'den latest sürümü al ve karşılaştır
checkForUpdatesAndShowBadge() { ... }
```

## 📝 Notlar

1. **Detached Process**: Backend sunucusu `detached=true` modda başlatılır, böylece uygulama kapanışında graceful shutdown yapabiliriz.

2. **Port Yönetimi**: Rastgele port seçimi (8000-8100) ile çakışma önlenir.

3. **Data Persistence**: `app.getPath('appData')` altında ChromaDB persistence klasör korunur.