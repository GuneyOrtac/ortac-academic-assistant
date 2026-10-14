# Telemetri Veri Şeması (telemetry/{lisans_id}.json)

Bu dosya her kullanıcının masaüstü uygulamasından GitHub'a gönderilecek verilerin
tam yapısını ve her alanın neden gerekli olduğunu tanımlar.

---

## Örnek JSON Çıktısı

```json
{
  "schema_version": "1.0",
  "license_id": "AKAD-9X2A-B78M-2026",
  "user_alias": "Güney A.",
  "app_version": "1.2.0",
  "last_heartbeat": "2026-10-12T15:30:00+03:00",

  "session": {
    "session_start": "2026-10-12T14:00:00+03:00",
    "session_duration_min": 47,
    "pdfs_uploaded_this_session": 3,
    "questions_asked_this_session": 12,
    "drafts_generated_this_session": 1
  },

  "lifetime": {
    "first_activation": "2026-09-15T10:00:00+03:00",
    "total_sessions": 84,
    "total_usage_hours": 62.5,
    "total_pdfs_uploaded": 127,
    "total_pdfs_in_library": 118,
    "total_questions_asked": 430,
    "total_drafts_generated": 14,
    "total_words_drafted": 28500
  },

  "tokens": {
    "total_input_tokens": 2450000,
    "total_output_tokens": 680000,
    "estimated_cost_usd": 0.89,
    "estimated_cost_try": 30.25,
    "budget_limit_try": 450,
    "budget_remaining_pct": 93.3,
    "tokens_by_task": {
      "analysis": 820000,
      "chat": 1430000,
      "drafting": 880000
    }
  },

  "system": {
    "os": "Windows 11 Pro 24H2",
    "cpu": "Intel i7-12700H",
    "ram_gb": 16,
    "display_resolution": "1920x1080",
    "rag_db_drive": "E:",
    "rag_db_size_mb": 342,
    "rag_db_drive_free_gb": 28.4,
    "rag_db_drive_total_gb": 120,
    "rag_db_drive_usage_pct": 76.3,
    "embedding_model": "all-MiniLM-L6-v2",
    "active_llm_model": "gemini-3.8-flash"
  },

  "license": {
    "type": "standard",
    "issued_at": "2026-09-15",
    "expires_at": "2027-09-15",
    "status": "active",
    "hwid": "A1B2C3D4E5F6"
  }
}
```

---

## Alan Açıklamaları ve Gerekçeleri

### 🔑 Kimlik & Lisans

| Alan | Açıklama | Neden Gerekli? |
|:-----|:---------|:---------------|
| `license_id` | Lisans anahtarı | Kullanıcıyı tanımlamak (kişisel bilgi yerine) |
| `user_alias` | Kullanıcının koyduğu takma ad | Admin panelinde "AKAD-9X2A" yerine "Güney A." görmek |
| `app_version` | Yüklü uygulama sürümü | Kaç kişi güncel, kaçı eski sürümde tespiti |
| `last_heartbeat` | Son bağlantı zamanı | Aktif/pasif kullanıcı ayrımı |
| `license.type` | Deneme / Standart / Premium | Lisans türü takibi |
| `license.expires_at` | Bitiş tarihi | Süresi dolacak lisansları önceden görmek |
| `license.hwid` | Donanım parmak izi | Bir lisansın birden fazla PC'de kullanılmasını önlemek |

### 📊 Oturum Verileri (Her açılışta güncellenir)

| Alan | Açıklama | Neden Gerekli? |
|:-----|:---------|:---------------|
| `session_duration_min` | Son oturumun süresi (dakika) | Ortalama kullanım süresi analizi |
| `pdfs_uploaded_this_session` | Bu oturumda yüklenen PDF | Son aktivite ne zaman, ne kadar yoğun |
| `questions_asked_this_session` | Bu oturumda sorulan soru | Sohbet modülünün kullanım yoğunluğu |
| `drafts_generated_this_session` | Bu oturumda üretilen taslak | OpenDraft kullanım sıklığı |

### 📈 Ömür Boyu İstatistikler (Kümülatif)

| Alan | Açıklama | Neden Gerekli? |
|:-----|:---------|:---------------|
| `total_sessions` | Toplam oturum sayısı | Bağımlılık/sadakat metriği |
| `total_usage_hours` | Toplam kullanım saati | En aktif kullanıcıları belirlemek |
| `total_pdfs_uploaded` | Ömür boyu yüklenen PDF | Toplam sisteme kazandırılan içerik |
| `total_pdfs_in_library` | Kütüphanedeki mevcut PDF | Silme yapanlar dahil net durum |
| `total_questions_asked` | Toplam soru sayısı | RAG motorunun ne kadar kullanıldığı |
| `total_drafts_generated` | Toplam taslak sayısı | OpenDraft'ın değer üretimi |
| `total_words_drafted` | Üretilen toplam kelime | Akademik çıktı hacmi |

### 💰 Token & Maliyet Takibi

| Alan | Açıklama | Neden Gerekli? |
|:-----|:---------|:---------------|
| `total_input_tokens` | Gönderilen toplam girdi token | Ham maliyet hesabı |
| `total_output_tokens` | Alınan toplam çıktı token | Ham maliyet hesabı |
| `estimated_cost_usd` | Tahmini harcama (USD) | Bütçe kontrolü |
| `estimated_cost_try` | Tahmini harcama (TL) | Kullanıcıya gösterilecek yerel para |
| `budget_remaining_pct` | Kalan bütçe yüzdesi | Bakiyesi azalan kullanıcıları tespit |
| `tokens_by_task` | Görev bazlı token dağılımı | Hangi modül en pahalı, optimizasyon hedefi |

### 🖥️ Sistem Bilgileri

| Alan | Açıklama | Neden Gerekli? |
|:-----|:---------|:---------------|
| `os` | İşletim sistemi ve sürümü | Uyumluluk ve hata ayıklama |
| `cpu` | İşlemci modeli | Performans sorunlarında teşhis |
| `ram_gb` | RAM miktarı | Embedding yükleme hataları için |
| `display_resolution` | Ekran çözünürlüğü | UI tasarım kararları (küçük ekranda bozulma var mı) |
| `rag_db_drive` | ChromaDB hangi sürücüde | Disk doluluk uyarısı |
| `rag_db_size_mb` | ChromaDB boyutu (MB) | Veritabanı şişmesi takibi |
| `rag_db_drive_free_gb` | Sürücüdeki boş alan | Disk dolu hatası öncesi uyarı |
| `rag_db_drive_usage_pct` | Sürücü doluluk yüzdesi | %90 üstü ise admin uyarısı |
| `active_llm_model` | Kullanılan LLM modeli | Herkes doğru modelde mi kontrolü |

### ❌ Elenen / Gereksiz Bulunan Veriler

| Veri | Neden Elendi? |
|:-----|:--------------|
| IP Adresi | Gizlilik ihlali, admin için gereksiz |
| Sorulan soruların içeriği | Akademik gizlilik, çok büyük veri |
| PDF dosya isimleri | Araştırma mahremiyeti |
| Şifre hash'i | Güvenlik riski, GitHub'a koymak tehlikeli |
| GPU bilgisi | Yerel model kullanılmıyor, gereksiz |
| Anlık CPU/RAM kullanımı | Snapshot değeri, sürekli değişir, anlamsız |
