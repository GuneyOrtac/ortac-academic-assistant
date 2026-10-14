# Kod Geliştirme Workflow

1. Mevcut kodu oku ve anla.
2. Değişikliği yap.
3. Testleri çalıştır: `.\.venv\Scripts\python.exe -m pytest`
4. Testler başarısızsa düzelt, tekrar çalıştır.
5. `memory-bank/activeContext.md` dosyasını güncelle.
6. Kısa rapor ver: yapılan iş, değişen dosyalar, sonraki adım.

**Not:** Backend/frontend sunucuları kapalıyken API testleri başarısız olabilir. Bu normaldir. Sadece birim testleri (model, rag, library) çalıştırın.