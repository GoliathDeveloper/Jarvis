import json
import requests

BASE_URL = "http://192.168.0.2:8000"
MODEL = "qwen2:1.5b"


def list_models():
    resp = requests.get(f"{BASE_URL}/hailo/v1/list")
    resp.raise_for_status()
    return resp.json()


def pull_model(model: str = MODEL):
    payload = {"model": model, "stream": False}
    resp = requests.post(f"{BASE_URL}/api/pull", json=payload)
    resp.raise_for_status()
    return resp.json()


def chat(messages: list, model: str = MODEL):
    payload = {"model": model, "messages": messages}
    resp = requests.post(f"{BASE_URL}/api/chat", json=payload)
    resp.raise_for_status()
    # The Hailo‑Ollama server may return a stream of JSON objects.
    # If the response contains multiple JSON objects separated by newlines,
    # we parse the first one and ignore the rest.
    # Handle streaming responses: accumulate content until "done": true
    full_content = ""
    for line in resp.iter_lines(decode_unicode=True):
        if not line:
            continue
        try:
            part = json.loads(line)
        except ValueError:
            continue
        # Append partial content
        if "message" in part and "content" in part["message"]:
            full_content += part["message"]["content"]
        # Stop when done
        if part.get("done"):
            break
    # Construct a final response object
    return {
        "model": part.get("model"),
        "created_at": part.get("created_at"),
        "message": {"role": part.get("message", {}).get("role"), "content": full_content},
        "done": True,
    }


if __name__ == "__main__":
    print("Available models:")
    print(json.dumps(list_models(), indent=2))

    print("\nPulling model…")
    print(json.dumps(pull_model(), indent=2))

    print("\nChat example:")
    msg = [
        {"role": "user", "content": "Translate to French: The cat is on the table."}
    ]
    print(json.dumps(chat(msg), indent=2))
