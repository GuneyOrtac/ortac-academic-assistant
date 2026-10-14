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
            
            results.append({
                "id": work.get("id"),
                "title": work.get("title"),
                "doi": work.get("doi"),
                "publication_year": work.get("publication_year"),
                "authors": authors,
                "is_oa": is_oa,
                "open_access_url": work.get("open_access", {}).get("oa_url"),
                "type": work.get("type", "Belirsiz")
            })
        return results
    except Exception as e:
        raise ValueError(f"OpenAlex API hatası: {str(e)}")
