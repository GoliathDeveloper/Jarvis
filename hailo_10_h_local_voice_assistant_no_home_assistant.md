# Hailo-10H Local Voice Assistant (No Home Assistant)

This document defines a **code-first, fully local voice assistant** running on a **Raspberry Pi 5 (16 GB)** with a **Hailo-10H** accelerator.

There is **NO Home Assistant** in this design.
You own the full stack: intent parsing, validation, and device control.

Goals:
- Alexa-like voice control
- <1–1.3s end-to-end latency
- Deterministic, safe behaviour
- No cloud dependencies

---

## 1. High-Level Architecture

```
[ Microphone ]
      ↓
[ Wake Word Engine ]      (CPU)
      ↓
[ Speech-to-Text ]        (CPU)
      ↓
[ Intent LLM ]            (Hailo-10H via Hailo-Ollama)
      ↓
[ Intent Validator ]      (Your code)
      ↓
[ Action Dispatcher ]     (Your code)
      ↓
[ Device Adapters ]       (MQTT / Zigbee / Matter / REST / GPIO)
      ↓
[ Optional Text-to-Speech ]
```

---

## 2. Target Platform

- **Raspberry Pi 5 (16 GB RAM)**
- **Raspberry Pi OS – Debian 13 (Trixie)**
- **Linux kernel 6.12**
- **Hailo-10H** (M.2 or PCIe)
- **HailoRT-CLI 5.1.1**

This platform is **fully supported and appropriate** for always-on voice control.

---

## 3. Wake Word Detection

Always-on, CPU-only.

Recommended engines:
- OpenWakeWord (Python)
- Porcupine
- Mycroft Precise

Rules:
- Wake word gates all processing
- No audio is sent to STT or LLM until triggered

Example wake phrases:
- "Hey Home"
- "Computer"
- "Jarvis"

---

## 4. Speech-to-Text (STT)

### Recommended
- **Whisper-Base**

Guidelines:
- Single-shot transcription (not streaming)
- Record 4–5 seconds after wake word
- CPU-only is sufficient on Pi 5

Expected latency:
- ~400–600 ms

---

## 5. Intent Parsing (LLM on Hailo)

### Primary Model

```
qwen2:1.5b
```

(= Qwen2-1.5B-Instruct, fastest TTFT on Hailo)

Purpose:
- Convert natural language → structured intent
- No reasoning, no creativity

---

## 6. System Prompt (Contract)

This prompt is **non-negotiable**.

```
You are an intent parser for a local voice assistant.

Rules:
- Output JSON only
- No explanations
- No markdown
- No additional text

Allowed intents:
- turn_on
- turn_off
- set_level
- set_temperature
- query_state

Allowed domains:
- light
- plug
- fan
- thermostat
- scene
- media

If the command is unclear, return:
{"intent":"unknown"}
```

---

## 7. Intent Output Examples

### Input
```
"Turn the kitchen lights to fifty percent"
```

### Output
```json
{
  "intent": "set_level",
  "domain": "light",
  "area": "kitchen",
  "value": 50
}
```

---

## 8. Intent Validation (Critical Safety Layer)

The LLM output must be validated **before any action occurs**.

### Validation Rules
- Intent must be in allow-list
- Domain must be known
- Area must be registered
- Numeric values must be in range

### Example (Python)
```
ALLOWED_AREAS = {"kitchen", "bedroom", "living_room"}
ALLOWED_DOMAINS = {"light", "fan", "plug"}

def validate(intent):
    if intent.get("intent") == "unknown":
        return False
    if intent.get("area") not in ALLOWED_AREAS:
        return False
    if intent.get("domain") not in ALLOWED_DOMAINS:
        return False
    return True
```

If validation fails:
- Do nothing
- Ask user to repeat

---

## 9. Action Dispatcher

Maps validated intents to explicit handlers.

### Example
```
def dispatch(intent):
    match intent["intent"]:
        case "turn_on":
            devices.turn_on(intent["domain"], intent["area"])
        case "turn_off":
            devices.turn_off(intent["domain"], intent["area"])
        case "set_level":
            devices.set_level(
                intent["domain"],
                intent["area"],
                intent["value"]
            )
```

This layer contains **no LLM logic**.

---

## 10. Device Adapter Layer

You implement adapters per technology.

Possible backends:
- MQTT
- Zigbee2MQTT
- Z-Wave JS
- Matter
- REST APIs
- GPIO

Example abstraction:
```
class Light:
    def on(self): ...
    def off(self): ...
    def set_level(self, pct): ...
```

### TinyTuya MQTT Gateway

TinyTuya is a lightweight Python library that exposes Tuya‑based smart devices over MQTT.  It can be used as a bridge between the voice assistant and Tuya devices.

#### Installation
```bash
python -m pip install tinytuya
```

#### Basic Usage
```python
import tinytuya

# Create a device instance (replace with your device ID, key, and local IP)
device = tinytuya.OutletDevice('device_id', '192.168.1.50', 'device_key')

# Turn the outlet on
device.turn_on()

# Turn the outlet off
device.turn_off()
```

The library automatically publishes MQTT messages to the local network.  You can integrate it into the **Device Adapter Layer** by wrapping the TinyTuya calls in your own adapter classes.

---

## 11. Optional Text-to-Speech

Used **only for confirmation**.

Recommended:
- Piper TTS
- Coqui TTS

Example responses:
- "Kitchen lights on"
- "Bedroom fan off"

No conversational output.

---

## 12. Latency Expectations (Pi 5)

| Stage | Time |
|-----|-----|
| Wake word | Always-on |
| STT | 400–600 ms |
| LLM (Hailo) | ~350 ms |
| Validation + dispatch | <50 ms |
| **Total** | **~1–1.3 s** |

---

## 13. Design Rules (Hard Constraints)

- LLM does **intent only**
- JSON or reject
- No autonomous logic
- No conditional reasoning
- No device discovery by LLM

This is a **control system**, not a chatbot.

---

## 14. Recommended Defaults

- Model: `qwen2:1.5b`
- Max context: 2048
- Short prompts only
- Single command per wake word

---

## 15. Next Extensions (Optional)

- Confidence scoring
- Multi-room disambiguation
- User profiles
- Physical button fallback
- Systemd services

---

This design is intentionally boring, fast, and safe.
That is why it works.