# Telemetri Şeması

Her kullanıcı için: telemetry/{lisans_id}.json

## Örnek Yapı
{
  "schema_version": "1.0",
  "license_id": "AKAD-9X2A-B78M-2026",
  "user_alias": "Güney A.",
  "app_version": "1.2.0",
  "last_heartbeat": "ISO8601 tarih",
  "session": { "session_start", "session_duration_min", "pdfs_uploaded_this_session", "questions_asked_this_session", "drafts_generated_this_session" },
  "lifetime": { "first_activation", "total_sessions", "total_usage_hours", "total_pdfs_uploaded", "total_pdfs_in_library", "total_questions_asked", "total_drafts_generated", "total_words_drafted" },
  "tokens": { "total_input_tokens", "total_output_tokens", "estimated_cost_usd", "estimated_cost_try", "budget_limit_try", "budget_remaining_pct", "tokens_by_task": { "analysis", "chat", "drafting" } },
  "system": { "os", "cpu", "ram_gb", "display_resolution", "rag_db_drive", "rag_db_size_mb", "rag_db_drive_free_gb", "rag_db_drive_usage_pct", "embedding_model", "active_llm_model" },
  "license": { "type", "issued_at", "expires_at", "status", "hwid" }
}

## Kritik Alanlar
- **license.hwid:** Bir lisans → tek PC (korsanlık önleme)
- **tokens.budget_remaining_pct:** Bakiyesi azalan kullanıcı tespiti
- **tokens.tokens_by_task:** Hangi modül en pahalı (optimizasyon hedefi)
- **system.rag_db_drive_usage_pct:** %90 üstü → admin uyarısı

## Elenen Veriler (Gizlilik)
- IP adresi (gizlilik ihlali)
- Soru içerikleri (akademik gizlilik)
- PDF dosya isimleri (araştırma mahremiyeti)
- Şifre hash'i (güvenlik riski)
- GPU bilgisi (yerel model kullanılmıyor)
- Anlık CPU/RAM (snapshot, anlamsız)

## Veri Akışı
Desktop App → GitHub API (açılışta) → telemetry/{lisans_id}.json
İnternet yoksa → SQLite'ta biriktir → bağlantıda toplu gönder
