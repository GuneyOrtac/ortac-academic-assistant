import os
import model_factory
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
import rag

def sohbet_yanitla(soru: str, secili_pdfler: list = None, aktif_sekme: str = "Bilinmiyor", draft_icerik: str = "") -> dict:
    """Soruyu sadece veritabanındaki PDF'leri kullanarak cevaplar. Ayrıca taslak editörüne de müdahale edebilir."""
    if not model_factory.is_gemini_configured():
        return {
            "yanit": "[BİLGİ] Sohbet ve makale analizi için geçerli bir Google Gemini API anahtarı gereklidir. Lütfen sağ üstteki 'Ayarlar' sekmesine giderek API anahtarınızı (AIzaSy...) kaydediniz.",
            "kaynaklar": []
        }
    llm = model_factory.get_gemini_llm(task="chat")
    
    # 1. RAG ile benzer dökümanları getir
    search_kwargs = {"k": 5}
    if secili_pdfler and len(secili_pdfler) > 0:
        if len(secili_pdfler) == 1:
            search_kwargs["filter"] = {"dosya_adi": secili_pdfler[0]}
        else:
            search_kwargs["filter"] = {"dosya_adi": {"$in": secili_pdfler}}
            
    retriever = rag.get_vectorstore().as_retriever(search_kwargs=search_kwargs)
    
    # 2. Prompt şablonu (Sadece PDF içeriklerini kullanmasını sağlayan katı yönerge)
    template = f"""Sen uzman bir akademik asistan ve danışmansın.
    Kullanıcı şu an uygulamanın '{aktif_sekme}' sekmesinde bulunuyor. Yanıtlarını verirken bu bağlamı (kullanıcının nerede olduğunu) göz önünde bulundur. 
    Kullanıcının 'Makale Taslağı' sekmesinde açık olan mevcut metni aşağıdadır (boşsa henüz bir şey yazılmamıştır):
    ---
    {{draft_icerik}}
    ---

    Eğer kullanıcı senden taslağa (A4 kağıdına/editöre) doğrudan bir şey yazmanı veya eklemeni isterse, bunu doğrudan yapabilirsin. 
    Editöre eklemek/yazmak istediğin İÇERİĞİ MUTLAKA <EDITOR_UPDATE> ve </EDITOR_UPDATE> etiketleri arasına yerleştir.
    Örnek: "Tabii, giriş bölümünü ekliyorum. <EDITOR_UPDATE><h2>Giriş</h2><p>Yapay zeka çok önemlidir...</p></EDITOR_UPDATE>"
    Bu etiketler arasındaki metin otomatik olarak kullanıcının editörüne aktarılacaktır. Eğer yazılan bir metni tamamen değiştirmen istenirse yine tüm metni bu etiketler arasına koy.
    Eğer ekleme/yazma işlemi istenmiyorsa, bu etiketleri kullanma.
    
    Kullanıcının sorusuna akademik bağlamda (context) verilen bilgileri kullanarak cevap ver. 
    Eğer bağlamda sorunun cevabı yoksa ve soru akademik bir bilgi talebi ise, "Bu konuda kütüphanenizdeki belgelerde yeterli bilgi bulunmamaktadır." de ve kendi dış bilgilerini uydurma.
    Eğer kullanıcı sadece "merhaba", "nasılsın" gibi günlük bir selamlama yapıyorsa veya basit bir işlem yaptırıyorsa (örneğin "taslağa merhaba yaz"), bağlama ihtiyaç duymadan cevap ver ve işlem yap.
    Yanıtlarında hangi belgeden alıntı yaptığını satır sonlarında (Yazar, Yıl) şeklinde belirt.

    Bağlam:
    {{context}}

    Soru: {{question}}

    Cevap:"""
    
    prompt = PromptTemplate.from_template(template)
    
    def format_docs(docs):
        # Format the documents to include metadata like author and year
        formatted = []
        for d in docs:
            yazar = d.metadata.get("yazar", "Bilinmiyor")
            yil = d.metadata.get("yil", "Bilinmiyor")
            formatted.append(f"[Kaynak: {yazar}, {yil}]\n{d.page_content}")
        return "\n\n".join(formatted)

    # 3. Zinciri (Chain) oluştur
    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough(), "draft_icerik": lambda x: draft_icerik}
        | prompt
        | llm
        | StrOutputParser()
    )

    # 4. Yanıtı üret
    yanit = rag_chain.invoke(soru)
    
    # Referans gösterilen kaynakları döndür
    docs = retriever.invoke(soru)
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
        "kullanilan_kaynaklar": kaynaklar
    }
