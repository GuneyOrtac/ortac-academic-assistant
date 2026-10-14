# Aktif Bağlam

## ✅ Gelecek Seans İçin Kalıpları

### ActiveContext Kullanımı
- **Görev başında:** `memory-bank/activeContext.md` oku → bağlamdan habert al
- **Görev sonunda:** Aynı dosyaya yeni durum bilgisi ekle (sınırsız satır)
- **Kural:** Geçici bağlam bilgisi `decisions.md`, `techContext.md`, `progress.md`'ye taşınarak aktif bağlamma (activeContext) kalacak.

## Şu An Çalışılan (Aktif Durum Bilgisi - Gelecek Seans İçin Kalacak)

### 1. Current Work
Kullanıcı backend ve frontend sunucularını terminalde başlatmamı istedi. İki sunucu da başarıyla çalışıyor:
- Backend (FastAPI + Uvicorn): Port 8000'de çalışıyor
- Frontend (Vite + React SPA): Port 5173'te çalışıyor

Sonrasında, projenin gelecekte yapılacak işleme dair yol haritasını (roadmap) kullanıcıya sundum. Dosyayı okudum ve proje vizyonu, yakın/orta/uzun vadeli hedeflerini paylaştım.

### 2. Key Technical Concepts
- **Backend:** FastAPI (Python), Uvicorn (ASGI sunucu), Pydantic (veri validasyonu)
- **Frontend:** Vite (development build tool), React, TypeScript
- **Veritabanı:** ChromaDB (lokal vektör veritabanı: `veri/chroma_db`)
- **RAG (Retrieval Augmented Generation):** PDF yükleme, vektörizasyon, semantik arama
- **MCP (Model Context Protocol):** Araç entegrasyonları için kütüphane sistemi
- **OpenAlex:** Literatür tarama API'si
- **Auth & Lisanslama:** Bcrypt/argon2, HWID doğrulama, lisans anahtarı sistemi

### 3. Relevant Files and Code
#### `dev/backend/main.py`
- FastAPI uygulamasının ana router dosyası
- PDF yükleme, kütüphane yönetimi, semantik arama, sohbet endpoint'leri içeriyor
- MCP araçları entegrasyonu (`mcp-araclar`, `mcp-baglan`)
- Literatur tarama (`literatur-tara`)

#### `dev/frontend/package.json`
Vite + React yapısı, build script'leri

#### `memory-bank/roadmap.md`
Projenin vizyonu ve gelecekte yapılacak işlere dair detaylı yol haritası:
- **Adım 8:** Electron .exe sarmalayıcısı, otomatik güncelleme
- **Adım 9:** Auth & lisanslama sistemi
- **Adım 10:** Token/maliyet paneli
- **Adım 11:** .akpack P2P senkronizasyon
- **Adım 12:** Admin dashboard (GitHub-merkezi)
- **Orta Vadeli:** Otonom avcı modülü, Unified PDF Parser, Agentic RAG

### 4. Problem Solving
✅ Backend sunucusu başarıyla başlatıldı ve çalışıyor durumda  
✅ Frontend sunucusu başarıyla başlatıldı ve çalışıyor durumda  
✅ API çağrıları başarılı (kütüphane listesi, mcp araçları, semantik arama)  

### 5. Pending Tasks and Next Steps

#### Yürüten Terminal İşleri:
```powershell
# Backend (FastAPI + Uvicorn - port 8000)
python "E:\Makale YZ\dev\backend\main.py"

# Frontend (Vite React SPA - port 5173)
cd "E:\Makale YZ\dev\frontend" ; npm run dev
```

#### İlk Çalıştırmak İçin:
**Backend için:**
```powershell
pip install -r "E:\Makale YZ\dev\backend\requirements.txt"
python "E:\Makale YZ\dev\backend\main.py"
```

**Frontend için (ilk kez):**
```powershell
cd "E:\Makale YZ\dev\frontend" ; npm install
npm run dev
```

#### Gelecek İşler (Roadmap'dan):
1. **Adım 8:** Electron sarmalayıcısı, process lifecycle yönetimi, GitHub Releases API ile otomatik güncelleme
2. **Adım 9:** Kimlik doğrulama ve lisanslama sistemi ekleme
3. **Adım 10:** Token/maliyet paneli implementasyonu
4. **Adım 11:** .akpack P2P senkronizasyon sistemi
5. **Adım 12:** Admin dashboard (GitHub-merkezi telemetry)

6. **Orta Vadeli Hedefler:** Otonom avcı modülü, Unified PDF Parser, Agentic RAG, "Bana Öğret" modülü
7. **Uzun Vadeli:** Docker konteynerizasyon, yedekleme stratejisi, MCP entegrasyonları (GIS, ArcGIS Pro, MATLAB, Zotero)

### 8. Project Vision & Roadmap Summary
Proje basit bir PDF kütüphanesinden "kendi kendine öğrenen" Akademik Çalışma Arkadaşı'na dönüşecek:

**Vizyon:** Basit PDF kütüphanesi → otonom akademik çalışma arkadaşı

**Referanslar:** PASA (atıf ağı), Resophy (PDF parser), ScholarLens (Agentic RAG), OpenDraft (sıfır halüsinasyon)