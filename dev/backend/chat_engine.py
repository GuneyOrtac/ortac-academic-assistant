import os
import re
from datetime import datetime
import model_factory
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
import rag
import openalex_engine

def normalize_tr(text: str) -> str:
    mapping = {
        'ı': 'i', 'İ': 'i', 'I': 'i',
        'ğ': 'g', 'Ğ': 'g',
        'ü': 'u', 'Ü': 'u',
        'ş': 's', 'Ş': 's',
        'ö': 'o', 'Ö': 'o',
        'ç': 'c', 'Ç': 'c'
    }
    t = text.lower()
    for tr, en in mapping.items():
        t = t.replace(tr, en)
    return t

def detect_literature_search_intent(soru: str):
    """
    Kullanıcının sohbet mesajının bir literatür/akademik makale arama talebi olup olmadığını tespit eder.
    Filtreleri (yerli/yabancı, yıl, açık erişim) ve arama konusunu ayıklar.
    """
    s = soru.lower().strip()
    s_norm = normalize_tr(soru)
    
    search_keywords = ["makale", "literatur", "yayin", "eser", "tez", "paper", "openalex", "kaynak"]
    action_keywords = ["ara", "tara", "bul", "listele", "getir", "arastir", "search", "oner", "goster", "bak"]
    
    has_search_kw = any(k in s_norm for k in search_keywords)
    has_action_kw = any(k in s_norm for k in action_keywords) or "hakkinda" in s_norm or "ilgili" in s_norm
    
    # Belirgin arama kalıpları
    is_search_intent = (
        (has_search_kw and has_action_kw) or
        s_norm.startswith("ara ") or
        s_norm.startswith("bul ") or
        "literatur" in s_norm or
        "openalex" in s_norm
    )
    
    if not is_search_intent:
        return None
        
    # 1. Kapsam (Scope: 'yerli', 'yabanci', 'tumu')
    scope = "tumu"
    if any(k in s_norm for k in ["yerli", "turk", "turkiye", "tr dizin", "tr"]):
        scope = "yerli"
    elif any(k in s_norm for k in ["yabanci", "uluslararasi", "global", "ingilizce", "foreign", "international"]):
        scope = "yabanci"
        
    # 2. Yıl Filtresi
    current_year = datetime.now().year
    min_year = None
    if "son 3 yıl" in s:
        min_year = current_year - 3
    elif "son 5 yıl" in s:
        min_year = current_year - 5
    elif "son 10 yıl" in s:
        min_year = current_year - 10
    else:
        found_years = [int(y) for y in re.findall(r"\b(19\d\d|20\d\d)\b", s)]
        if found_years:
            min_year = min(found_years)
            
    # 3. Açık Erişim (Open Access)
    only_oa = any(k in s for k in ["açık erişim", "open access", "indirilebilir", "tam metin", "pdf"])
    
    # 4. Sıralama (Sort By)
    sort_by = "relevance"
    if any(k in s for k in ["en çok atıf", "en popüler", "en çok okunan", "en etkili"]):
        sort_by = "citations"
    elif any(k in s for k in ["en yeni", "en son", "güncel"]):
        sort_by = "date"
        
    # 5. Temiz Arama Sorgusu (Stop-words ve komut kelimelerini ayıkla)
    stop_words = [
        "hakkında", "hakkinda", "ile ilgili", "ilgili", "makaleleri", "makale", "yayınları", "yayinlari",
        "yayın", "yayin", "literatür", "literatur", "taraması", "taramasi", "tara", "ara", "bul", "getir",
        "listele", "bana", "lütfen", "lutfen", "yerli", "yabancı", "yabanci", "uluslararası", "uluslararasi",
        "açık erişim", "acik erisim", "açık erişimli", "acik erisimli", "open access",
        "son 3 yıl", "son 3 yil", "son 5 yıl", "son 5 yil", "son 10 yıl", "son 10 yil",
        "öner", "oner", "göster", "goster", "bak", "neler var", "var mı", "var mi", "araştır", "arastir",
        "openalex", "üzerinden", "uzerinden", "konusunda", "konusundaki",
        "sonrası", "sonrasi", "öncesi", "oncesi", "yılı", "yili", "yılında", "yilinda", "yılından", "yilindan",
        "dair", "yönelik", "yonelik"
    ]
    
    cleaned_query = s
    # Yılları temizle
    cleaned_query = re.sub(r"\b(19\d\d|20\d\d)\b", "", cleaned_query)
    for sw in stop_words:
        cleaned_query = re.sub(rf"\b{re.escape(sw)}\b", "", cleaned_query)
        
    # Noktalama ve fazla boşlukları temizle
    cleaned_query = re.sub(r"[^\w\s]", " ", cleaned_query).strip()
    cleaned_query = re.sub(r"\s+", " ", cleaned_query)
    
    if len(cleaned_query) < 2:
        # Fallback: Orijinal sorgudan noktalama işaretlerini kaldırıp kullan
        cleaned_query = re.sub(r"[^\w\s]", " ", soru).strip()
        
    return {
        "query": cleaned_query,
        "scope": scope,
        "min_year": min_year,
        "only_oa": only_oa,
        "sort_by": sort_by
    }

