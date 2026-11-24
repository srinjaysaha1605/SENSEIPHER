<div align="center">

# SENSEIPHER

**Classical cipher analysis workspace for classifying cipher types, inspecting letter patterns, and reviewing ranked plaintext candidates.**

![React](https://img.shields.io/badge/React-19-050505?style=flat-square&logo=react&logoColor=f4f4f5&labelColor=18181b)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-050505?style=flat-square&logo=typescript&logoColor=f4f4f5&labelColor=18181b)
![Vite](https://img.shields.io/badge/Vite-SPA-050505?style=flat-square&logo=vite&logoColor=f4f4f5&labelColor=18181b)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-050505?style=flat-square&logo=tailwindcss&logoColor=f4f4f5&labelColor=18181b)
![FastAPI](https://img.shields.io/badge/Engine-FastAPI-050505?style=flat-square&logo=fastapi&logoColor=f4f4f5&labelColor=18181b)
![Vercel](https://img.shields.io/badge/Proxy-Vercel-050505?style=flat-square&logo=vercel&logoColor=f4f4f5&labelColor=18181b)

</div>

---

## What It Is

**Senseipher** is a monochrome, high-contrast web workspace for analyzing classical substitution and transposition ciphers. Built around a minimal black, white, and gray aesthetic, it pairs an interactive geometric entry gate with a focused two-column analysis workspace that communicates directly with the Senseipher solver backend.

All classifications, frequency tables, and candidate plaintexts come strictly from validated live API responses. Submitted ciphertexts, recovered plaintexts, and keys are kept solely in transient memory—never written to browser storage, telemetry, or console logs.

---

## How It Works

```text
  [ Optical Gate ] ──► [ Ciphertext Input ] ──► POST /api/analyze (Same-Origin Proxy)
                                                              │
                                                              ▼
  [ Clear Error State ] ◄── Malformed / Offline ── [ FastAPI Solver Engine ]
                                                              │
                                                        Valid JSON Response
                                                              ▼
                                                  [ Cipher Type Summary ]
                                                  [ Best Match & Alternatives ]
                                                  [ Metrics & Letter Counts ]
```

### 1. Entry Gate
Senseipher opens on an abstract geometric eye rendered in monochrome vector layers with slow counter-rotating rings. On desktop pointers, the iris tracks cursor movement smoothly using interpolated transforms while respecting `prefers-reduced-motion` and touch devices. Selecting the eye opens the workspace.

### 2. Scrambled Text Input
- Paste coded text into the sticky input column (collapsible on smaller viewports).
- A live counter tracks alphabetic letters (`A–Z`) while ignoring spaces, numbers, and symbols toward the **20-letter minimum**.
- Open **Advanced options** to adjust:
  - **Number of matches** (`1–10`, default `5`)
  - **Max key length** (`2–18`, default `18`)

### 3. Live Analysis & Error Handling
Submitting sends a `POST /api/analyze` request through a same-origin rewrite to the FastAPI backend.
- **Strict validation:** Responses must include a valid cipher classification, pattern summary, and attack payload; incomplete responses are rejected rather than padded with placeholder results.
- **Clean failure recovery:** Invalid inputs, empty matches, and network or service outages each display a dedicated, human-readable state while keeping your input text intact and clearing any stale prior results.

### 4. Reading the Results

| Section | What It Shows |
| :--- | :--- |
| **Likely cipher type** | Identifies the predicted cipher family (*Monoalphabetic Substitution*, *Polyalphabetic Substitution*, or *Transposition*) with a plain-language summary and collapsible **Technical details** showing relative ranking scores. |
| **Decoded matches** | Highlights the top-scoring **Best match** alongside its solving method, key, score, and one-click copy action, followed by expandable rows for **Other matches**. Outputs are ranked guesses—short or unusual texts may be harder to identify. |
| **Pattern summary strip** | Reports total letters, distinct letters, repeat index (IoC), letter spread (entropy), vowel share, repeated pairs, and the most frequent characters. |
| **Letter counts** | Full-width breakdown of observed count, percentage share, and relative frequency spread across every letter in the message. |
