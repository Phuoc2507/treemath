import requests
import sys

try:
    # Ngrok local API
    response = requests.get("http://127.0.0.1:4040/api/tunnels")
    if response.status_code == 200:
        data = response.json()
        tunnels = data.get("tunnels", [])
        if tunnels:
            print("Ngrok is RUNNING.")
            for t in tunnels:
                if t.get("proto") == "https":
                    print(f"Public URL: {t.get('public_url')}")
        else:
            print("Ngrok is running but no tunnels found.")
    else:
        print("Cannot connect to Ngrok API.")
except Exception as e:
    print("Ngrok is NOT running.")
