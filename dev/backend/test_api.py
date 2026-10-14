import requests

url = "http://127.0.0.1:8000/api/sohbet"
payload = {
    "soru": "merhaba",
    "secili_pdfler": [],
    "aktif_sekme": "Bilinmiyor"
}
response = requests.post(url, json=payload)
print("Status:", response.status_code)
print("Response:", response.text)
