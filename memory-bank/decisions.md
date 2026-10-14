# Mimari Kararlar Defteri

Bu dosya, projede alınan kritik kararları ve arkasındaki mantığı saklar.
Her yeni karar en üste eklenir (yeni → eski).

---

## Karar: Yerel Model → Bulut API Geçişi (Eylül 2026)
**Karar:** Yerel Qwen modelleri terk edildi, Gemini ve DeepSeek API'lerine geçildi.
**Gerekçe:** Donanım yorgunluğu, fan sesi, sınırlı zeka. 1000 TL bütçe ile aylarca hizmet.
**Sonuç:** Ana motor: gemini-3.8-flash, PDF analizi: gemini-3.1-flash-lite.

---

## Karar: 3 Katmanlı Agentic Model Yönlendirmesi
**Karar:** Tek LLM yerine işleme göre 3 farklı model kullanılacak.
**Katmanlar:**
1. **Gemini 1.5 Flash** → PDF tasnif, özet (hızlı, 250M token/1000 TL)
2. **DeepSeek V4 Pro** → RAG, çoklu makale analizi (1M bağlam)
3. **DeepSeek-R1** → Derin sentez, formül açıklama (chain-of-thought)
**Gerekçe:** Maliyet optimizasyonu + hız + zeka dengesi.

---

## Karar: Arayüz Mimarisi (MVP)
**Karar:** Önce terminal MVP, sonra Electron masaüstü .exe.
**Gerekçe:** Mimari dağıtım zorluğuna girmeden çekirdeği test etmek.
**Sonuç:** Python FastAPI + React 19 (Vite 8) + Electron.

---

## Karar: Admin Dashboard → GitHub-Merkezli
**Karar:** Firebase/Supabase/Vercel yerine GitHub Private Repo kullanılacak.
**Gerekçe:** Ek servis maliyeti yok, sıfır kurulum, tek platform.
**Veri Akışı:** Desktop App → GitHub API → telemetry/{lisans_id}.json
**Admin Panel:** Ayrı .exe, GitHub API üzerinden okur, dashboard/lisans üretici.

---

## Karar: .akpack ile Sıfır Maliyetli Senkronizasyon
**Karar:** Bulut depolama yerine taşınabilir .akpack paketi.
**İçerik:** PDF + künye + ChromaDB vektörleri (tek arşivde)
**Gerekçe:** İkinci kullanıcı hiç token harcamadan hazır indeks kullanır.
**Paylaşım:** P2P (LAN) veya taşınabilir dosya.

---

## Karar: LiteLLM Caching ile %90 Tasarruf
**Karar:** LiteLLM kütüphanesi + Redis ile API cache sistemi kurulacak.
**Gerekçe:** Aynı PDF metni + aynı soru için ikinci kez API çağrısı yapılmaz.
**Ölçüm:** Testlerde cache sayesinde %90 tasarruf kanıtlandı.
