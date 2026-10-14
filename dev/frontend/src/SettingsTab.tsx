import { useState, useEffect } from 'react';
import { Save, Loader2, Key, Cpu, Plus, Trash2, HardDrive, RefreshCw, GitBranch, Download } from 'lucide-react';

interface ModelTaskConfig {
  label: string;
  provider: string;
  model: string;
}

interface SettingsData {
  api_keys: Record<string, string>;
  models: Record<string, ModelTaskConfig>;
}

const providers = ['gemini', 'openai', 'deepseek', 'perplexity', 'anthropic', 'groq', 'nvidia'];

const modelOptions: Record<string, string[]> = {
  gemini: ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner', 'deepseek-coder'],
  perplexity: ['llama-3.1-sonar-small-128k-chat', 'llama-3.1-sonar-large-128k-chat', 'llama-3.1-sonar-huge-128k-chat', 'llama-3.1-sonar-small-128k-online', 'llama-3.1-sonar-large-128k-online', 'llama-3.1-sonar-huge-128k-online'],
  anthropic: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-latest', 'claude-3-sonnet-20240229'],
  groq: ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'],
  nvidia: ['meta/llama-3.1-70b-instruct', 'meta/llama-3.1-405b-instruct', 'meta/llama-3.2-11b-vision-instruct', 'meta/llama-3.2-90b-vision-instruct', 'mistralai/mixtral-8x22b-instruct-v0.1']
};

