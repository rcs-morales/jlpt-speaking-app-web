# JLPT Speaking Practice App Codebase Context

## Overview
A client-side vanilla JavaScript web application for practicing Japanese speaking skills. It evaluates pronunciation, vocabulary, and grammar using AI (Groq API).

## Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6 Modules). No build tools or bundlers are used.
- **AI Models**: Groq API integration for Speech-to-Text (`whisper-large-v3-turbo`) and LLM grading (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`).
- **Avatar**: Hybrid system using Live2D Cubism Web SDK via `pixi-live2d-display` (for browser TTS) and static PNG portraits with CSS animations (for Voicevox).
- **APIs**: Web Speech API for fallback STT and browser-native TTS.
- **Cloud TTS**: Integration with the free community `api.tts.quest` for high-quality VOICEVOX Japanese voices without a local server.

## Architecture & Modules
The logic is cleanly separated into feature-based ES6 modules:

- **`index.html` / `style.css`**: Main layout, UI structure, and styling. Single-page application approach toggling view screens.
- **`app.js`**: Main entry point. Handles global state management (`QA` array, score, current question), coordinates file imports, UI flow transitions, and ties modules together.
- **`ai.js`**: Manages all interactions with the Groq API. Contains the prompt engineering logic for JLPT-level assessment and Whisper transcription calls. Includes a local offline grading fallback.
- **`avatar.js`**: Initializes the hybrid avatar system. Uses PixiJS to load Live2D models (Chitose or Simple) for browser TTS, and switches to a DOM-based static PNG portrait system for Voicevox.
- **`stt.js` (Speech-to-Text)**: Manages microphone permissions, browser Web Speech API `SpeechRecognition` (for live preview/fallback), and `MediaRecorder` for capturing raw audio blobs to send to Whisper.
- **`tts.js` (Text-to-Speech)**: Manages voice output, either using browser native `SpeechSynthesis` voices or fetching audio blobs from `api.tts.quest` for VOICEVOX.
- **`parser.js`**: Utility for parsing user-imported Q&A datasets (JSON, CSV, Excel/XLSX). Includes a lightweight fuzzy furigana parser.
- **`ui.js`**: Helper methods for updating the DOM (e.g., status badges, transcript text, UI elements visibility).
- **`data.js`**: Contains the default/fallback Q&A dataset.

## Key Mechanisms
- **State Storage**: Uses browser `localStorage` extensively to save API keys, application settings (STT/TTS mode, JLPT level), and custom imported Q&A databases. The app operates with 0 backend dependencies.
- **Grading Engine**: When using AI, Llama 3 grades user speech. It provides detailed grammar, particle, and vocabulary notes. Strictness logic can be configured based on the JLPT level (N5, N4, N3) to handle STT homophones.
- **Deployment**: Can be served via any basic HTTP server (e.g., Python `http.server` or Vercel static hosting).