def sohbet_yanitla(soru: str, secili_pdfler: list = None, aktif_sekme: str = "Bilinmiyor", draft_icerik: str = "") -> dict:
    """
    Sohbet sorgularını karşılar:
    1. Literatür arama niyeti varsa doğrudan OpenAlex motorunu çalıştırır ve etkileşimli makale kartları döndürür.
    2. Taslak yazımı veya düzenleme isteği varsa <EDITOR_UPDATE> etiketleri üretir.
    3. Akademik soru ise ChromaDB RAG kütüphanesini kullanarak referanslı cevap üretir.
    """
    if not model_factory.is_llm_configured(task="chat"):
        return {
            "yanit": "[BİLGİ] Sohbet ve makale analizi için geçerli bir API anahtarı (Google Gemini veya OpenRouter) gereklidir. Lütfen sağ üstteki 'Ayarlar' sekmesine giderek API anahtarınızı kaydediniz.",
            "kullanilan_kaynaklar": [],
            "bulunan_makaleler": []
        }
        
    # --- 1. Literatür Arama Niyeti Kontrolü ---
    lit_intent = detect_literature_search_intent(soru)
    if lit_intent:
        q = lit_intent["query"]
        scope = lit_intent["scope"]
        min_yr = lit_intent["min_year"]
        oa = lit_intent["only_oa"]
        sort_by = lit_intent["sort_by"]
        
        try:
            articles = openalex_engine.search_articles(
                query=q,
                limit=5,
                page=1,
                sort_by=sort_by,
                min_year=min_yr,
                scope=scope,
                only_oa=oa
            )
            
            scope_label = "Tüm Dünya (Küresel)"
            if scope == "yerli":
                scope_label = "🇹🇷 Yerli (TR Kurumları / TR Dizin)"
            elif scope == "yabanci":
                scope_label = "🌍 Uluslararası / Yabancı"
                
            filters_info = [scope_label]
            if min_yr:
                filters_info.append(f"{min_yr} ve sonrası")
            if oa:
                filters_info.append("Sadece Açık Erişim")
                
            filter_str = ", ".join(filters_info)
            
            if articles:
                yanit_metni = (
                    f"Akademik literatür radarı üzerinde **'{q}'** konusu için arama yaptım ({filter_str}). "
                    f"Öne çıkan **{len(articles)} adet akademik makaleyi** aşağıda listeledim.\n\n"
                    f"İncelemek istediğiniz yayını doğrudan **'Kütüphaneme Ekle'** butonuyla sisteminize indirebilir "
                    f"ve hemen soru-cevap yapmaya başlayabilirsiniz:"
                )
                return {
                    "yanit": yanit_metni,
                    "kullanilan_kaynaklar": [],
                    "bulunan_makaleler": articles
                }
            else:
                return {
                    "yanit": (
                        f"Akademik literatür radarı üzerinde **'{q}'** araması için belirtilen filtrelerle ({filter_str}) "
                        f"yayın bulunamadı. Arama kelimelerinizi biraz daha genel tutarak (örn: 'deprem', 'afet') "
                        f"veya filtreleri esneterek tekrar deneyebilirsiniz."
                    ),
                    "kullanilan_kaynaklar": [],
                    "bulunan_makaleler": []
                }
        except Exception as err:
            print(f"[CHAT LIT SEARCH HATA]: {err}")
            # Hata durumunda RAG sürecine devam et

    # --- 2. RAG ve LLM Sohbet Süreci ---
    llm = model_factory.get_llm(task="chat")
    
    search_kwargs = {"k": 5}
    if secili_pdfler and len(secili_pdfler) > 0:
        if len(secili_pdfler) == 1:
            search_kwargs["filter"] = {"dosya_adi": secili_pdfler[0]}
        else:
            search_kwargs["filter"] = {"dosya_adi": {"$in": secili_pdfler}}
            
    try:
        retriever = rag.get_vectorstore().as_retriever(search_kwargs=search_kwargs)
        docs = retriever.invoke(soru)
    except Exception as e:
        docs = []
    
    template = f"""Sen uzman bir akademik asistan, bilimsel araştırma danışmanı ve OpenDraft motorusun.
Kullanıcı şu an uygulamanın '{aktif_sekme}' sekmesinde bulunuyor. Yanıtlarını verirken bu bağlamı göz önünde bulundur. 
Kullanıcının 'OpenDraft / Makale Taslağı' sekmesinde açık olan mevcut metni aşağıdadır (boşsa henüz bir şey yazılmamıştır):
---
{{draft_icerik}}
---

GÖREVLER VE KURALLAR:
1. TASLAK OLUŞTURMA / DÜZENLEME:
   Eğer kullanıcı senden taslağa (A4 kağıdına/editöre) doğrudan bir şey yazmanı veya eklemeni isterse, 
   editöre eklenecek zengin HTML içeriğini MUTLAKA <EDITOR_UPDATE> ve </EDITOR_UPDATE> etiketleri arasına yerleştir.
   Örnek: "Giriş bölümü taslağınıza aktarılıyor. <EDITOR_UPDATE><h2>Giriş</h2><p>Deprem bilinci...</p></EDITOR_UPDATE>"
   Eğer kullanıcı taslağı Word olarak indirmek isterse, "OpenDraft sekmesindeki 'Word Olarak İndir' butonuna basarak metninizi atıf uyarılarıyla birlikte .docx olarak indirebilirsiniz." şeklinde rehberlik et.

2. LİTERATÜR VE BİLGİ TALEBİ:
   Kullanıcının sorusuna akademik bağlamda (context) verilen PDF belgelerindeki bilgileri kullanarak cevap ver. 
   Yanıtlarında hangi belgeden alıntı yaptığını satır sonlarında (Yazar, Yıl) şeklinde belirt.
   Eğer bağlamda sorunun cevabı yoksa ve soru akademik bir bilgi talebi ise, "Kütüphanenizdeki belgelerde bu konuda doğrudan bir bilgi bulunmamaktadır. İsterseniz 'Literatür Radarı' sekmesinden veya doğrudan bana '... hakkında makale ara' diyerek küresel literatürü tarayabilirim." de.

3. SOHBET VE ASİSTANLIK:
   Eğer kullanıcı selamlama yapıyorsa veya genel bir soru soruyorsa samimi, akademik ve profesyonel bir dille yardımcı ol.

Bağlam:
{{context}}

Soru: {{question}}

Cevap:"""
    
    prompt = PromptTemplate.from_template(template)
    
    def format_docs(input_docs):
        formatted = []
        for d in input_docs:
            yazar = d.metadata.get("yazar", "Bilinmiyor")
            yil = d.metadata.get("yil", "Bilinmiyor")
            formatted.append(f"[Kaynak: {yazar}, {yil}]\n{d.page_content}")
        return "\n\n".join(formatted) if formatted else "Kütüphaneden döküman eşleşmedi."

    context_text = format_docs(docs)
    
    chain = prompt | llm | StrOutputParser()
    yanit = chain.invoke({
        "context": context_text,
        "question": soru,
        "draft_icerik": draft_icerik or ""
    })
    
    kaynaklar = []
    for d in docs:
        k = {
            "dosya_adi": d.metadata.get("dosya_adi"),
            "yazar": d.metadata.get("yazar"),
            "yil": d.metadata.get("yil")
        }
        if k not in kaynaklar:
            kaynaklar.append(k)

    return {
        "yanit": yanit,
        "kullanilan_kaynaklar": kaynaklar,
        "bulunan_makaleler": []
    }
