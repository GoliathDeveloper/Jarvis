# Simple Interface to Hailo‑Ollama

This document outlines a lightweight client that talks to a Hailo‑Ollama server (running on `localhost:8000`).  Two implementation options are provided:

1. **Python** – Fast prototyping, easy HTTP client.
2. **.NET (C#)** – Strong typing, async support, good for production.

Both approaches use the same REST API described in the Hailo‑Zoo README.

---

## 1. Common Requirements

| Requirement | Details |
|-------------|---------|
| Hailo‑Ollama server | `hailo-ollama` must be running on port **8000**.
| Network | The client can be on the same host or any machine that can reach `localhost:8000`.
| Model | The plan assumes the model `qwen2:1.5b` is already pulled.
| Dependencies |
| Python | `requests` (or `httpx` for async). |
| .NET | `System.Net.Http` (built‑in) and `System.Text.Json`.

---

## 2. Python Implementation

### 2.1 Directory Layout
```
project/
├─ client.py
├─ requirements.txt
└─ README.md
```

### 2.2 `requirements.txt`
```
requests==2.31.0
```

### 2.3 `client.py`
```python
import json
import requests

BASE_URL = "http://localhost:8000"
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
    return resp.json()


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
```

### 2.4 Usage
```bash
pip install -r requirements.txt
python client.py
```

---

## 3. .NET (C#) Implementation

### 3.1 Project Setup
```bash
dotnet new console -n HailoOllamaClient
cd HailoOllamaClient
# No external packages needed – System.Net.Http is built‑in
```

### 3.2 `Program.cs`
```csharp
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace HailoOllamaClient
{
    class Program
    {
        private static readonly HttpClient _client = new HttpClient();
        private const string BaseUrl = "http://localhost:8000";
        private const string Model = "qwen2:1.5b";

        static async Task Main(string[] args)
        {
            Console.WriteLine("Listing models...");
            var list = await ListModelsAsync();
            Console.WriteLine(JsonSerializer.Serialize(list, new JsonSerializerOptions { WriteIndented = true }));

            Console.WriteLine("\nPulling model…");
            var pull = await PullModelAsync();
            Console.WriteLine(JsonSerializer.Serialize(pull, new JsonSerializerOptions { WriteIndented = true }));

            Console.WriteLine("\nChat example:");
            var chat = await ChatAsync(new[]
            {
                new { role = "user", content = "Translate to French: The cat is on the table." }
            });
            Console.WriteLine(JsonSerializer.Serialize(chat, new JsonSerializerOptions { WriteIndented = true }));
        }

        private static async Task<JsonElement> ListModelsAsync()
        {
            var resp = await _client.GetAsync($"{BaseUrl}/hailo/v1/list");
            resp.EnsureSuccessStatusCode();
            var json = await resp.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<JsonElement>(json);
        }

        private static async Task<JsonElement> PullModelAsync(string model = Model)
        {
            var payload = new { model, stream = false };
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var resp = await _client.PostAsync($"{BaseUrl}/api/pull", content);
            resp.EnsureSuccessStatusCode();
            var json = await resp.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<JsonElement>(json);
        }

        private static async Task<JsonElement> ChatAsync(object[] messages, string model = Model)
        {
            var payload = new { model, messages };
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var resp = await _client.PostAsync($"{BaseUrl}/api/chat", content);
            resp.EnsureSuccessStatusCode();
            var json = await resp.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<JsonElement>(json);
        }
    }
}
```

### 3.3 Build & Run
```bash
dotnet run
```

---

## 4. Testing the Client

1. **Start Hailo‑Ollama** (if not already running):
   ```bash
   hailo-ollama
   ```
2. **Pull the model** (once):
   ```bash
   curl --silent http://localhost:8000/api/pull -H 'Content-Type: application/json' -d '{"model":"qwen2:1.5b","stream":false}'
   ```
3. **Run the client** (Python or .NET) and verify the output.

---

## 5. Extending the Client

| Feature | How to add |
|---------|------------|
| Streaming chat | Use `stream=true` in the payload and read the response as a stream. |
| Authentication | Add an `Authorization` header if the server is protected. |
| Error handling | Wrap HTTP calls in try/catch and log `resp.StatusCode`. |
| CLI arguments | Use `argparse` (Python) or `System.CommandLine` (.NET). |

---

## 6. Summary

- The Hailo‑Ollama API is simple: list, pull, chat.
- Both Python and .NET clients can be built with minimal dependencies.
- The plan above gives a ready‑to‑run example for each language.
- Adjust `MODEL` and `BASE_URL` as needed for your environment.

---

Happy hacking!