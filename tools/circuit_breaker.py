import sys
import json
from pathlib import Path

# Windows console encoding fix
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

STATE_FILE = Path(".sandbox_circuit_breaker.json")

class CircuitBreaker:
    def __init__(self, max_retries: int = 2):
        self.max_retries = max_retries
        self.state = self._load_state()

    def _load_state(self):
        if STATE_FILE.exists():
            try:
                return json.loads(STATE_FILE.read_text(encoding="utf-8"))
            except Exception:
                pass
        return {"consecutive_failures": 0, "last_error": None}

    def _save_state(self):
        STATE_FILE.write_text(json.dumps(self.state, indent=2, ensure_ascii=False), encoding="utf-8")

    def record_success(self):
        self.state = {"consecutive_failures": 0, "last_error": None}
        self._save_state()

    def record_failure(self, gate_name: str, error_msg: str):
        self.state["consecutive_failures"] += 1
        self.state["last_error"] = f"[{gate_name}] {error_msg}"
        self._save_state()

        if self.state["consecutive_failures"] >= self.max_retries:
            self.halt_and_prompt_human(gate_name, error_msg)

    def halt_and_prompt_human(self, gate_name: str, error_msg: str):
        print("\n" + "="*70)
        print("🛑 DEVRE KESİCİ (CIRCUIT BREAKER) TETİKLENDİ!")
        print(f"Hata Kapısı: {gate_name}")
        print(f"Başarısızlık Sayısı: {self.state['consecutive_failures']} (Maksimum sınır: {self.max_retries})")
        print(f"Hata Detayı: {error_msg}")
        print("="*70)
        print("⚠️ Otonom döngü durduruldu. Lütfen kararı verin:")
        print("1. Kök nedeni manuel incele ve kuralı revize et.")
        print("2. Bu testi geçici olarak baypas et (skip).")
        print("3. Sanal ortamı temizle ve son kararla yeniden dene.")
        print("="*70 + "\n")
        sys.exit(99)  # 99: HITL İnsan Müdahalesi Sinyali
