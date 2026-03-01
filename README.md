# Hailo‑Ollama Python Client

This repository contains a minimal Python script that talks to a Hailo‑Ollama server (the Hailo‑Zoo GenAI interface).  The client demonstrates how to:

1. List available models.
2. Pull a model to the local cache.
3. Send a chat request and receive a response.

## Prerequisites

| Item | Version | Notes |
|------|---------|-------|
| **Python** | 3.10+ | The script uses only the standard library and `requests`.
| **Hailo‑Ollama** | 0.6.0+ | Must be running on `localhost:8000`.
| **Model** | `qwen2:1.5b` | The example pulls this model; adjust if you use a different one.

## Installation

```bash
# 1. Clone the repo (or copy the files into a folder)
# 2. Create a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate

# 3. Install the only dependency
pip install requests==2.31.0
```

## Running the Client

```bash
# Ensure the Hailo‑Ollama server is running
hailo-ollama &

# Run the Python script
python client.py
```

You should see output similar to:

```
Available models:
{
  "models": ["qwen2:1.5b", ...]
}

Pulling model…
{
  "model": "qwen2:1.5b",
  "status": "success"
}

Chat example:
{
  "model": "qwen2:1.5b",
  "response": "Le chat est sur la table."
}
```

## Customisation

* **Change the model** – edit the `MODEL` constant in `client.py`.
* **Different server** – modify `BASE_URL` if the server is on another host or port.
* **Add more chat messages** – pass a list of `{role, content}` objects to `chat()`.

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `ConnectionError` | Server not running or wrong port | Start `hailo-ollama` or update `BASE_URL` |
| `HTTPError` | Model not pulled | Run the pull step or check the model name |
| `JSONDecodeError` | Unexpected response | Verify the server is healthy and the API version matches |

## License

MIT – see the `LICENSE` file in the repository.# jarvis
Pi5 + Hailo 10H
## TinyTuya MQTT Gateway

The TinyTuya library provides a lightweight MQTT bridge for Tuya‑based smart devices.  It can be used to control outlets, switches, and more from the voice assistant.

### Installation
```bash
python -m pip install tinytuya
```

### Basic Usage
```python
import tinytuya

# Replace with your device details
device = tinytuya.OutletDevice('device_id', '192.168.1.50', 'device_key')
device.turn_on()
device.turn_off()
```

Integrate the TinyTuya calls into the **Device Adapter Layer** of the assistant.
