class MCPManager:
    """Zotero, MATLAB, GIS gibi dış programlar için MCP (Model Context Protocol) entegrasyon modülü."""
    
    def __init__(self):
        self.connected_servers = []

    def connect_server(self, server_name: str):
        """MCP protokolü üzerinden dış sunucuya (Zotero, vs.) bağlanır."""
        # MVP (Minimum Viable Product) aşaması için simüle edilmiş bağlantı.
        if server_name not in self.connected_servers:
            self.connected_servers.append(server_name)
        return {"status": "success", "message": f"{server_name} MCP Sunucusuna başarıyla bağlanıldı."}

    def list_connected_tools(self):
        """Bağlanılan MCP sunucularındaki mevcut araçları (tools) listeler."""
        tools = []
        if "Zotero" in self.connected_servers:
            tools.append({"name": "zotero_get_citations", "description": "Zotero'dan atıf bilgilerini çeker."})
        if "MATLAB" in self.connected_servers:
            tools.append({"name": "matlab_run_script", "description": "MATLAB motorunda script çalıştırır."})
        if "GIS" in self.connected_servers:
            tools.append({"name": "gis_extract_map", "description": "Coğrafi bilgi sisteminden harita karesi alır."})
            
        return {
            "servers": self.connected_servers,
            "tools_available": tools
        }

mcp_engine = MCPManager()
