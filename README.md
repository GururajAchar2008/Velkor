# Velkor AI

Velkor AI is a browser-based AI assistant. It lets users chat with an AI that is automatically routed across multiple engines (NVIDIA NIM primary, OpenRouter fallback, optional OpenAI premium), upload files for document-aware answers, set custom system prompts, and use voice typing.

## What It Does

- AI chat with clean Markdown responses, math (KaTeX), diagrams (Mermaid), and code highlighting
- Multi-engine routing handled by the backend: NVIDIA NIM first, then OpenRouter, then OpenAI premium
- Per-response engine info: provider, model, fallback indicator, response time, and token count
- Document-aware answers via file uploads (PDF, Word, Excel, PowerPoint, images, code, archives)
- Automatic live web search for current or time-sensitive questions
- Custom system prompt support
- Voice typing support
- Copyable messages and rich Markdown rendering
- PWA support through a web manifest and service worker
- Light and dark themes

## How It Is Built

Velkor AI is built as a two-part application:

### Frontend

The user interface is a React app powered by Vite. It handles the chat experience, Markdown rendering, file attachments, system prompt settings, and browser storage for chat history and preferences.

### Backend

The backend is a Flask application. It sends requests through a smart provider router (NVIDIA NIM -> OpenRouter -> OpenAI), parses uploaded documents into AI context, and adds live web search context when a query needs current information.

## Technologies Used

### Frontend

- React 19
- Vite
- Tailwind CSS
- React Markdown
- remark-gfm / remark-math / rehype-katex
- react-syntax-highlighter
- mermaid
- framer-motion

### Backend

- Python 3
- Flask
- Flask-CORS
- requests
- python-dotenv

### AI and Search Services

- NVIDIA NIM for primary completions
- OpenRouter for low-cost fallback
- OpenAI for optional premium completions
- Serper for live web search context

### Browser Features

- localStorage for saving chat history, theme, and system prompt
- Service worker for offline/PWA behavior
- Web manifest for installable app support

## Main Project Structure

- `src/` contains the React frontend
- `src/components/` contains the chat, settings, markdown, and UI helper components
- `src/utils/api.js` contains the backend API helpers
- `src/config.js` contains the backend endpoint and shared constants
- `backend/` contains the Flask API and RAG/search logic
- `public/manifest.json` and `public/sw.js` provide PWA support

## Build Flow

1. The React frontend runs in Vite and renders the chat screen.
2. On load it checks the backend health endpoint and loads the configured AI engines.
3. Chat messages are sent to `POST /api/chat`; attached files are included as multipart in the same request.
4. The backend routes the prompt through its provider chain and returns the reply along with provider, model, fallback, response-time, and token metadata.
5. The answer is rendered with Markdown, math, diagrams, and code highlighting.

## Notes

- The frontend talks to the backend at `https://velkorbackend.onrender.com` (configurable in `src/config.js`).
- The app branding in the UI is Velkor AI, while some package metadata still uses the older GuruJI name.
- The frontend base path is configured for deployment under `/Velkor/`.
