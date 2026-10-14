# Teknoloji Bağlamı

## Backend Stack
| Kütüphane | Kullanım | Not |
|-----------|----------|------|
| Python 3.13 | Ana diller | - |
| FastAPI | REST API server | Otomatik dokümantasyon, validation |
| LangChain (langchain-huggingface) | Orchestration | Vektör zنجارları, LLM zincirleri |
| Pydantic | Schema validation | Girdi doğrulama |
| PyMuPDF (fitz) | PDF parsing | Metin çıkarma, sayfa okuma |

## Frontend Stack
| Kütüphane | Sürüm | Rol |
|-----------|-------|-----|
| React 19 | Latest | UI framework |
| Vite 8 | Dev server | Hızlı geliştirme ortamı |
| TypeScript | - | Typed JavaScript |
| Jodit Editor | - | Word workspace, makale düzenleme |
| Lucide React | - | İkon kütüphanesi |
| Swiper | - | Slider/çeşitli görseller |

## Yapay Zeka Layerları (Agentic Routing)
| Katiagory | Model | Kullanım Alanı | Neden |
|-----------|-------|------------------|--------|
| Hızlı PDF Analizi | gemini-3.1-flash-lite | Künye analizi, hızlı tasnif | ucuz & hızlı (250M token/1000 TL) |
| Ana RAG Motoru | gemini-3.8-flash | Sohbet, RAG, makale taslağı | Yüksek bağlam penceresi (gelişmiş sentez) |
| Derin Zekâ Layerı | DeepSeek-R1 | Formül açıklama, sentez | Chain-of-thought, mantık zinciri |

## Veri Saklama & Vektör
| Tip | Teknoloji | Konum/Gözlem |
|-----|-----------|---------------|
| Vektör DB | ChromaDB | Yerel: `veri/chroma_db` |
| Embedding Model | all-MiniLM-L6-v2 | HuggingFace, hafif, hızlı (10M model) |

## Paketleme & Dağıtım (Planlanan)
- Electron (masaüstü .exe uygulama)
- Docker + docker-compose (taşınabilir deploy)

## Yapılandırma / Path'ler
| Konum | Kullanım |
|--------|----------|
| `requirements.txt` | Python bağımlılıkları |
| `npm install` | Frontend node_modules kurulumu |
| `.env` | API anahtarları (gizli) |

## Port & Sunucular
- Backend: `port 8000` (Uvicorn/FastAPI)
- Frontend: `port 5173` (Vite dev server)
- ChromaDB vektör veritabanı: `veri/chroma_db`

