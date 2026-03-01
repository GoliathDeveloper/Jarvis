# Hailo-10H Local Voice Assistant (Home Assistant)

This document defines a **production-grade architecture** for a local, Alexa-like voice assistant using **Hailo-10H**, **Hailo-Ollama**, and **Home Assistant**.

The design prioritises:
- Low latency (<1s end-to-end)
- Deterministic behaviour
- Safety and guardrails
- No cloud dependency

---

## 1. High-Level Architecture

```
[ Microphone ]
      ↓
[ Wake Word Engine ]  (CPU)
      ↓
[ Speech-to-Text ]    (CPU / GPU)
      ↓
[ Intent LLM ]        (Hailo-10H via Hailo-Ollama)
      ↓
[ JSON Validation ]
      ↓
[ Home Assistant API ]
      ↓
[ Device Action ]
      ↓
[ Text-to-Speech ]    (Optional)
```

---

## 2. Component Breakdown

### 2.1 Wake Word Detection (CPU)
Always-on, ultra-low latency.

Recommended engines:
- OpenWakeWord
- Porcupine
- Mycroft Precise

Example wake phrases:
- "Hey Home"
- "Computer"
- "Jarvis"

> Wake word runs **outside** the LLM. The LLM is never always-listening.

---

### 2.2 Speech-to-Text (STT)

Recommended:
- **Whisper-Base** (local)

Notes:
- Run on CPU or GPU
- Hailo is currently not ideal for streaming STT
- Accuracy > speed for command capture

Expected latency:
- ~300–500 ms

---

### 2.3 Intent Parsing (Hailo-10H)

This is the **only** place an LLM is used.

### ✅ Recommended Model

```
qwen2:1.5b   (Qwen2-1.5B-Instruct)
```

Why:
- Fastest TTFT (~0.32s)
- High TPS (~8.18)
- Stable, deterministic behaviour
- Ideal for command & intent extraction

Avoid reasoning-heavy models (e.g. DeepSeek-R1) for device control.

---

## 3. Model Naming (Hailo-Ollama)

From your configuration:

```json
"models": [
  "deepseek_r1_distill_qwen:1.5b",
  "llama3.2:3b",
  "qwen2.5-coder:1.5b",
  "qwen2.5-instruct:1.5b",
  "qwen2:1.5b"
]
```

### Correct Choice for Voice Control

| Ollama Name | Actual Model | Use Case |
|-----------|-------------|--------|
| `qwen2:1.5b` | Qwen2-1.5B-Instruct | **Primary intent model (RECOMMENDED)** |
| `qwen2.5-instruct:1.5b` | Qwen2.5-1.5B-Instruct | Slightly slower, acceptable fallback |
| `qwen2.5-coder:1.5b` | Qwen2.5-Coder | Code only (not voice) |
| `deepseek_r1_distill_qwen:1.5b` | DeepSeek-R1 | Reasoning (too slow for HA) |
| `llama3.2:3b` | Llama 3.2 3B | Too slow, low TPS |

---

## 4. HARD GUARDRAILS (Critical)

The LLM must **only** output structured JSON.

### System Prompt (Intent Parser)

```
You are a home automation intent parser.

Rules:
- Output JSON only
- No explanations
- No markdown
- No extra text

Allowed intents:
- turn_on
- turn_off
- set_level
- set_temperature
- query_state

Allowed entities:
- light
- switch
- thermostat
- fan
- scene

If intent is unclear, return:
{
  "intent": "unknown"
}
```

### Example User Input

```
"Turn the kitchen lights to fifty percent"
```

### Required Output

```json
{
  "intent": "set_level",
  "entity": "light",
  "area": "kitchen",
  "value": 50
}
```

> Any output that is not valid JSON must be rejected.

---

## 5. Home Assistant Execution Layer

### Mapping Example

| Intent | HA Service |
|------|-----------|
| turn_on | `light.turn_on` |
| turn_off | `light.turn_off` |
| set_level | `light.turn_on` (brightness_pct) |
| set_temperature | `climate.set_temperature` |
| query_state | `state.get` |

### Example HA Call

```
light.turn_on
entity_id: light.kitchen
brightness_pct: 50
```

The LLM is **not involved** beyond intent parsing.

---

## 6. Text-to-Speech (Optional)

Use for confirmation feedback only.

Recommended:
- Piper TTS
- Coqui TTS
- Home Assistant built-in TTS

Example response:
```
"Kitchen lights set to 50 percent"
```

---

## 7. Latency Budget (Expected)

| Stage | Time |
|-----|-----|
| Wake word | Always-on |
| STT | 300–500 ms |
| Qwen2-1.5B (Hailo) | ~350 ms |
| HA API | ~100 ms |
| **Total** | **< 1 second** |

This will feel faster than Alexa or Google Assistant.

---

## 8. Deployment Notes

### Target Hardware (Corrected)

This system is designed to run on:

- **Raspberry Pi 5 (16 GB RAM)**
- **Hailo-10H** (M.2 or PCIe via adapter)
- **Raspberry Pi OS (Debian 13 – Trixie)**
- **Linux kernel 6.12**
- **HailoRT-CLI 5.1.1**

This is a **valid and intended deployment target** for Hailo-10H.

---

### What Runs Where (Pi 5)

| Component | Where it runs | Notes |
|---------|--------------|------|
| Wake word | Pi CPU | Lightweight, always-on |
| Speech-to-Text (Whisper-Base) | Pi CPU | Acceptable latency for commands |
| Intent LLM (Qwen2-1.5B) | **Hailo-10H** | Main accelerator workload |
| Home Assistant | Pi CPU | Native HA OS or container |
| TTS | Pi CPU | Piper / HA TTS |

---

### Performance Reality (Pi 5)

- End-to-end latency: **~1–1.3 seconds** (still Alexa-class)
- CPU load: moderate but stable
- Hailo offloads the heaviest compute (LLM)

---

### Avoid

- Windows hosts
- Nested VMs
- GPU-based pipelines (not available on Pi)

The Raspberry Pi 5 + Hailo-10H is the **correct production platform** for this design.

---

## 9. Design Principles (Non-Negotiable)

- LLM does **intent**, not logic
- Home Assistant does **automation**, not LLM
- JSON or reject
- Fast > clever
- Deterministic > conversational

---

## 10. Default Recommendation

**Primary model:**
```
qwen2:1.5b
```

**Fallback model:**
```
qwen2.5-instruct:1.5b
```

---

If you want next:
- Docker Compose stack
- HA intent schema YAML
- Failure handling flows
- Multi-room disambiguation logic

Say which one and I’ll extend this doc.

