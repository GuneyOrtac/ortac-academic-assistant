import requests

def search_articles(query: str, limit: int = 5, page: int = 1, sort_by: str = "relevance", min_year: int = None):
    """OpenAlex API kullanarak akademik makaleleri tarar."""
    # sort_by: 'relevance' veya 'date'
    if sort_by == "date":
        sort_query = "publication_date:desc"
    else:
        sort_query = "relevance_score:desc,cited_by_count:desc"
        
    filter_query = ""
    if min_year:
        filter_query = f"&filter=from_publication_date:{min_year}-01-01"
        
    url = f"https://api.openalex.org/works?search={query}{filter_query}&per-page={limit}&page={page}&sort={sort_query}"
    
    try:
        response = requests.get(url, timeout=10.0)
        response.raise_for_status()
        data = response.json()
        
        results = []
        for work in data.get("results", []):
            authors = [a["author"]["display_name"] for a in work.get("authorships", []) if "author" in a]
            is_oa = work.get("open_access", {}).get("is_oa", False)
            
            # Doğrudan PDF bağlantısını önce best_oa_location veya primary_location içinden al
            best_oa = work.get("best_oa_location") or {}
            primary_loc = work.get("primary_location") or {}
            oa_obj = work.get("open_access") or {}
            pdf_url = best_oa.get("pdf_url") or primary_loc.get("pdf_url") or oa_obj.get("oa_url")
            
            # Protokol düzeltmesi ve ArXiv özel format düzeltmesi (abs -> pdf)
            if pdf_url:
                pdf_url = pdf_url.strip()
                if pdf_url.startswith("//"):
                    pdf_url = "https:" + pdf_url
                if "arxiv.org/abs/" in pdf_url:
                    pdf_url = pdf_url.replace("arxiv.org/abs/", "arxiv.org/pdf/")
                    if not pdf_url.endswith(".pdf"):
                        pdf_url += ".pdf"

            results.append({
                "id": work.get("id"),
                "title": work.get("title"),
                "doi": work.get("doi"),
                "publication_year": work.get("publication_year"),
                "authors": authors,
                "is_oa": is_oa,
                "open_access_url": pdf_url or oa_obj.get("oa_url"),
                "type": work.get("type", "Belirsiz")
            })
        return results
    except Exception as e:
        raise ValueError(f"OpenAlex API hatası: {str(e)}")
