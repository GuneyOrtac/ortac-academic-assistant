import requests

def search_articles(
    query: str, 
    limit: int = 5, 
    page: int = 1, 
    sort_by: str = "relevance", 
    min_year: int = None,
    max_year: int = None,
    scope: str = "tumu", # 'tumu', 'yerli', 'yabanci'
    only_oa: bool = False
):
    """
    OpenAlex API kullanarak akademik makaleleri gelişmiş filtrelerle tarar.
    scope: 'tumu', 'yerli' (Türkiye/TR kurumları), 'yabanci' (Uluslararası)
    """
    if sort_by == "date":
        sort_query = "publication_date:desc"
    elif sort_by == "citations":
        sort_query = "cited_by_count:desc"
    else:
        sort_query = "relevance_score:desc,cited_by_count:desc"
        
    filters = []
    if min_year:
        filters.append(f"from_publication_date:{min_year}-01-01")
    if max_year:
        filters.append(f"to_publication_date:{max_year}-12-31")
    if only_oa:
        filters.append("is_oa:true")
    if scope == "yerli":
        filters.append("authorships.institutions.country_code:TR")
    elif scope == "yabanci":
        filters.append("authorships.institutions.country_code:!TR")
        
    filter_query = f"&filter={','.join(filters)}" if filters else ""
    url = f"https://api.openalex.org/works?search={query}{filter_query}&per-page={limit}&page={page}&sort={sort_query}"
    
    try:
        response = requests.get(url, timeout=12.0)
        response.raise_for_status()
        data = response.json()
        
        results = []
        for work in data.get("results", []):
            authorships = work.get("authorships", [])
            authors = [a["author"]["display_name"] for a in authorships if "author" in a]
            
            # Yerli makale tespiti (TR kurum bağı veya dil)
            countries = []
            for a in authorships:
                for inst in a.get("institutions", []):
                    c = inst.get("country_code")
                    if c:
                        countries.append(c)
            is_yerli = "TR" in countries or work.get("language") == "tur"
            
            is_oa = work.get("open_access", {}).get("is_oa", False)
            
            best_oa = work.get("best_oa_location") or {}
            primary_loc = work.get("primary_location") or {}
            oa_obj = work.get("open_access") or {}
            pdf_url = best_oa.get("pdf_url") or primary_loc.get("pdf_url") or oa_obj.get("oa_url")
            
            if pdf_url:
                pdf_url = pdf_url.strip()
                if pdf_url.startswith("//"):
                    pdf_url = "https:" + pdf_url
                if "arxiv.org/abs/" in pdf_url:
                    pdf_url = pdf_url.replace("arxiv.org/abs/", "arxiv.org/pdf/")
                    if not pdf_url.endswith(".pdf"):
                        pdf_url += ".pdf"

            source = primary_loc.get("source") or {}
            source_name = source.get("display_name") or "Akademik Yayın"

            results.append({
                "id": work.get("id"),
                "title": work.get("title") or "Başlıksız Makale",
                "doi": work.get("doi"),
                "publication_year": work.get("publication_year"),
                "authors": authors,
                "is_oa": is_oa,
                "open_access_url": pdf_url or oa_obj.get("oa_url"),
                "type": work.get("type", "Makale"),
                "is_yerli": is_yerli,
                "cited_by_count": work.get("cited_by_count", 0),
                "source_name": source_name
            })
        return results
    except Exception as e:
        raise ValueError(f"OpenAlex API hatası: {str(e)}")
