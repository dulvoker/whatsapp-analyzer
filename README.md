# whatsapp-analyzer

A local, privacy-first tool for analyzing WhatsApp chat exports. Upload a `.txt` export, get instant stats and charts — no data ever leaves your machine.

```
// whatsapp chat analysis
Dulat & Nursultan Sabitov
01/07/2023 → 26/02/2026
```

---

## Features

- **Message stats** — total messages, words, words/message ratio
- **Who writes more** — per-participant message count and percentage bars
- **Call stats** — voice and video call counts, total duration, missed calls per person
- **Activity heatmaps** — messages by hour of day and day of week
- **Messages over time** — full daily activity timeline with peak day highlighted
- **Top words** — word cloud of most-used words (stopwords + participant names excluded)
- **Top emojis** — most-used emoji breakdown

---

## Stack

| Layer    | Tech                              |
|----------|-----------------------------------|
| Backend  | Python · FastAPI · pandas         |
| Frontend | React 18 · Vite · Chart.js        |
| Infra    | Docker Compose                    |

---

## Running locally

### With Docker (recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

### Without Docker

**Backend**
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## How to export a WhatsApp chat

1. Open a chat in WhatsApp (mobile)
2. Tap the contact/group name → **Export chat** → **Without media**
3. Save the `.txt` file and upload it to the app

Both **Android** and **iOS** export formats are supported.

---

## Privacy

Everything runs locally. The `.txt` file is sent only to the FastAPI backend running on your own machine — it is never stored to disk and is discarded after the response is returned.

---

## Project structure

```
whatsapp-analyzer/
├── backend/
│   ├── main.py           # FastAPI app — POST /upload endpoint
│   ├── chat_parser.py    # Regex parser for Android & iOS export formats
│   ├── analytics.py      # pandas aggregations → JSON response
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Dashboard.jsx   # Charts & stats grid
│   │   │   └── UploadPage.jsx  # Drag-and-drop upload
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── docker-compose.yml
```
