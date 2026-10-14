# Yol Haritası ve Vizyon

## Vizyon
Basit PDF kütüphanesinden → kendi kendine öğrenen tam otonom "Akademik Çalışma Arkadaşı"na dönüşüm.

---

## 🎯 Yakın Vadeli (Ürünleştirme)

### Adım 8: Masaüstü .exe + Otomatik Güncelleme
- [ ] Electron sarmalayıcısı (React + Python backend)
- [ ] Process lifecycle (açılışta FastAPI başlat, kapanışta sonlandır)
- [ ] GitHub Releases API ile sessiz sürüm kontrolü
- [ ] UpdateBadge (sağ üstte parlayan bildirim)
- [ ] "Neler Yeni?" modal + veri/ klasörü koruma

### Adım 9: Auth & Lisanslama
- [ ] Kullanıcı adı/şifre (bcrypt/argon2)
- [ ] Lisans anahtarı (AKAD-XXXX-YYYY-ZZZZ)
- [ ] HWID (donanım parmak izi) doğrulama
- [ ] Offline/online imza kontrolü

### Adım 10: Token/Maliyet Paneli
- [ ] Girdi/çıktı token sayacı
- [ ] USD + TL karşılığı anlık gösterim (450 TL bakiye)
- [ ] Günlük/haftalık kullanım grafiği
- [ ] Akademik üretkenlik istatistikleri

### Adım 11: .akpack P2P Senkronizasyon
- [ ] PDF + künye + vektör paketleme
- [ ] İçe aktarma sihirbazı
- [ ] LAN/P2P paylaşım
- [ ] Ortak Akademik Dizin senkronizasyonu

### Adım 12: Admin Dashboard (GitHub-Merkezli)
- [ ] telemetry/{lisans_id}.json toplama
- [ ] Lisans üretici (tür seçimi)
- [ ] Kullanıcı listesi + grafik
- [ ] Fine-grained GitHub token (sadece telemetry/ yazma)

---

## 🚀 Orta Vadeli (Otonomlaşma)

### Otonom Avcı Modülü (OpenAlex + PASA)
- [ ] Konu bazlı makale bulma
- [ ] Atıf ağı genişletme (PASA mantığı)
- [ ] Açık erişim PDF otomatik indirme

### Unified PDF Parser
- [ ] Markdown'a çevirme
- [ ] Tablo koruma
- [ ] LaTeX formül indeksleme
- [ ] Resophy + paper-reader-skill birleşimi

### Agentic RAG (ScholarLens Mantığı)
- [ ] Çoklu makale karşılaştırma
- [ ] Yöntemsel farklar tablosu
- [ ] "Eksik Kaynaklar" sekmesi (paywall tespiti)

### "Bana Öğret" Modülü
- [ ] Tez danışmanı davranışı
- [ ] Formül açıklama
- [ ] Metodolojik tercih izahı

### Sıfır Halüsinasyon OpenDraft
- [ ] Kesin atıf (APA 7)
- [ ] Word .docx çıktı
- [ ] Sarı vurgu ile atıf işaretleme
- [ ] Mendeley/Zotero dışa aktarım

---

## 🌐 Uzun Vadeli (DevOps & Entegrasyon)

### Docker + Taşınabilirlik
- [ ] Absolute path → relative path
- [ ] docker-compose.yml (Frontend + Backend + ChromaDB)
- [ ] Uygulama/veri ayrımı
- [ ] Tek tık .akpack yedek

### Yedekleme Stratejisi
- [ ] Cloud (Drive/OneDrive) toggle
- [ ] Yerel .zip toggle
- [ ] Anında "Şimdi Yedekle" butonu

### MCP Entegrasyonları
- [ ] GIS: mahdin75/gis-mcp (GeoPandas, Shapely, Rasterio)
- [ ] ArcGIS Pro: geo2004/MCP-ArcGISPro
- [ ] MATLAB: matlab/matlab-mcp-server (resmi)
- [ ] Zotero: yerel SQLite + Better BibTeX

---

## 📚 İlham Alınan Projeler
- **PASA (Bytedance):** Otonom atıf ağı analizi
- **Resophy & paper-reader-skill:** PDF → Markdown/tablo/formül
- **ScholarLens:** Agentic RAG karşılaştırmalı sentez
- **OpenDraft:** Sıfır halüsinasyon, kesin atıf
