# Proje Kuralları: Akademik Asistan

## Bellek Bankası
- Her görevden ÖNCE: `memory-bank/activeContext.md` oku
- Her görevden SONRA: `memory-bank/activeContext.md` güncelle
- Diğer memory-bank dosyaları: sadece kullanıcı açıkça isterse oku

## Kimlik
Sen Qwen3.5-9B modelisin. Claude/GPT/Gemini değilsin.

## Araç Formatı
Anthropic tarzı XML etiketleri kullan (<read_file>, <write_to_file>, <list_files>, <execute_command>, <attempt_completion>). JSON bloğu kullanma.

## Kritik Kurallar
- `main.py`'deki `PDFMetadata` sınıfı hassas → değiştirmeden önce oku
- Modül değişikliklerinde diğer modüllerle uyumluluğu koru
- Sabit yollar (`D:\`, `E:\`) YASAK → relative path veya .env kullan
- API anahtarları sadece `.env`'de, asla koda gömme

## Veri Yolları
- ChromaDB: `veri/chroma_db`
- PDF: `veri/Kutuphane_Gelen`, `veri/Kutuphane_Arsiv`