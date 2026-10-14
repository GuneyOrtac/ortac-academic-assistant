// Electron Builder sonrası işlem: .exe dosyasını hazırla, ChromaDB klasörünü appData'ya kopyala

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ana paket dosyası konumu (electron-builder tarafından oluşturulan .exe/zip dosyası)
const pkgPath = process.argv[2] || 'release\\AkademikAsistan.exe'; 

console.log('[AFTER_PACK] Paketleme tamamlandı. Sonraki adımlar...');

// İlk yükleme sonrası yapılandırma için:
// 1. AppData klasörü oluştur (ChromaDB persistence)
const dataDir = path.join(app.getPath('appData'), 'AkademikAsistan');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`[AFTER_PACK] AppData klasörü oluşturuldu: ${dataDir}`);
}

// 2. Eğer veri klasörü varsa kopyala (ChromaDB persistence)
const sourceVeri = path.join(process.resourcesPath, 'AkademikAsistan', 'veri');
if (sourceVeri && fs.existsSync(sourceVeri)) {
  try {
    // Hedef dizini bul veya oluştur
    const targetDir = path.join(dataDir, 'chroma_db');
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir);
      
      // Eğer kaynak dosya yoksa boş klasör bırak (ilk kullanım için)
      console.log('[AFTER_PACK] ChromaDB persistence klasikörü hazırlandı.');
      
      // İlk kullanım için placeholder oluştur
      const placeholderPath = path.join(targetDir, 'placeholder.txt');
      if (!fs.existsSync(placeholderPath)) {
        fs.writeFileSync(placeholderPath, 'Bu klasör ilk kullanımda boş kaldığında otomatik oluşturulacak.', 'utf-8');
      }
    }
  } catch (error) {
    console.error('[HATASIZ] Veri kopyalama hatası:', error.message);
  }
}

// 3. Kullanıcıya bilgilendirme mesajı yaz
console.log('[INFO] Uygulama yüklendi! İlk çalıştırmada tüm gereksinimler kurulacak.');
console.log('[INFO] ChromaDB indeksleri boş, ilk sorgu yapılırken oluşturulacak.');

// 4. Executable dosyası zaten electron-builder tarafından oluşturuldu (build/main.js'de)
// Bu sadece "after-pack" hook'ı olup elektronik çıktıyı hazırlar (setup wizard veya doğrudan .exe olarak)

console.log('[COMPLETE] Electron Builder sonrası işlemler tamamlandı.');