export default function SettingsTab() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // GitHub Güncelleme State
  const [updateStatus, setUpdateStatus] = useState<any>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateMsg('');
    try {
      const res = await fetch('http://localhost:8000/api/guncelleme-kontrol');
      if (res.ok) {
        const data = await res.json();
        setUpdateStatus(data);
      }
    } catch {
      setUpdateMsg('GitHub sunucusuna bağlanılamadı.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleApplyUpdate = async () => {
    if (!window.confirm("GitHub'daki en son sürüm çekilerek sistem güncellenecektir. Onaylıyor musunuz?")) return;
    setUpdating(true);
    setUpdateMsg('');
    try {
      const res = await fetch('http://localhost:8000/api/guncelleme-uygula', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setUpdateMsg(data.mesaj || 'Güncelleme başarıyla tamamlandı!');
      } else {
        setUpdateMsg(data.detail || 'Güncelleme hatası.');
      }
    } catch (e: any) {
      setUpdateMsg('Bağlantı hatası: ' + e.message);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetch('http://localhost:8000/api/ayarlar')
      .then(res => res.json())
      .then(data => {
        // Migration if missing
        if (!data.api_keys.anthropic) data.api_keys.anthropic = "";
        if (!data.api_keys.groq) data.api_keys.groq = "";
        
        // Migrate chat_tr/chat_en to chat
        if (data.models.chat_tr || data.models.chat_en) {
            data.models.chat = data.models.chat_tr || data.models.chat_en;
            data.models.chat.label = "Genel Sohbet";
            delete data.models.chat_tr;
            delete data.models.chat_en;
        }

        // Ensure models have labels
        for (const [key, val] of Object.entries(data.models)) {
          if (!(val as any).label) {
             (val as any).label = key;
          }
        }
        setSettings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('http://localhost:8000/api/ayarlar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setMessage('Ayarlar başarıyla kaydedildi!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Kaydetme başarısız oldu.');
      }
    } catch (err) {
      setMessage('Bağlantı hatası.');
    }
    setSaving(false);
  };

  const handleApiKeyChange = (provider: string, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      api_keys: { ...settings.api_keys, [provider]: value }
    });
  };

  const handleModelChange = (taskKey: string, field: keyof ModelTaskConfig, value: string) => {
    if (!settings) return;
    
    // Auto-update model if provider changes to give a good default
    let updatedModel = settings.models[taskKey].model;
    if (field === 'provider' && modelOptions[value] && modelOptions[value].length > 0) {
        updatedModel = modelOptions[value][0];
    }
    
    setSettings({
      ...settings,
      models: {
        ...settings.models,
        [taskKey]: { 
            ...settings.models[taskKey], 
            [field]: value,
            ...(field === 'provider' ? { model: updatedModel } : {}) 
        }
      }
    });
  };

  const handleAddTask = () => {
    if (!settings) return;
    const taskKey = `custom_${Date.now()}`;
    setSettings({
      ...settings,
      models: {
        ...settings.models,
        [taskKey]: { label: 'Yeni Görev', provider: 'openai', model: 'gpt-4o-mini' }
      }
    });
  };

  const handleDeleteTask = (taskKey: string) => {
    if (!settings) return;
    const newModels = { ...settings.models };
    delete newModels[taskKey];
    setSettings({
      ...settings,
      models: newModels
    });
  };

  if (loading || !settings) return <div style={{padding:'20px'}}><Loader2 className="animate-spin" /> Yükleniyor...</div>;

  const renderModelConfig = (taskKey: string, config: ModelTaskConfig) => (
    <div key={taskKey} style={{ marginBottom: '15px', padding: '15px', backgroundColor: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)', position: 'relative' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <input 
            type="text" 
            value={config.label}
            onChange={(e) => handleModelChange(taskKey, 'label', e.target.value)}
            style={{ fontWeight: 600, fontSize: '14px', background: 'transparent', border: 'none', borderBottom: '1px dashed var(--border-color)', color: 'var(--text-color)', width: '200px', outline: 'none' }}
            placeholder="Görev/Dil Adı"
        />
        {taskKey.startsWith('custom_') && (
            <button onClick={() => handleDeleteTask(taskKey)} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', padding: '4px' }} title="Görevi Sil">
                <Trash2 size={16} />
            </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <select 
          value={config.provider} 
          onChange={(e) => handleModelChange(taskKey, 'provider', e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', minWidth: '150px' }}
        >
          {providers.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
        </select>
        
        <div style={{ flex: 1, display: 'flex' }}>
            <input 
              type="text" 
              list={`models-${config.provider}`}
              value={config.model} 
              onChange={(e) => handleModelChange(taskKey, 'model', e.target.value)}
              placeholder="Model Adı (Örn: gpt-4o)"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', width: '100%' }}
            />
            <datalist id={`models-${config.provider}`}>
                {(modelOptions[config.provider] || []).map(m => (
                    <option key={m} value={m} />
                ))}
            </datalist>
        </div>
      </div>
    </div>
  );

  return (
    <div className="content-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{fontSize:'18px', fontWeight:600, marginBottom:'4px'}}>Ayarlar</h2>
          <p style={{fontSize:'13px', color:'var(--text-muted)'}}>Çeşitli yapay zeka modellerini projeye ekleyin ve görevlere atayın.</p>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Kaydet
        </button>
      </div>

      {message && (
        <div style={{ padding: '10px', backgroundColor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', borderRadius: '6px', marginBottom: '20px', border: '1px solid rgba(76,175,80,0.3)' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
        {/* API Anahtarları Bölümü */}
        <div style={{ backgroundColor: 'var(--bg-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={16} style={{ color: 'var(--accent-color)' }} />
            API Anahtarları
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '15px' }}>
            Kullanmak istediğiniz servislerin API anahtarlarını girin.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {providers.map(provider => (
              <div key={provider}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: 500, textTransform: 'capitalize' }}>{provider} API Key</label>
                <input 
                  type="password" 
                  value={settings.api_keys[provider] || ''} 
                  onChange={(e) => handleApiKeyChange(provider, e.target.value)}
                  placeholder={`${provider.charAt(0).toUpperCase() + provider.slice(1)} api key...`}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Model Seçimleri Bölümü */}
        <div style={{ backgroundColor: 'var(--bg-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Cpu size={16} style={{ color: 'var(--accent-color)' }} />
                Görev & Model Eşleştirmeleri
            </h3>
            <button 
                onClick={handleAddTask}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--accent-color)', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
            >
                <Plus size={14} /> Ekle
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '15px' }}>
            Hangi dilde veya hangi görevde hangi modeli kullanacağınızı seçin. Örneğin Gemini 1.5 Flash'ı özet çıkarma için, GPT-4o'yu İngilizce sohbet için atayabilirsiniz.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {Object.entries(settings.models).map(([taskKey, config]) => (
                renderModelConfig(taskKey, config)
            ))}
          </div>
        </div>

        {/* Sistem ve Donanım Kurulum Sihirbazı */}
        <div style={{ backgroundColor: 'var(--bg-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HardDrive size={16} style={{ color: 'var(--accent-color)' }} />
              Kurulum Sihirbazı ve Depolama Yönetimi
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Vektörleme modeli profilini (BGE-M3 / E5 / Qwen2 / Bulut), kütüphane saklama dizinini veya API sağlayıcısını değiştirmek için sihirbazı yeniden başlatın.
            </p>
          </div>
          <button
            onClick={async () => {
              if (window.confirm("Kurulum sihirbazını yeniden başlatmak istiyor musunuz? Mevcut ayarlarınız sihirbaz ekranına yüklenecektir.")) {
                try {
                  await fetch('http://localhost:8000/api/kurulum-sifirla', { method: 'POST' });
                  window.location.reload();
                } catch (e) {
                  alert("Hata oluştu.");
                }
              }
            }}
            style={{
              backgroundColor: '#27272a',
              color: '#f4f4f5',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '10px 18px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <RefreshCw size={14} /> Kurulum Sihirbazını Yeniden Başlat
          </button>
        </div>

        {/* GitHub Otomatik Güncelleme ve Sürüm Kontrolü */}
        <div style={{ backgroundColor: 'var(--bg-color)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)', gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GitBranch size={16} style={{ color: 'var(--accent-color)' }} />
                GitHub Otomatik Güncelleme ve Sürüm Kontrolü (Adım 8)
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Doğrudan GitHub Releases (GuneyOrtac/ortac-academic-assistant) üzerinden yeni özellikleri denetleyin ve tek tıkla güncelleyin.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleCheckUpdate}
                disabled={checkingUpdate}
                style={{
                  backgroundColor: '#27272a',
                  color: '#f4f4f5',
                  border: '1px solid rgba(255,255,255,0.15)',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {checkingUpdate ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Güncellemeleri Denetle
              </button>
              <button
                onClick={handleApplyUpdate}
                disabled={updating}
                style={{
                  backgroundColor: 'var(--accent-color)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {updating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                GitHub'dan Şimdi Güncelle (Git Pull)
              </button>
            </div>
          </div>

          {updateMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: '13px' }}>
              {updateMsg}
            </div>
          )}

          {updateStatus && (
            <div style={{ padding: '12px 16px', borderRadius: '6px', backgroundColor: updateStatus.guncel_mi ? 'rgba(16,185,129,0.08)' : 'rgba(59,130,246,0.12)', border: updateStatus.guncel_mi ? '1px solid rgba(16,185,129,0.25)' : '1px solid #3b82f6', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: updateStatus.guncel_mi ? '#34d399' : '#60a5fa' }}>
                  {updateStatus.guncel_mi ? '✓ Sisteminiz en son sürümde (v2.2.6) çalışıyor.' : `🚀 Yeni Sürüm Mevcut: v${updateStatus.son_surum}`}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Mevcut: v{updateStatus.mevcut_surum} • GitHub: v{updateStatus.son_surum}
                </span>
              </div>
              {updateStatus.surum_notlari && !updateStatus.guncel_mi && (
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '12px', color: '#cbd5e1', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px' }}>
                  {updateStatus.surum_notlari}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
