# Token Tasarrufu Stratejileri

## 1. Top-K Filtresi (Semantik Arama)
- PDF'in tamamı LLM'e gönderilmez
- ChromaDB en alakalı 3-4 paragrafı bulur
- Binlerce token yerine yüzlerce token

## 2. PDF Çöp Filtresi (Boilerplate Removal)
Otomatik kesilen kısımlar:
- Kaynaklar (References) bölümü
- Dergi üst/alt bilgileri
- Yazar iletişim adresleri
**Kazanç:** RAG boyutunda %20-%30 düşüş

## 3. Agentic Model Routing
| Aşama | Model | Kullanım |
|:------|:------|:---------|
| 1 | Gemini 1.5 Flash | Angarya (tasnif, özet) |
| 2 | DeepSeek V4 Pro | RAG, çoklu makale |
| 3 | DeepSeek-R1 | Derin sentez, formül |

## 4. Context Caching
- Aynı PDF/prompt tekrar gönderilirse
- API sağlayıcı %90-%98 "Cache Hit" indirimi
- **Uygulama:** LiteLLM + Redis

## 5. Off-Peak İndirimi
- DeepSeek: 13:00-04:00 arası + hafta sonu %50 indirim
- **Uygulama:** Otonom planlama (ağır işleri ertele)

## 6. LiteLLM Caching Sistemi
- Tek satır kod ile tüm modellere cache
- ChromaDB'den yapılan RAG aramalarında anında %90 tasarruf
- Test kanıtlandı (kanıt: proje notlarında)
