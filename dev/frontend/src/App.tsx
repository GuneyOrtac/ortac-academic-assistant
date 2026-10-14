import { useState, useRef, useEffect, useMemo } from 'react';
import JoditEditor from 'jodit-react';
import { Home, MessageSquare, BookOpen, Search, FileText, Settings, Database, Upload, Send, Loader2, Link as LinkIcon, Radar, ExternalLink, Download, EyeOff, RefreshCw, Plus } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import SettingsTab from './SettingsTab';
import SetupWizard from './SetupWizard';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  sources?: string[];
}

interface Article {
  id: string;
  title: string;
  doi: string;
  publication_year: number;
  authors: string[];
  open_access_url: string;
}

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [appUpdateInfo, setAppUpdateInfo] = useState<any>(null);
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Merhaba Güney. Bir araştırma konusu yazabilir, mekânsal bir analiz talep edebilir veya doğrudan literatürle ilgili bir soru sorabilirsiniz.",
      sender: "ai"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Library State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [libraryItems, setLibraryItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPdfIds, setSelectedPdfIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Home Dashboard State
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [mcpStatus, setMcpStatus] = useState<{servers: string[], tools_available: any[]}>({ servers: [], tools_available: [] });
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

  // Radar State
  const [radarQuery, setRadarQuery] = useState("artificial intelligence in disaster management");
  const [isRadarLoading, setIsRadarLoading] = useState(false);
  const [radarResults, setRadarResults] = useState<any[]>([]);
  const [downloadingMap, setDownloadingMap] = useState<{[key: string]: number}>({});
  const [radarPage, setRadarPage] = useState(1);
  const [hiddenRadarIds, setHiddenRadarIds] = useState<string[]>([]);
  const [addedRadarIds, setAddedRadarIds] = useState<string[]>([]);

  // Draft State
  const [draftContent, setDraftContent] = useState('');
  const [isDraftLoading] = useState(false);
  const [draftTopic, setDraftTopic] = useState('');
  
  const joditConfig = useMemo(() => ({
    readonly: false,
    placeholder: 'Taslak veya araştırmanızı buraya yazın...',
    height: 'auto',
    minHeight: '1000px',
    toolbarSticky: true,
    theme: 'default',
    buttons: [
      'source', '|',
      'bold', 'strikethrough', 'underline', 'italic', '|',
      'ul', 'ol', '|',
      'outdent', 'indent',  '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'video', 'table', 'link', '|',
      'align', 'undo', 'redo', '|',
      'hr', 'eraser', 'copyformat', '|',
      'symbol', 'fullsize', 'print', 'about'
    ],
    style: {
      background: 'white',
      color: '#111827'
    }
  }), []);

  const API_URL = "http://localhost:8000";

  // Fetch Dashboard Data
  const fetchLibraryData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/kutuphane`);
      if (res.ok) {
        const data = await res.json();
        setLibraryItems(data);
      }
    } catch (e) {
      console.error("Library fetch error:", e);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const mcpRes = await fetch(`${API_URL}/api/mcp-araclar`);
        if (mcpRes.ok) {
          const mcpData = await mcpRes.json();
          setMcpStatus(mcpData);
        }
        
        const oaRes = await fetch(`${API_URL}/api/literatur-tara`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sorgu: "artificial intelligence in disaster management", limit: 3, sort_by: "date", min_year: 2026 })
        });
        if (oaRes.ok) {
          const oaData = await oaRes.json();
          setRecentArticles(oaData.sonuclar || []);
        }
      } catch (error) {
        console.error("Dashboard data load error:", error);
      } finally {
        setIsDashboardLoading(false);
      }
    };
    
    const checkSetupStatus = async () => {
      try {
        const sRes = await fetch(`${API_URL}/api/sistem-bilgisi`);
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData.onboarding_tamamlandi === false) {
            setShowSetupWizard(true);
          }
        }
      } catch (err) {
        console.error("Kurulum durumu alınamadı:", err);
      } finally {
        setIsCheckingSetup(false);
      }
    };

    const checkGitHubUpdate = async () => {
      try {
        const uRes = await fetch(`${API_URL}/api/guncelleme-kontrol`);
        if (uRes.ok) {
          const uData = await uRes.json();
          setAppUpdateInfo(uData);
        }
      } catch (e) {
        console.error("Güncelleme kontrolü yapılamadı:", e);
      }
    };

    checkSetupStatus();
    checkGitHubUpdate();
    fetchDashboardData();
    fetchLibraryData();
    handleRadarSearch(radarQuery);
  }, []);

  const handleRadarSearch = async (query: string = radarQuery, page: number = 1, append: boolean = false) => {
    if (!query.trim()) return;
    setIsRadarLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/literatur-tara`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sorgu: query, limit: 10, page: page })
      });
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setRadarResults(prev => [...prev, ...(data.sonuclar || [])]);
        } else {
          setRadarResults(data.sonuclar || []);
        }
        setRadarPage(page);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRadarLoading(false);
    }
  };

  const handleHideSeen = () => {
    const visibleIds = radarResults.map(r => r.id);
    setHiddenRadarIds(prev => [...prev, ...visibleIds]);
    // Görünenleri gizleyince otomatik olarak bir sonraki sayfayı ekle
    handleRadarSearch(radarQuery, radarPage + 1, true);
  };

  const handleResetHidden = () => {
    setHiddenRadarIds([]);
  };

  const visibleRadarResults = radarResults.filter(art => !hiddenRadarIds.includes(art.id));

  const handleDownloadPdf = async (url: string, title: string, id: string) => {
    setDownloadingMap(prev => ({...prev, [id]: 10}));
    
    // Rastgele dolan animasyon simülasyonu
    const progressInterval = setInterval(() => {
      setDownloadingMap(prev => {
        const current = prev[id] || 10;
        return {...prev, [id]: Math.min(current + (Math.random() * 15), 90)};
      });
    }, 600);

    try {
      const res = await fetch(`${API_URL}/api/pdf-indir-ve-ekle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title })
      });
      clearInterval(progressInterval);
      if (res.ok) {
        setDownloadingMap(prev => ({...prev, [id]: 100})); // Tamamlandı görseli
        fetchLibraryData();
        setAddedRadarIds(prev => [...prev, id]); // Kalıcı olarak eklendiğini işaretle
        // 2 saniye sonra butonu normal haline döndür
        setTimeout(() => {
          setDownloadingMap(prev => {
            const next = {...prev};
            delete next[id];
            return next;
          });
        }, 2000);
      } else {
        setDownloadingMap(prev => { const next = {...prev}; delete next[id]; return next; });
        window.open(url, '_blank');
      }
    } catch (e) {
      clearInterval(progressInterval);
      setDownloadingMap(prev => { const next = {...prev}; delete next[id]; return next; });
      window.open(url, '_blank');
    }
  };

  // Sohbet İşlemi
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const newUserMsg: Message = { id: Date.now(), text: inputText, sender: 'user' };
    setMessages(prev => [...prev, newUserMsg]);
    setInputText("");
    setIsChatLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/sohbet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          soru: newUserMsg.text, 
          secili_pdfler: selectedPdfIds,
          aktif_sekme: activeTab,
          draft_icerik: draftContent
        })
      });
      
      const data = await response.json();
      let sourceInfo = undefined;
      if (data.kullanilan_kaynaklar && data.kullanilan_kaynaklar.length > 0) {
        sourceInfo = data.kullanilan_kaynaklar.map((k: any) => `${k.yazar} (${k.yil})`);
      }
      
      let finalYanit = data.yanit || "Yanıt alınamadı.";
      const updateMatch = finalYanit.match(/<EDITOR_UPDATE>([\s\S]*?)<\/EDITOR_UPDATE>/i);
      
      if (updateMatch) {
        const newContent = updateMatch[1];
        setDraftContent(newContent);
        finalYanit = finalYanit.replace(/<EDITOR_UPDATE>[\s\S]*?<\/EDITOR_UPDATE>/i, "").trim();
        if (!finalYanit) {
           finalYanit = "Makale taslağınız güncellendi.";
        }
      }
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: finalYanit,
        sender: 'ai',
        sources: sourceInfo
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "Hata: Sunucuya ulaşılamadı.",
        sender: 'ai'
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Dosya Yükleme İşlemi
  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadResult(null);
    
    const formData = new FormData();
    formData.append("file", selectedFile);
    
    try {
      const response = await fetch(`${API_URL}/api/pdf-yukle`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setUploadResult({ success: response.ok, data });
      
      if (response.ok) {
        fetchLibraryData(); // Listeyi güncelle
        // 4 saniye sonra mesajı ve dosyayı temizle
        setTimeout(() => {
          setUploadResult(null);
          setSelectedFile(null);
        }, 4000);
      }
    } catch (error) {
      setUploadResult({ success: false, data: { detail: "Yükleme hatası." } });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteLibraryItem = async (fileId: string) => {
    if (!window.confirm("Bu makaleyi kütüphaneden silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`${API_URL}/api/kutuphane/${fileId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLibraryData();
      } else {
        alert("Silme başarısız.");
      }
    } catch (e) {
      console.error(e);
      alert("Hata oluştu.");
    }
  };

  if (isCheckingSetup) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        background: '#09090b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        color: '#a1a1aa',
        fontFamily: "'Inter', sans-serif"
      }}>
        <Loader2 size={36} className="animate-spin text-blue-500" />
        <span style={{ fontSize: '14px' }}>Sistem başlatılıyor...</span>
      </div>
    );
  }

  if (showSetupWizard) {
    return (
      <SetupWizard 
        onComplete={() => {
          setShowSetupWizard(false);
          fetchLibraryData();
        }} 
      />
    );
  }

  return (
    <div className="app-layout">
      {/* 1. Sol Menü (Sabit) */}
      <div className="sidebar">
        <div className="sidebar-header">
          <img src="/logo.png" alt="Logo" style={{height: '55px', width: 'auto'}} />
          <span>Akademik Asistan</span>
        </div>
        
        <div className="nav-menu">
          <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <Home size={16} /> Ana Sayfa
          </div>
          <div className={`nav-item ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')}>
            <BookOpen size={16} /> Kütüphane
          </div>
          <div className={`nav-item ${activeTab === 'radar' ? 'active' : ''}`} onClick={() => setActiveTab('radar')}>
            <Radar size={16} /> Literatür Radarı
          </div>
          <div className={`nav-item ${activeTab === 'draft' ? 'active' : ''}`} onClick={() => setActiveTab('draft')}>
            <FileText size={16} /> Makale Taslağı
          </div>
          
          <div className={`nav-item settings-mt ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={16} /> Ayarlar
          </div>
        </div>
        
        <div className="sidebar-footer">
          <span className="footer-text">Versiyon 2.2.6</span>
          <span className="footer-name">Dr. Güney ORTAÇ</span>
          <span className="footer-text">© Tüm Hakları Saklıdır</span>
        </div>
      </div>

      {/* 2. Orta Ekran (Dinamik Alan) */}
      <div className="main-area">
        <div className="topbar">
          <div>
            {activeTab === 'home' && "Ana Sayfa / Dashboard"}
            {activeTab === 'library' && "Belge Yöneticisi"}
            {activeTab === 'radar' && "Açık Erişim Literatür Taraması"}
            {activeTab === 'draft' && "OpenDraft Makale Motoru"}
            {activeTab === 'settings' && "Ayarlar"}
          </div>
          <div style={{fontSize: '12px', display: 'flex', gap: '12px', alignItems:'center'}}>
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ height: '7px', width: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Sistem: Aktif
            </span>
            {appUpdateInfo && appUpdateInfo.guncel_mi === false ? (
              <span 
                onClick={() => setActiveTab('settings')}
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid #3b82f6',
                  color: '#60a5fa',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                🚀 Yeni Güncelleme: v{appUpdateInfo.son_surum}
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                v2.2.6 (Güncel ✓)
              </span>
            )}
          </div>
        </div>

        {activeTab === 'home' && (
          <div className="content-container" style={{maxWidth: '1200px'}}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
              
              {/* Sol Sütun: Slider ve Literatür */}
              <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0, width: '100%'}}>
                
                {/* Ana Sayfa Görsel Slider */}
                <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', height: '320px', position: 'relative', width: '100%' }}>
                  <Swiper
                    modules={[Autoplay, Pagination, Navigation]}
                    spaceBetween={0}
                    slidesPerView={1}
                    navigation={true}
                    loop={true}
                    autoplay={{ delay: 5000, disableOnInteraction: false }}
                    pagination={{ clickable: true }}
                    className="mySwiper"
                  >
                    <SwiperSlide>
                      <div className="slider-item">
                        <img src="/slider_1.jpg" alt="RAG Teknolojisi" />
                        <div className="slider-overlay">
                          <div className="slider-content-box">
                            <span className="slider-badge">YENİ ÖZELLİK</span>
                            <h2 className="slider-title">RAG Teknolojisi Entegrasyonu!</h2>
                            <p className="slider-desc">Kendi belgelerinizle konuşun. Gelişmiş yapay zeka altyapısı ile makalelerinizi saniyeler içinde analiz edin, literatürünüze tam hakim olun.</p>
                            <button className="slider-btn">Kütüphaneyi Keşfet <span style={{marginLeft:'4px'}}>→</span></button>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                    <SwiperSlide>
                      <div className="slider-item">
                        <img src="/slider_2.jpg" alt="Açık Erişim Analizi" />
                        <div className="slider-overlay">
                          <div className="slider-content-box">
                            <span className="slider-badge" style={{backgroundColor: '#10b981'}}>GÜNCELLEME</span>
                            <h2 className="slider-title">Açık Erişim Literatür Radarı!</h2>
                            <p className="slider-desc">OpenAlex entegrasyonu ile milyonlarca açık erişim makaleyi anında tarayın, PDF'leri tek tıkla doğrudan sisteminize indirin.</p>
                            <button className="slider-btn">Aramaya Başla <span style={{marginLeft:'4px'}}>→</span></button>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                    <SwiperSlide>
                      <div className="slider-item">
                        <img src="/slider_3.jpg" alt="Yapay Zeka Makale Taslağı" />
                        <div className="slider-overlay">
                          <div className="slider-content-box">
                            <span className="slider-badge" style={{backgroundColor: '#8b5cf6'}}>YAKINDA</span>
                            <h2 className="slider-title">OpenDraft AI Motoru!</h2>
                            <p className="slider-desc">Word formatında tam teşekküllü makale taslakları oluşturun. Referanslı, akademik ve biçimlendirilmiş çıktılar parmaklarınızın ucunda.</p>
                            <button className="slider-btn">Daha Fazla Bilgi <span style={{marginLeft:'4px'}}>→</span></button>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  </Swiper>
                </div>

                {/* Literatür Radarı Widget */}
                <div className="slider-section">
                  <div className="slider-header" style={{display:'flex', justifyContent:'space-between'}}>
                    <div>
                      <Database size={16} style={{display:'inline', marginRight:'8px', verticalAlign:'text-bottom'}} />
                      Son Keşifler
                    </div>
                    <button onClick={() => setActiveTab('radar')} style={{background:'none', border:'none', color:'var(--accent-color)', fontSize:'12px', cursor:'pointer', fontWeight:500}}>Tümünü Gör</button>
                  </div>
                  <div className="slider-content">
                    {isDashboardLoading ? (
                      <div style={{display:'flex', justifyContent:'center'}}><Loader2 className="animate-spin" /></div>
                    ) : recentArticles.length > 0 ? (
                      recentArticles.map(art => (
                        <div key={art.id} className="article-card" onClick={() => setActiveTab('radar')} style={{cursor:'pointer'}}>
                          <div className="article-title">{art.title}</div>
                          <div className="article-meta">{art.authors.join(', ')} • {art.publication_year}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{fontSize:'13px', color:'var(--text-muted)'}}>Güncel yayın bulunamadı.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sağ Sütun: İstatistikler ve MCP */}
              <div>
                
                {/* Birleştirilmiş Sistem İstatistikleri */}
                <div className="mcp-panel" style={{display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
                  <div>
                    <span className="stat-title" style={{display:'block', marginBottom:'0.25rem'}}>İndekslenen Belge</span>
                    <span className="stat-value" style={{fontSize:'18px'}}>3</span>
                  </div>
                  <div style={{height: '1px', background: 'var(--border-color)'}}></div>
                  <div>
                    <span className="stat-title" style={{display:'block', marginBottom:'0.25rem'}}>Bağlı Veritabanı</span>
                    <span className="stat-value" style={{fontSize:'18px'}}>ChromaDB</span>
                  </div>
                  <div style={{height: '1px', background: 'var(--border-color)'}}></div>
                  <div>
                    <span className="stat-title" style={{display:'block', marginBottom:'0.25rem'}}>Sistem Belleği</span>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <div className="status-dot"></div>
                      <span className="stat-value" style={{fontSize:'16px'}}>Normal</span>
                    </div>
                  </div>
                </div>

                <div className="mcp-panel">
                  <div className="mcp-title">
                    <LinkIcon size={16} />
                    MCP (CBS Araçları vb.)
                  </div>
                  {mcpStatus.servers.length > 0 ? (
                    <div style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
                      {mcpStatus.servers.map(s => (
                        <div key={s} className="mcp-item">
                          <div className="status-dot"></div>
                          {s} Sunucusu
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{fontSize:'12px', color:'var(--text-muted)'}}>
                      Aktif bir dış araç bağlı değil.
                    </div>
                  )}
                </div>
                
                <div className="mcp-panel" style={{backgroundColor: 'var(--bg-card)'}}>
                  <div className="mcp-title" style={{fontSize: '13px'}}>Hakkımızda</div>
                  <p style={{fontSize: '12px', color: 'var(--text-muted)'}}>
                    Akademik Asistan, RAG ve LLM teknolojilerini kullanarak literatür taramanızı ve yazım süreçlerinizi hızlandırır.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'radar' && (
          <div className="content-container" style={{maxWidth: '900px'}}>
            <div style={{marginBottom: '2rem'}}>
              <h2 style={{fontSize:'22px', fontWeight:600, display:'flex', alignItems:'center', gap:'0.5rem'}}>
                <Radar size={24} color="var(--accent-color)" /> Literatür Radarı
              </h2>
              <p style={{fontSize:'14px', color:'var(--text-muted)', marginTop:'0.5rem'}}>
                OpenAlex üzerinden milyonlarca akademik yayını tarayın. Küresel araştırmaları keşfedin ve açık erişimli olanları hemen indirin.
              </p>
            </div>

            {/* Arama Alanı */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', background:'var(--bg-sidebar)', padding:'1.5rem', borderRadius:'8px', border:'1px solid var(--border-color)'}}>
              <div style={{display: 'flex', gap: '1rem', width: '100%'}}>
                <div style={{flex: 1, display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)'}}>
                  <Search size={18} color="var(--text-muted)" />
                  <input 
                    type="text" 
                    placeholder="Konu, anahtar kelime veya yazar ara... (Örn: deep learning in healthcare)" 
                    style={{border: 'none', outline: 'none', background: 'transparent', fontSize: '15px', width: '100%'}}
                    value={radarQuery}
                    onChange={e => setRadarQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRadarSearch(radarQuery, 1, false)}
                  />
                </div>
                <button 
                  onClick={() => handleRadarSearch(radarQuery, 1, false)}
                  style={{
                    backgroundColor: 'var(--accent-color)', color: 'white',
                    padding: '0 1.5rem', borderRadius: '6px',
                    border: 'none', cursor: 'pointer', fontWeight: 600,
                    fontSize: '14px', transition: 'all 0.2s', display: 'flex', alignItems:'center', gap:'0.5rem'
                  }}
                  disabled={isRadarLoading}
                >
                  {isRadarLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  Gelişmiş Ara
                </button>
              </div>

              <div style={{display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem'}}>
                <button onClick={handleHideSeen} style={{fontSize: '13px', fontWeight: 500, padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-color)'}}>
                  <EyeOff size={14} />
                  Görünenleri Gizle ve Yeni Getir
                </button>
                {hiddenRadarIds.length > 0 && (
                  <button onClick={handleResetHidden} style={{fontSize: '13px', fontWeight: 500, padding: '8px 16px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fef2f2', color: '#b91c1c', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'}}>
                    <RefreshCw size={14} />
                    Geçmiş Yasaklamayı Sıfırla ({hiddenRadarIds.length})
                  </button>
                )}
              </div>
            </div>

            {/* Sonuç Listesi */}
            <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
              {isRadarLoading && radarPage === 1 ? (
                <div style={{display:'flex', justifyContent:'center', padding:'3rem'}}><Loader2 size={32} className="animate-spin" color="var(--accent-color)" /></div>
              ) : visibleRadarResults.length > 0 ? (
                <>
                {visibleRadarResults.map((art, idx) => {
                  const isAlreadyInLibrary = addedRadarIds.includes(art.id) || libraryItems.some(item => 
                    (item.meta?.baslik || "").toLowerCase().trim() === (art.title || "").toLowerCase().trim()
                  );
                  
                  return (
                  <div key={idx} style={{background:'var(--bg-sidebar)', border:'1px solid var(--border-color)', borderRadius:'8px', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem'}}>
                    <div>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                        <h3 style={{fontSize:'16px', fontWeight:600, color:'var(--text-color)', marginBottom:'0.5rem', lineHeight:'1.4'}}>{art.title}</h3>
                        {art.is_oa ? (
                          <span style={{background:'#e6f4ea', color:'#137333', fontSize:'11px', fontWeight:600, padding:'4px 8px', borderRadius:'12px', whiteSpace:'nowrap', marginLeft:'1rem'}}>Açık Erişim (PDF)</span>
                        ) : (
                          <span style={{background:'#f3f4f6', color:'#4b5563', fontSize:'11px', fontWeight:600, padding:'4px 8px', borderRadius:'12px', whiteSpace:'nowrap', marginLeft:'1rem'}}>Kapalı Kaynak</span>
                        )}
                      </div>
                      <div style={{fontSize:'13px', color:'var(--accent-color)', fontWeight:500, marginBottom:'0.25rem'}}>{art.authors.join(', ')}</div>
                      <div style={{fontSize:'12px', color:'var(--text-muted)'}}>Yıl: {art.publication_year} • Tür: {(art.type || "belirsiz").replace('-', ' ').toUpperCase()}</div>
                    </div>
                    
                    <div style={{display:'flex', gap:'1rem', marginTop:'0.5rem', borderTop:'1px solid var(--border-color)', paddingTop:'1rem'}}>
                      {art.is_oa && art.open_access_url ? (
                        isAlreadyInLibrary ? (
                          <div style={{display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'13px', fontWeight:500, color:'white', background:'#3b82f6', padding:'6px 12px', borderRadius:'6px'}}>
                            <Database size={14} /> Kütüphanede Mevcut
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleDownloadPdf(art.open_access_url, art.title, art.id)}
                            disabled={downloadingMap[art.id] !== undefined}
                            style={{
                              border:'none', 
                              cursor: downloadingMap[art.id] !== undefined ? 'default' : 'pointer', 
                              display:'flex', alignItems:'center', gap:'0.5rem', 
                              fontSize:'13px', fontWeight:500, color:'white', 
                              background: downloadingMap[art.id] !== undefined 
                                ? `linear-gradient(90deg, #10b981 ${downloadingMap[art.id]}%, #9ca3af ${downloadingMap[art.id]}%)` 
                                : '#10b981', 
                              padding:'6px 12px', borderRadius:'6px',
                              transition: 'background 0.3s ease'
                            }}
                          >
                            {downloadingMap[art.id] !== undefined ? (downloadingMap[art.id] >= 100 ? <Database size={14} /> : <Loader2 size={14} className="animate-spin" />) : <Download size={14} />} 
                            {downloadingMap[art.id] !== undefined ? (downloadingMap[art.id] >= 100 ? "Kütüphaneye Eklendi!" : "İndiriliyor & Okunuyor...") : "Kütüphaneye Ekle"}
                          </button>
                        )
                      ) : (
                        <div style={{fontSize:'12px', color:'var(--text-muted)', display:'flex', alignItems:'center'}}>
                          Bu yayının tam metni ücretli olabilir. Lütfen kurumunuzun (üniversitenizin) kütüphane erişimiyle DOI üzerinden indirmeyi deneyin.
                        </div>
                      )}
                      
                      {art.doi && (
                        <a href={art.doi} target="_blank" rel="noreferrer" style={{display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'13px', fontWeight:500, color:'var(--accent-color)', background:'var(--bg-hover)', padding:'6px 12px', borderRadius:'6px', textDecoration:'none'}}>
                          <ExternalLink size={14} /> DOI Sayfasına Git
                        </a>
                      )}
                    </div>
                  </div>
                )})}
                
                <div style={{display: 'flex', justifyContent: 'center', marginTop: '1rem'}}>
                  <button 
                    onClick={() => handleRadarSearch(radarQuery, radarPage + 1, true)}
                    style={{padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--accent-color)', transition: 'all 0.2s'}}
                    disabled={isRadarLoading}
                  >
                    {isRadarLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    Daha Fazla Sonuç Yükle (Sayfa {radarPage + 1})
                  </button>
                </div>
                </>
              ) : (
                <div style={{textAlign:'center', padding:'3rem', color:'var(--text-muted)', background:'var(--bg-sidebar)', borderRadius:'8px'}}>
                  <Radar size={48} opacity={0.2} style={{marginBottom:'1rem'}} />
                  <div>Aramanıza uygun yeni makale bulunamadı veya hepsi gizlendi.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="content-container" style={{maxWidth: '850px'}}>
            
            <div style={{marginBottom: '2rem'}}>
              <h2 style={{fontSize:'18px', fontWeight:600}}>Belge Yöneticisi</h2>
              <p style={{fontSize:'13px', color:'var(--text-muted)', marginTop:'0.25rem'}}>
                RAG Vektör veritabanına eklemek ve sohbet ekranında sorgulayabilmek için yerel PDF dosyalarınızı yükleyin.
              </p>
            </div>
            
            <input 
              type="file" 
              accept=".pdf" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={(e) => {
                if(e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]);
              }}
            />

            {selectedFile && (
              <div style={{marginTop: '1.5rem', background: 'var(--bg-card)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span style={{fontSize:'13px', fontWeight:500}}>{selectedFile.name}</span>
                <button className="btn-primary" onClick={handleFileUpload} disabled={isUploading}>
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                  {isUploading ? "Veritabanına İşleniyor..." : "İndeksle"}
                </button>
              </div>
            )}

            {uploadResult && (
              <div style={{ 
                marginTop: '1.5rem', 
                padding: '1rem', 
                borderRadius: '6px',
                backgroundColor: uploadResult.success ? '#e6f4ea' : '#fce8e6',
                color: uploadResult.success ? '#137333' : '#c5221f',
                border: `1px solid ${uploadResult.success ? '#ceead6' : '#fad2cf'}`,
                fontSize: '13px'
              }}>
                <strong>{uploadResult.success ? "İşlem Başarılı" : "Hata Oluştu"}</strong>
                <p style={{ marginTop: '0.5rem', fontSize: '13px' }}>
                  {uploadResult.success 
                    ? `Makaleniz başarıyla analiz edildi ve RAG veritabanına eklendi. (Toplam ${uploadResult.data?.vektor_chunk_sayisi || 0} bilgi parçası vektörleştirildi.)`
                    : (uploadResult.data?.detail || "PDF yüklenirken sistemsel bir hata oluştu.")}
                </p>
              </div>
            )}

            {/* Yüklü Dosyalar Listesi */}
            <div style={{marginTop: '2rem'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <h3 style={{fontSize:'16px', fontWeight:600}}>Kütüphanedeki Dosyalar ({libraryItems.length})</h3>
                <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                  <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--bg-card)', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)'}}>
                    <Search size={14} color="var(--text-muted)" />
                    <input 
                      type="text" 
                      placeholder="Başlık, yazar veya etiket ara..." 
                      style={{border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', width: '220px'}}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => fetchLibraryData()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      backgroundColor: 'var(--bg-sidebar)', color: 'var(--text-color)',
                      padding: '0.45rem 1rem', borderRadius: '6px',
                      border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 500,
                      fontSize: '13px', transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-sidebar)'}
                  >
                    <RefreshCw size={14} />
                    Yenile
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      backgroundColor: '#374151', color: 'white',
                      padding: '0.45rem 1rem', borderRadius: '6px',
                      border: 'none', cursor: 'pointer', fontWeight: 500,
                      fontSize: '13px', transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                  >
                    <Upload size={14} />
                    Yeni Makale Yükle
                  </button>
                </div>
              </div>
              
              {libraryItems.length > 0 ? (
                <div style={{border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden'}}>
                  <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left'}}>
                    <thead>
                      <tr style={{background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-color)'}}>
                        <th style={{padding: '12px 16px', fontWeight: 600, width: '40px'}}></th>
                        <th style={{padding: '12px 16px', fontWeight: 600}}>Makale Adı</th>
                        <th style={{padding: '12px 16px', fontWeight: 600, width: '100px'}}>Dil</th>
                        <th style={{padding: '12px 16px', fontWeight: 600, width: '80px'}}>Yıl</th>
                        <th style={{padding: '12px 16px', fontWeight: 600, width: '80px'}}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {libraryItems.filter(item => {
                        const qs = searchQuery.toLowerCase();
                        return (item.meta?.baslik || "").toLowerCase().includes(qs) || 
                               (item.meta?.yazar || "").toLowerCase().includes(qs) ||
                               (item.meta?.anahtar_kelimeler?.join(" ") || "").toLowerCase().includes(qs);
                      }).map((item) => (
                        <tr key={item.id} style={{borderBottom: '1px solid var(--border-color)', backgroundColor: selectedPdfIds.includes(item.dosya_adi) ? '#f0f7ff' : 'transparent'}}>
                          <td style={{padding: '12px 16px'}}>
                            <input 
                              type="checkbox" 
                              checked={selectedPdfIds.includes(item.dosya_adi)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedPdfIds(prev => [...prev, item.dosya_adi]);
                                else setSelectedPdfIds(prev => prev.filter(id => id !== item.dosya_adi));
                              }}
                              style={{cursor: 'pointer'}}
                            />
                          </td>
                          <td style={{padding: '12px 16px'}}>
                            <a href={`${API_URL}/api/pdf/${item.id}`} target="_blank" rel="noreferrer" style={{fontWeight: 500, color: 'var(--accent-color)', textDecoration: 'none'}}>
                              {item.meta?.baslik || item.dosya_adi}
                            </a>
                            <div style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px'}}>{item.meta?.yazar}</div>
                            {item.meta?.anahtar_kelimeler && (
                              <div style={{display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap'}}>
                                {item.meta.anahtar_kelimeler.slice(0,3).map((k: string) => (
                                  <span key={k} style={{background: 'var(--bg-hover)', color: 'var(--text-muted)', fontSize: '10px', padding: '2px 6px', borderRadius: '12px'}}>{k}</span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td style={{padding: '12px 16px', color: 'var(--text-muted)'}}>{item.meta?.dil || "-"}</td>
                          <td style={{padding: '12px 16px'}}>{item.meta?.yil}</td>
                          <td style={{padding: '12px 16px'}}>
                            <button 
                              onClick={() => handleDeleteLibraryItem(item.id)}
                              style={{background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '13px', padding: '4px 8px', borderRadius: '4px'}}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-sidebar)', borderRadius: '8px', fontSize: '13px'}}>
                  Henüz kütüphaneye bir makale yüklemediniz.
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'draft' && (
          <div className="content-container" style={{ minHeight: '100vh', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <style>{`
              .jodit-container {
                border: none !important;
                background: transparent !important;
              }
              .jodit-toolbar__box {
                background: white !important;
                border: 1px solid #e5e7eb !important;
                border-bottom: none !important;
                border-radius: 8px 8px 0 0 !important;
                margin-bottom: 0 !important;
                box-shadow: none !important;
                padding: 4px !important;
              }
              .jodit-workplace {
                background: transparent !important;
                overflow: visible !important;
              }
              .jodit-wysiwyg {
                background: white !important;
                min-height: 297mm !important;
                padding: 25.4mm !important;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                border: 1px solid #d1d5db !important;
                border-radius: 0 0 8px 8px !important;
              }
              .eksik-atif {
                background-color: #fef08a; /* Yellow */
              }
              .hide-highlights .eksik-atif {
                background-color: transparent !important;
              }
            `}</style>
            
            <div style={{ width: '100%', maxWidth: '210mm' }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <div>
                <h2 style={{fontSize:'20px', fontWeight:600, color: '#111827'}}>OpenDraft Makale Motoru</h2>
                <p style={{fontSize:'13px', color:'#6b7280'}}>A4 kağıdı görünümünde tam bağımsız akademik metin editörü.</p>
              </div>
              
              <div style={{display: 'flex', gap: '1rem'}}>
                <button 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    backgroundColor: 'white', color: '#374151',
                    padding: '0.5rem 1rem', borderRadius: '6px',
                    border: '1px solid #d1d5db', cursor: 'pointer', fontWeight: 500,
                    fontSize: '13px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  onClick={() => {
                    const el = document.querySelector('.jodit-wysiwyg');
                    if (el) el.classList.toggle('hide-highlights');
                  }}
                >
                  <EyeOff size={14} /> Vurguları Aç/Kapat
                </button>
                <button 
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    backgroundColor: 'var(--accent-color)', color: 'white',
                    padding: '0.5rem 1rem', borderRadius: '6px',
                    border: 'none', cursor: 'pointer', fontWeight: 500,
                    fontSize: '13px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-color)'}
                >
                  <Download size={14} /> Word Olarak İndir
                </button>
              </div>
            </div>

            <div style={{display: 'flex', gap: '1rem', marginBottom: '2rem'}}>
               <input 
                  type="text" 
                  placeholder="Üretilecek taslak için konu veya hipotez yazın..." 
                  style={{flex: 1, padding: '0.75rem 1rem', border: '1px solid #d1d5db', borderRadius: '6px', outline: 'none', fontSize: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'}}
                  value={draftTopic}
                  onChange={(e) => setDraftTopic(e.target.value)}
               />
               <button 
                  style={{
                    backgroundColor: '#10b981', color: 'white',
                    padding: '0 1.5rem', borderRadius: '6px',
                    border: 'none', cursor: 'pointer', fontWeight: 600,
                    fontSize: '14px', display: 'flex', alignItems:'center', gap:'0.5rem',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                  disabled={isDraftLoading || !draftTopic.trim()}
                  onClick={() => {/* will implement API call */}}
                >
                  {isDraftLoading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                  Yapay Zeka ile Üret
                </button>
            </div>
            
            <JoditEditor
              value={draftContent}
              config={joditConfig}
              onBlur={newContent => setDraftContent(newContent)}
            />
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <SettingsTab />
        )}
      </div>

      {/* 3. Sağ Bölüm (Sabit Sohbet Alanı) */}
      <div className="chat-section">
        <div className="chat-header">
          <MessageSquare size={16} />
          <span>Akıllı Yoldaş {selectedPdfIds.length > 0 && <span style={{fontSize:'11px', background:'var(--accent-color)', color:'white', padding:'2px 6px', borderRadius:'10px', marginLeft:'4px'}}>{selectedPdfIds.length} Makalede</span>}</span>
        </div>
        
        <div className="chat-history">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
              <div className="avatar">{msg.sender === 'ai' ? 'AA' : 'G'}</div>
              <div className="chat-text">
                {msg.text}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ marginTop: '0.75rem', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                    <strong>Kaynaklar: </strong> {msg.sources.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="chat-bubble ai">
              <div className="avatar">AA</div>
              <div className="chat-text" style={{display:'flex', alignItems:'center', gap:'8px'}}>
                <Loader2 size={14} className="animate-spin" /> 
                <span>Yanıtlanıyor...</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="chat-input-wrapper">
          <div className="chat-input-box">
            <input 
              type="text" 
              placeholder="Araştırma konunuzu yazın veya bir görev verin..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button 
              className={`btn-send ${inputText.trim() ? 'active' : ''}`} 
              onClick={handleSendMessage} 
              disabled={isChatLoading || !inputText.trim()}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default App;
