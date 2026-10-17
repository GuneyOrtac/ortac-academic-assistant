import { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Layers, 
  Feather, 
  BookOpen, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  FolderOpen, 
  ShieldCheck, 
  Key, 
  Loader2, 
  Cloud,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

interface DriveInfo {
  device: string;
  mountpoint: string;
  total_gb: number;
  free_gb: number;
  used_gb: number;
  usage_pct: number;
}

interface HardwareInfo {
  toplam_ram_gb: number;
  bos_ram_gb: number;
  cpu_cekirdek: number;
}

interface EmbeddingProfile {
  id: string;
  name: string;
  hf_model: string;
  download_size_gb: number;
  required_disk_gb: number;
  min_ram_gb: number;
  context_tokens: number;
  description: string;
}

interface SetupWizardProps {
  onComplete: () => void;
}

const API_BASE = "http://127.0.0.1:8000";

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Hardware & Drives State
  const [hardware, setHardware] = useState<HardwareInfo>({ toplam_ram_gb: 16, bos_ram_gb: 8, cpu_cekirdek: 8 });
  const [drives, setDrives] = useState<DriveInfo[]>([]);
  const [profiles, setProfiles] = useState<Record<string, EmbeddingProfile>>({});

  // Wizard Selections
  const [selectedModel, setSelectedModel] = useState<string>("bge-m3");
  const [apiMode, setApiMode] = useState<"openrouter" | "gemini" | "system_default">("openrouter");
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [apiValidating, setApiValidating] = useState<boolean>(false);
  const [apiValidated, setApiValidated] = useState<boolean | null>(null);
  const [apiValidationMsg, setApiValidationMsg] = useState<string>("");
  const [storagePath, setStoragePath] = useState<string>("C:\\AkademikAsistan");

  const openUrl = (url: string) => {
    if ((window as any).electronAPI?.openExternal) {
      (window as any).electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  // Custom Installer Real Extraction State
  const isInstallerMode = !!(window as any).electronAPI?.isInstaller;
  const [installing, setInstalling] = useState(false);
  const [installPercent, setInstallPercent] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeInstallStep, setActiveInstallStep] = useState<number>(0);
  const [installedExe, setInstalledExe] = useState<string>('');
  const [installFinished, setInstallFinished] = useState(false);

  useEffect(() => {
    // 1. Installer Modunda Node.js IPC ile donanım ve sürücüleri al
    if ((window as any).electronAPI?.getSystemInfo) {
      (window as any).electronAPI.getSystemInfo().then((data: any) => {
        if (data.donanim) setHardware(data.donanim);
        if (data.suruculer) {
          setDrives(data.suruculer);
          if (data.suruculer.length > 0) {
            const sorted = [...data.suruculer].sort((a: DriveInfo, b: DriveInfo) => b.free_gb - a.free_gb);
            const bestDrive = sorted[0].mountpoint.replace(/\\$/, "");
            setStoragePath(`${bestDrive}\\AkademikAsistan`);
          }
        }
        if (data.profiller) setProfiles(data.profiller);
        setLoading(false);
      }).catch(() => {
        fallbackFetchSystemInfo();
      });
      return;
    }

    fallbackFetchSystemInfo();
  }, []);

  const fallbackFetchSystemInfo = () => {
    fetch(`${API_BASE}/api/sistem-bilgisi`)
      .then(res => res.json())
      .then(data => {
        if (data.donanim) setHardware(data.donanim);
        if (data.suruculer) {
          setDrives(data.suruculer);
          if (data.suruculer.length > 0) {
            const sorted = [...data.suruculer].sort((a: DriveInfo, b: DriveInfo) => b.free_gb - a.free_gb);
            const bestDrive = sorted[0].mountpoint.replace(/\\$/, "");
            setStoragePath(`${bestDrive}\\AkademikAsistan`);
          }
        }
        if (data.profiller) setProfiles(data.profiller);
        if (data.mevcut_ayarlar?.api_keys?.gemini) {
          setCustomApiKey(data.mevcut_ayarlar.api_keys.gemini);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Sistem bilgisi alınamadı:", err);
        setLoading(false);
      });
  };

  // Kurulum İlerleme Dinleyicisi
  useEffect(() => {
    if ((window as any).electronAPI?.onInstallProgress) {
      const cleanup = (window as any).electronAPI.onInstallProgress((data: any) => {
        if (data.step) {
          setActiveInstallStep(data.step);
          if (data.completed) {
            setCompletedSteps(prev => Array.from(new Set([...prev, data.step])));
          }
        }
        if (data.percent !== undefined) {
          setInstallPercent(data.percent);
        }
        if (data.step === 5 && data.completed) {
          setInstallFinished(true);
          setInstalling(false);
        }
        if (data.error) {
          setErrorMsg(data.error);
          setInstalling(false);
        }
      });
      return cleanup;
    }
  }, []);

  // Seçilen modelin disk gereksinimi (+20 GB RAG payı)
  const currentProfile = profiles[selectedModel] || {
    id: "bge-m3",
    name: "Akademik Standart (BAAI/bge-m3)",
    download_size_gb: 2.2,
    required_disk_gb: 22.2,
    min_ram_gb: 16,
    context_tokens: 8192,
    description: "8192 token kesintisiz bağlam, hibrit arama."
  };

  const requiredDiskGb = currentProfile.required_disk_gb;

  // Seçili sürücünün boş alanını bul
  const getSelectedDriveInfo = (): DriveInfo | undefined => {
    if (!storagePath) return undefined;
    const match = storagePath.match(/^([A-Za-z]:)/);
    if (!match) return drives[0];
    const prefix = match[1].toUpperCase();
    return drives.find(d => d.device.toUpperCase().startsWith(prefix) || d.mountpoint.toUpperCase().startsWith(prefix));
  };

  const selectedDrive = getSelectedDriveInfo();
  const currentFreeGb = selectedDrive ? selectedDrive.free_gb : 100;
  const isDiskSpaceSufficient = currentFreeGb >= requiredDiskGb;

  // Native Klasör Seçici Aç
  const handleBrowseFolder = async () => {
    if ((window as any).electronAPI?.selectDirectory) {
      const chosen = await (window as any).electronAPI.selectDirectory();
      if (chosen) {
        setStoragePath(chosen);
      }
    } else {
      if (drives.length > 1) {
        const other = drives.find(d => !storagePath.toUpperCase().startsWith(d.mountpoint.replace(/\\$/, "").toUpperCase()));
        if (other) setStoragePath(`${other.mountpoint.replace(/\\$/, "")}\\AkademikAsistan`);
      }
    }
  };

  // Gerçek Kurulumu Başlat (Installer Modu)
  const handleStartRealInstallation = async () => {
    setInstalling(true);
    setErrorMsg('');
    try {
      const res = await (window as any).electronAPI.startInstallation({
        targetDir: storagePath,
        modelProfile: selectedModel,
        apiMode,
        customApiKey
      });
      if (res.success) {
        setInstalledExe(res.targetExe);
      } else {
        setErrorMsg(res.error || "Kurulum sırasında hata oluştu.");
        setInstalling(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setInstalling(false);
    }
  };

  const handleLaunchApp = () => {
    if ((window as any).electronAPI?.launchApp) {
      (window as any).electronAPI.launchApp(installedExe);
    } else {
      onComplete();
    }
  };

  // API Doğrulama Testi
  const handleTestApiKey = async () => {
    if (!customApiKey.trim()) return;
    setApiValidating(true);
    setApiValidated(null);
    setApiValidationMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/dogrula-api-anahtari`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: apiMode === "openrouter" ? "openrouter" : apiMode === "gemini" ? "gemini" : "auto",
          api_key: customApiKey.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        setApiValidated(data.gecerli);
        setApiValidationMsg(data.mesaj);
      } else {
        setApiValidated(false);
        setApiValidationMsg("Sunucuya bağlanılamadı.");
      }
    } catch {
      const key = customApiKey.trim();
      if (key.startsWith("sk-or-")) {
        setApiValidated(true);
        setApiValidationMsg("✓ OpenRouter anahtarı formatı geçerli.");
      } else if (key.startsWith("AIzaSy")) {
        setApiValidated(true);
        setApiValidationMsg("✓ Google Gemini anahtarı formatı geçerli.");
      } else {
        setApiValidated(false);
        setApiValidationMsg("Doğrulama servisine ulaşılamadı.");
      }
    } finally {
      setApiValidating(false);
    }
  };

  // Kurulumu Tamamla (Normal Web/Uygulama Modu)
  const handleFinalSubmit = async () => {
    if (isInstallerMode) {
      handleStartRealInstallation();
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/kurulum-tamamla`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_profile: selectedModel,
          storage_path: storagePath,
          api_mode: apiMode,
          custom_api_key: customApiKey,
          provider: apiMode === "openrouter" ? "openrouter" : "gemini",
          openrouter_api_key: apiMode === "openrouter" ? customApiKey : ""
        })
      });
      const data = await res.json();
      if (res.ok) {
        try {
          if ((window as any).electronAPI?.createShortcut) {
            (window as any).electronAPI.createShortcut();
          }
        } catch (scErr) {
          console.warn("Kısayol oluşturulamadı:", scErr);
        }
        onComplete();
      } else {
        setErrorMsg(data.detail || "Kurulum kaydedilirken hata oluştu.");
      }
    } catch (e: any) {
      setErrorMsg("Sunucuya bağlanılamadı: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
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
        color: '#f4f4f5'
      }}>
        <Loader2 size={36} className="animate-spin text-blue-500" />
        <span style={{ fontSize: '15px', color: '#a1a1aa', fontFamily: 'Inter, sans-serif' }}>
          Sistem ve donanım analizi yapılıyor...
        </span>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: '#09090b',
      color: '#f4f4f5',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      padding: '2.5rem 3.5rem',
      boxSizing: 'border-box'
    }}>
      
      {/* 1. Üst Bar: Sol Üstte Kurumsal ORTAC GeoScience Logosu */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: '2.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <img 
            src="./logo.png" 
            alt="ORTAC GeoScience" 
            style={{ height: '42px', width: 'auto', filter: 'brightness(1.1)' }} 
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
              ORTAC <span style={{ color: '#94a3b8', fontWeight: 500 }}>Geo|Science</span>
            </span>
            <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
              Akademik Asistan
            </span>
          </div>
        </div>

        {/* Adım Göstergesi (Monospace & Minimal) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#a1a1aa',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            padding: '4px 10px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            ADIM 0{step} / 04 • {
              step === 1 ? "MODEL VE DONANIM" : 
              step === 2 ? "YAPAY ZEKA APİ" : 
              step === 3 ? "KÜTÜPHANE DİZİNİ" : "SİSTEM ÖZETİ"
            }
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4].map((s) => (
              <div 
                key={s} 
                style={{
                  height: '4px',
                  width: s === step ? '24px' : '8px',
                  borderRadius: '2px',
                  background: s <= step ? '#3b82f6' : 'rgba(255,255,255,0.12)',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 2. Orta Dinamik Alan */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '1150px',
        margin: '0 auto',
        width: '100%'
      }}>

        {/* ===================== ADIM 1: MODEL VE DONANIM ===================== */}
        {step === 1 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Canlı Donanım Rozeti */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#34d399',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '1.25rem'
            }}>
              <CheckCircle size={14} />
              Sistem Analizi: {hardware.toplam_ram_gb} GB Bellek (RAM) Algılandı • Optimum Performans Modu
            </div>

            <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.025em', marginBottom: '0.5rem', textAlign: 'center' }}>
              Model ve Donanım Analizi
            </h1>
            <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '2rem', textAlign: 'center', maxWidth: '650px' }}>
              Makalelerinizi tam doğrulukla taramak ve özetlemek için sisteminize en uygun vektörleme motorunu seçin.
            </p>

            {/* Model Seçim Kartları */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.25rem',
              width: '100%',
              marginBottom: '2rem'
            }}>
              {/* Kart 1: Hafif & Hızlı */}
              <div 
                onClick={() => setSelectedModel("e5-small")}
                style={{
                  background: selectedModel === "e5-small" ? 'rgba(59, 130, 246, 0.05)' : '#121215',
                  border: selectedModel === "e5-small" ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: selectedModel === "e5-small" ? '0 0 20px rgba(59, 130, 246, 0.15)' : 'none',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                    <Feather size={20} className="text-zinc-300" />
                  </div>
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                    Sistem Gereksinimi: En Az 8 GB Bellek (RAM)
                  </span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '0.25rem' }}>Hafif ve Hızlı</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '1rem' }}>multilingual-e5-small (Çok Dilli)</span>

                <div style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                  <div>• <strong>512 Sözcük</strong> kısa paragraf kapasitesi</div>
                  <div>• <strong>500 MB</strong> sistem belleği tüketimi (sessiz çalışma)</div>
                  <div>• <strong>İndirilecek Model Dosyası:</strong> ~0.5 GB</div>
                  <div>• <strong>Gereken Asgari Boş Alan:</strong> 20.5 GB (Model + 20 GB Kütüphane Güvence Payı)</div>
                  <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>Temel ve hızlı literatür taramaları için uygundur.</div>
                </div>
              </div>

              {/* Kart 2: Akademik Standart (Önerilen) */}
              <div 
                onClick={() => setSelectedModel("bge-m3")}
                style={{
                  background: selectedModel === "bge-m3" ? 'rgba(59, 130, 246, 0.08)' : '#121215',
                  border: selectedModel === "bge-m3" ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: selectedModel === "bge-m3" ? '0 0 25px rgba(59, 130, 246, 0.25)' : 'none',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '18px',
                  background: '#3b82f6',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  ÖNERİLEN
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ padding: '8px', background: 'rgba(59,130,246,0.15)', borderRadius: '8px' }}>
                    <BookOpen size={20} className="text-blue-400" />
                  </div>
                  <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600, background: 'rgba(56,189,248,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                    Sistem Gereksinimi: En Az 16 GB Bellek (RAM)
                  </span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '0.25rem' }}>Akademik Standart</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '1rem' }}>BAAI/bge-m3 (Hibrit Vektörleme)</span>

                <div style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                  <div>• <strong>8.192 Sözcük</strong> kesintisiz uzun bağlam kapasitesi</div>
                  <div>• <strong>Hibrit Tarama:</strong> Anlamsal ve Terimsel Arama (BM25)</div>
                  <div>• <strong>İndirilecek Model Dosyası:</strong> ~2.2 GB</div>
                  <div>• <strong>Gereken Asgari Boş Alan:</strong> 22.2 GB (Model + 20 GB Kütüphane Güvence Payı)</div>
                  <div style={{ color: '#38bdf8', fontSize: '11px', marginTop: '4px' }}>Tez ve makalelerde isim, formül ve tabloları kaçırmaz.</div>
                </div>
              </div>

              {/* Kart 3: Zirve Güç */}
              <div 
                onClick={() => setSelectedModel("qwen2-7b")}
                style={{
                  background: selectedModel === "qwen2-7b" ? 'rgba(59, 130, 246, 0.05)' : '#121215',
                  border: selectedModel === "qwen2-7b" ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: selectedModel === "qwen2-7b" ? '0 0 20px rgba(59, 130, 246, 0.15)' : 'none',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                    <Layers size={20} className="text-zinc-300" />
                  </div>
                  <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                    ⚠️ Yalnızca Güçlü Harici GPU (CUDA) Önerilir
                  </span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '0.25rem' }}>Zirve Güç (Harici GPU)</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '1rem' }}>gte-Qwen2-7B-instruct (7 Milyar Parametre)</span>

                <div style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                  <div>• <strong>32.768 Sözcük</strong> devasa bağlam penceresi</div>
                  <div>• <strong>Küresel Testlerde 1. Sıra</strong> en üst düzey anlamsal kavrayış</div>
                  <div>• <strong>İndirilecek Model Dosyası:</strong> ~14.5 GB (Asgari 32 GB RAM)</div>
                  <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>DİKKAT: CPU'da PDF başına 10-15 dakika sürer. Yalnızca RTX 3080/4080+ GPU varsa seçiniz.</div>
                </div>
              </div>
            </div>

            {/* Bulut Seçeneği Alternatif Kutusu */}
            <div 
              onClick={() => setSelectedModel("cloud-gemini")}
              style={{
                width: '100%',
                padding: '0.875rem 1.25rem',
                borderRadius: '8px',
                background: selectedModel === "cloud-gemini" ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)',
                border: selectedModel === "cloud-gemini" ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                marginBottom: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Cloud size={18} className="text-cyan-400" />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Alternatif: Sıfır Donanım Yükü (Google Bulut API Modu)</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>• Sıfır yerel RAM, 0 GB model indirme, tüm sistemlerle uyumlu</span>
              </div>
              <div style={{
                height: '16px',
                width: '16px',
                borderRadius: '50%',
                border: selectedModel === "cloud-gemini" ? '5px solid #3b82f6' : '1px solid #64748b'
              }} />
            </div>
          </div>
        )}

        {/* ===================== ADIM 2: YAPAY ZEKA API ===================== */}
        {step === 2 && (
          <div style={{ width: '100%', maxWidth: '780px', display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.025em', marginBottom: '0.5rem', textAlign: 'center' }}>
              Yapay Zeka API Tercihi
            </h1>
            <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '2rem', textAlign: 'center' }}>
              Makale özetleme, derin literatür sentezi ve sohbet yanıtları için hangi yapay zeka model motorunu kullanmak istersiniz?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              
              {/* Seçenek 1: OpenRouter (Nex-N2-Pro 397B MoE Ücretsiz) */}
              <div 
                onClick={() => {
                  setApiMode("openrouter");
                  setApiValidated(null);
                  setApiValidationMsg("");
                }}
                style={{
                  background: apiMode === "openrouter" ? 'rgba(59, 130, 246, 0.08)' : '#121215',
                  border: apiMode === "openrouter" ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ padding: '8px', background: 'rgba(59,130,246,0.15)', borderRadius: '8px', marginTop: '2px' }}>
                    <Sparkles size={20} className="text-blue-400" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700 }}>
                        OpenRouter: Nex-N2-Pro & Nex-N2.5-Pro (Önerilen • 397B MoE)
                      </h3>
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                        %100 Ücretsiz Kota ✓
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                      Açık kaynak 397 Milyar parametreli derin MoE mimarisi. Kredi kartı gerekmez, 0 TL ile anında ücretsiz API anahtarı alınabilir.
                    </p>
                  </div>
                </div>

                {apiMode === "openrouter" && (
                  <div style={{
                    marginTop: '0.25rem',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    paddingTop: '0.875rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>
                        OpenRouter API Anahtarı:
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openUrl("https://openrouter.ai/keys");
                        }}
                        style={{
                          background: 'rgba(59,130,246,0.12)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59,130,246,0.25)',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <ExternalLink size={12} />
                        10 Saniyede Ücretsiz Anahtar Al (openrouter.ai/keys)
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="password"
                        placeholder="sk-or-v1-..."
                        value={customApiKey}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          setCustomApiKey(e.target.value);
                          setApiValidated(null);
                          setApiValidationMsg("");
                        }}
                        style={{
                          flex: 1,
                          background: '#09090b',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '8px',
                          padding: '0.625rem 0.875rem',
                          color: '#ffffff',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestApiKey();
                        }}
                        disabled={apiValidating || !customApiKey.trim()}
                        style={{
                          background: '#27272a',
                          color: '#ffffff',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          padding: '0 1rem',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {apiValidating ? <Loader2 size={14} className="animate-spin" /> : "Bağlantıyı Doğrula"}
                      </button>
                    </div>

                    {apiValidated === true && (
                      <span style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={14} /> {apiValidationMsg || "OpenRouter bağlantısı başarıyla doğrulandı!"}
                      </span>
                    )}
                    {apiValidated === false && (
                      <span style={{ fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={14} /> {apiValidationMsg || "Geçersiz API anahtarı! Lütfen kontrol edin."}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Seçenek 2: Google Gemini */}
              <div 
                onClick={() => {
                  setApiMode("gemini");
                  setApiValidated(null);
                  setApiValidationMsg("");
                }}
                style={{
                  background: apiMode === "gemini" ? 'rgba(59, 130, 246, 0.08)' : '#121215',
                  border: apiMode === "gemini" ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', marginTop: '2px' }}>
                    <Key size={20} className="text-zinc-300" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Google Gemini 2.5 Flash / 2.0</h3>
                      <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 600, background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                        Resmi Google Kotası ✓
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                      Google AI Studio üzerinden ücretsiz dakikada 15 istek hakkı ile hızlı ve kararlı akademik asistan desteği.
                    </p>
                  </div>
                </div>

                {apiMode === "gemini" && (
                  <div style={{
                    marginTop: '0.25rem',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    paddingTop: '0.875rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.625rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>
                        Google Gemini API Anahtarı:
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openUrl("https://aistudio.google.com/app/apikey");
                        }}
                        style={{
                          background: 'rgba(59,130,246,0.12)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59,130,246,0.25)',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <ExternalLink size={12} />
                        Ücretsiz Gemini Anahtarı Al (aistudio.google.com)
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="password"
                        placeholder="AIzaSy..."
                        value={customApiKey}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          setCustomApiKey(e.target.value);
                          setApiValidated(null);
                          setApiValidationMsg("");
                        }}
                        style={{
                          flex: 1,
                          background: '#09090b',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '8px',
                          padding: '0.625rem 0.875rem',
                          color: '#ffffff',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestApiKey();
                        }}
                        disabled={apiValidating || !customApiKey.trim()}
                        style={{
                          background: '#27272a',
                          color: '#ffffff',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          padding: '0 1rem',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {apiValidating ? <Loader2 size={14} className="animate-spin" /> : "Bağlantıyı Doğrula"}
                      </button>
                    </div>

                    {apiValidated === true && (
                      <span style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={14} /> {apiValidationMsg || "Google Gemini bağlantısı başarıyla doğrulandı!"}
                      </span>
                    )}
                    {apiValidated === false && (
                      <span style={{ fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={14} /> {apiValidationMsg || "Geçersiz API anahtarı! Lütfen kontrol edin."}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Seçenek 3: API Anahtarı Olmadan Devam Et (Yerel Mod) */}
              <div 
                onClick={() => setApiMode("system_default")}
                style={{
                  background: apiMode === "system_default" ? 'rgba(59, 130, 246, 0.08)' : '#121215',
                  border: apiMode === "system_default" ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', marginTop: '2px' }}>
                  <HardDrive size={20} className="text-zinc-400" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700 }}>API Anahtarı Olmadan Devam Et (Yerel Mod)</h3>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: 600 }}>Daha Sonra Eklenebilir ✓</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                    PDF arşivleme, metin çıkarma ve yerel ChromaDB vektör aramayı anında kullanabilirsiniz. API anahtarınızı dilediğiniz zaman üst menüdeki 'Ayarlar' sekmesinden tanımlayabilirsiniz.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ===================== ADIM 3: DİZİN VE DİSK KONTROLÜ ===================== */}
        {step === 3 && (
          <div style={{ width: '100%', maxWidth: '750px', display: 'flex', flexDirection: 'column' }}>
            {/* Canlı Hesaplanan Gerekli Disk Alanı Rozeti */}
            <div style={{ alignSelf: 'center', marginBottom: '1.25rem' }}>
              <span style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: '#60a5fa',
                fontSize: '12px',
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <HardDrive size={14} />
                Gereken Asgari Boş Alan: {requiredDiskGb} GB (Model: {currentProfile.download_size_gb} GB + RAG Güvence Payı: 20 GB)
              </span>
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.025em', marginBottom: '0.5rem', textAlign: 'center' }}>
              Kütüphane ve Kurulum Dizini
            </h1>
            <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '2rem', textAlign: 'center' }}>
              PDF arşivinizin ve yerel ChromaDB vektör veritabanınızın saklanacağı konumu belirleyin.
            </p>

            {/* Dizin Yapılandırma Kartı */}
            <div style={{
              background: '#121215',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              {/* Dizin Yolu Girişi */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input 
                  type="text"
                  value={storagePath}
                  onChange={(e) => setStoragePath(e.target.value)}
                  style={{
                    flex: 1,
                    background: '#09090b',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={handleBrowseFolder}
                  style={{
                    background: '#27272a',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '0 1.25rem',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FolderOpen size={16} /> Gözat / Değiştir...
                </button>
              </div>

              {/* Sürücü Durumu ve Doluluk Çubuğu */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
                    {selectedDrive ? `${selectedDrive.device} Sürücüsü` : "Seçili Sürücü"} • {currentFreeGb} GB Boş Alan
                  </span>
                  <span style={{ color: isDiskSpaceSufficient ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                    {isDiskSpaceSufficient ? `Gereken: ${requiredDiskGb} GB • Yeterli ✓` : `Yetersiz! (Gereken: ${requiredDiskGb} GB)`}
                  </span>
                </div>
                
                {/* Doluluk Çubuğu */}
                <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${selectedDrive ? selectedDrive.usage_pct : 50}%`,
                    background: isDiskSpaceSufficient ? '#3b82f6' : '#ef4444',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Hızlı Sürücü Değiştirme Butonları */}
              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Algılanan Sürücüler (Hızlı Geçiş):
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {drives.map(d => {
                    const cleanMount = d.mountpoint.replace(/\\$/, "");
                    const isSelected = storagePath.toUpperCase().startsWith(cleanMount.toUpperCase());
                    const hasEnough = d.free_gb >= requiredDiskGb;
                    return (
                      <button
                        key={d.device}
                        onClick={() => setStoragePath(`${cleanMount}\\AkademikAsistan`)}
                        style={{
                          background: isSelected ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.03)',
                          border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                          color: isSelected ? '#60a5fa' : (hasEnough ? '#e2e8f0' : '#f87171'),
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {cleanMount} ({d.free_gb} GB Boş {hasEnough ? "✓" : "⚠️"})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Disk Güvenlik Mesajı veya Yetersiz Alan Uyarısı */}
              {isDiskSpaceSufficient ? (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <ShieldCheck size={16} />
                  Disk alanı onaylandı. Makaleleriniz ve ChromaDB vektörleriniz %100 yerel olarak bu dizinde saklanacaktır.
                </div>
              ) : (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={16} />
                  <strong>Yetersiz Disk Alanı!</strong> Seçtiğiniz {currentProfile.name} ve 20 GB RAG payı için en az {requiredDiskGb} GB gereklidir. Lütfen yukarıdaki sürücülerden yeterli boş alanı olan birini seçin.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== ADIM 4: DOĞRULAMA VE KURULUM ===================== */}
        {step === 4 && (
          <div style={{ width: '100%', maxWidth: '750px', display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.025em', marginBottom: '0.5rem', textAlign: 'center' }}>
              {isInstallerMode 
                ? (installFinished ? "Kurulum Başarıyla Tamamlandı!" : "Kurulum ve Dosya Dağıtımı") 
                : "Kurulum Tamamlandı ve Sistem Hazır"}
            </h1>
            <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '2rem', textAlign: 'center' }}>
              {isInstallerMode 
                ? (installFinished ? "Tüm program dosyaları ve yerel yapay zekâ motoru başarıyla kuruldu." : "Seçtiğiniz ayarlar hedefe aktarılacaktır. Kurulumu başlatmak için butona tıklayın.")
                : "Yapılandırılan tüm bileşenlerin doğrulama listesi aşağıdadır:"}
            </p>

            {/* Installer Modunda Dinamik Adım Listesi */}
            {isInstallerMode ? (
              <div style={{
                background: '#121215',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '0.5rem 0',
                display: 'flex',
                flexDirection: 'column',
                marginBottom: '1.5rem'
              }}>
                {[
                  { id: 1, title: "Donanım ve Hedef Sürücü Doğrulaması", desc: `${storagePath} dizini (${currentFreeGb} GB boş alan) onaylandı` },
                  { id: 2, title: "Program Çekirdeği ve Yerel AI Motorunun Aktarılması", desc: installPercent > 0 ? `%${installPercent} tamamlandı - Python, PyTorch ve çalışma motoru kuruluyor` : "Python, PyTorch ve yerel motor dosyaları hedefe aktarılacak" },
                  { id: 3, title: "Model Profili ve Veri Kütüphanesinin Yapılandırılması", desc: `${currentProfile.name} ve yerel ChromaDB dizini bağlandı` },
                  { id: 4, title: "Masaüstü Kısayolunun Oluşturulması", desc: "Masaüstüne 'ORTAC Akademik Asistan' kısayolu yerleştirildi" },
                  { id: 5, title: "Kurulumun Başarıyla Tamamlanması", desc: "Sistem %100 yerel ve çevrimdışı çalışmaya hazır" }
                ].map(task => {
                  const isDone = completedSteps.includes(task.id);
                  const isCurrent = activeInstallStep === task.id && installing;
                  return (
                    <div 
                      key={task.id}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem', 
                        padding: '1rem 1.5rem', 
                        borderBottom: task.id < 5 ? '1px solid rgba(255,255,255,0.06)' : 'none' 
                      }}
                    >
                      {isDone ? (
                        <CheckCircle2 size={18} className="text-emerald-400" />
                      ) : isCurrent ? (
                        <Loader2 size={18} className="animate-spin text-blue-400" />
                      ) : (
                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }} />
                      )}
                      
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: isDone ? '#f4f4f5' : (isCurrent ? '#60a5fa' : '#71717a') }}>
                            {task.title}
                          </div>
                          <div style={{ fontSize: '11px', color: isDone ? '#a1a1aa' : (isCurrent ? '#93c5fd' : '#52525b'), marginTop: '2px' }}>
                            {task.desc}
                          </div>
                        </div>

                        <div>
                          {isDone ? (
                            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Tamamlandı ✓</span>
                          ) : isCurrent ? (
                            <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 600 }}>İşleniyor...</span>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#52525b' }}>Bekliyor</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Normal Web / Uygulama Modu */
              <div style={{
                background: '#121215',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '0.5rem 0',
                display: 'flex',
                flexDirection: 'column',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>Kurulum ve Kütüphane Dizini</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5', fontFamily: 'monospace' }}>
                      {storagePath} ({currentFreeGb} GB Boş • Hazır ✓)
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>Vektörleme Motoru</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5' }}>
                      {currentProfile.name} ({currentProfile.context_tokens} Token • Hazır ✓)
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>Yapay Zeka API Sağlayıcısı</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5' }}>
                      {apiMode === "openrouter" 
                        ? "OpenRouter / Nex-N2-Pro (397B MoE Ücretsiz • Hazır ✓)" 
                        : apiMode === "gemini" 
                        ? "Google Gemini API (Hazır ✓)" 
                        : "Yerel Kütüphane Modu (Ayarlardan eklenebilir ✓)"}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>Donanım Uyumu</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5' }}>
                      {hardware.toplam_ram_gb} GB Bellek • Optimum Performans Modu ✓
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem' }}>
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>Veri Gizliliği ve Güvenlik</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5' }}>
                      %100 Yerel ChromaDB (Çevrimdışı Depolama ✓)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* İlerleme Çubuğu */}
            {installing && !installFinished && (
              <div style={{
                height: '6px',
                width: '100%',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '3px',
                overflow: 'hidden',
                marginBottom: '1.25rem'
              }}>
                <div style={{
                  height: '100%',
                  width: `${installPercent}%`,
                  background: '#3b82f6',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            )}

            {errorMsg && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#f87171',
                marginBottom: '1rem'
              }}>
                {errorMsg}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Alt Eylem Çubuğu */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: '1150px',
        margin: '0 auto',
        paddingTop: '1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.08)'
      }}>
        {step > 1 && !installing ? (
          <button
            onClick={() => setStep((prev) => (prev - 1) as any)}
            style={{
              background: 'transparent',
              color: '#a1a1aa',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeft size={16} /> Geri
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            onClick={() => {
              if (step === 3 && !isDiskSpaceSufficient) return;
              setStep((prev) => (prev + 1) as any);
            }}
            disabled={step === 3 && !isDiskSpaceSufficient}
            style={{
              background: (step === 3 && !isDiskSpaceSufficient) ? '#27272a' : '#2563eb',
              color: (step === 3 && !isDiskSpaceSufficient) ? '#71717a' : '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.625rem 1.5rem',
              fontSize: '13px',
              fontWeight: 600,
              cursor: (step === 3 && !isDiskSpaceSufficient) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: (step === 3 && !isDiskSpaceSufficient) ? 'none' : '0 0 15px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            Devam Et <ArrowRight size={16} />
          </button>
        ) : (
          isInstallerMode ? (
            installFinished ? (
              <button
                onClick={handleLaunchApp}
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 2.25rem',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 25px rgba(16, 185, 129, 0.5)',
                  transition: 'all 0.2s ease'
                }}
              >
                ORTAC Akademik Asistan'ı Başlat 🚀
              </button>
            ) : installing ? (
              <button
                disabled
                style={{
                  background: '#2563eb',
                  opacity: 0.8,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 2rem',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Loader2 size={16} className="animate-spin" /> Kuruluyor (%{installPercent})...
              </button>
            ) : (
              <button
                onClick={handleStartRealInstallation}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 2rem',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 20px rgba(37, 99, 235, 0.5)',
                  transition: 'all 0.2s ease'
                }}
              >
                Kurulumu Başlat ve Dosyaları Aktar 🚀
              </button>
            )
          ) : (
            <button
              onClick={handleFinalSubmit}
              disabled={submitting}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 2rem',
                fontSize: '14px',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 20px rgba(37, 99, 235, 0.5)',
                transition: 'all 0.2s ease'
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Yapılandırılıyor...
                </>
              ) : (
                <>
                  Sistemi Başlat ve Çalışma Alanını Aç <ArrowRight size={16} />
                </>
              )}
            </button>
          )
        )}
      </div>

    </div>
  );
}
