import os
from docx import Document
from docx.enum.text import WD_COLOR_INDEX
import model_factory
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

class DraftSection(BaseModel):
    baslik: str = Field(description="Bölüm başlığı (örn: Giriş, Literatür Özeti, Tartışma)")
    metin: str = Field(description="Bölümün içeriği (akademik bir dille yazılmış paragraf).")
    eksik_atif_var_mi: bool = Field(description="Bu bölümde literatür atıfı eksik olan ve desteklenmesi gereken iddialı cümleler varsa true.")

class DraftResponse(BaseModel):
    makale_basligi: str = Field(description="Makalenin oluşturulan taslak başlığı")
    bolumler: list[DraftSection] = Field(description="Makale bölümleri listesi")

def taslak_ve_word_olustur(konu: str, taslak_yolu: str = "makale_taslagi.docx") -> dict:
    """Verilen konuya göre makale taslağı (OpenDraft) oluşturup eksik atıfları sarıya boyayarak Word'e kaydeder."""
    if not model_factory.is_gemini_configured():
        raise ValueError("Makale taslağı oluşturmak için geçerli bir Google Gemini API anahtarı gereklidir. Lütfen 'Ayarlar' sekmesinden API anahtarınızı (AIzaSy...) kaydediniz.")
    llm = model_factory.get_gemini_llm(task="drafting")
    parser = JsonOutputParser(pydantic_object=DraftResponse)
    
    template = """Sen profesyonel bir akademik makale yazarı ve OpenDraft motorusun. 
    Kullanıcının verdiği konu hakkında detaylı bir akademik makale taslağı oluştur.
    Makale en az 3 mantıksal bölümden (Örn: Giriş, Literatür/Yöntem, Sonuç/Tartışma) oluşmalıdır.
    Eğer yazılan metnin içinde bilimsel bir gerçeklik iddiası taşıyan ancak atıf yapılmamış cümleler varsa 'eksik_atif_var_mi' değerini true yap.

    Konu: {konu}

    FORMAT KURALLARI:
    {format_instructions}"""
    
    prompt = PromptTemplate(
        template=template,
        input_variables=["konu"],
        partial_variables={"format_instructions": parser.get_format_instructions()},
    )
    
    # 1. LLM ile taslağı oluştur
    chain = prompt | llm | parser
    sonuc = chain.invoke({"konu": konu})
    
    # 2. Word (docx) belgesini oluştur
    doc = Document()
    doc.add_heading(sonuc["makale_basligi"], level=1)
    
    for bolum in sonuc["bolumler"]:
        doc.add_heading(bolum["baslik"], level=2)
        p = doc.add_paragraph()
        
        # Eğer atıf eksikse metni sarıya boyayarak dışa aktar
        if bolum["eksik_atif_var_mi"]:
            # Normalde cümlenin sadece belirli kısmını boyamak daha iyidir ama 
            # basit bir MVP için tüm paragrafın veya uyarı ekinin arka planını boyuyoruz.
            run = p.add_run(bolum["metin"] + " [DİKKAT: EKSİK ATIF / KAYNAK GEREKLİ]")
            run.font.highlight_color = WD_COLOR_INDEX.YELLOW
        else:
            p.add_run(bolum["metin"])
            
    doc.save(taslak_yolu)
    
    return {
        "mesaj": "Makale taslağı Word dosyası olarak başarıyla oluşturuldu.",
        "dosya_yolu": os.path.abspath(taslak_yolu),
        "bolum_sayisi": len(sonuc["bolumler"])
    }
