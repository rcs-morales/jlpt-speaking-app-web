# 🗣️ JLPT Speaking Practice App

A web-based application designed to help Japanese language learners practice their speaking skills. Currently tailored for **JLPT N5** level practice, the app uses AI to evaluate pronunciation, vocabulary, and grammar in real-time.

**🌍 Live Demo**: [Play JLPT Speaking Practice App on Vercel](https://jlpt-speaking-app-web.vercel.app/) *(Add a Groq API key in settings for AI speech recognition and grading. VOICEVOX is optional for local AI text-to-speech.)*

## ✨ Key Features

- **AI Speech Recognition**: Powered by Groq's Whisper API (`whisper-large-v3-turbo`) for incredibly fast and accurate Japanese speech-to-text, natively handling kanji and katakana.
- **Intelligent Grading**: Uses Llama 3 (via Groq) to grade your answers. It provides detailed feedback on grammar, particle usage, vocabulary, and—when AI is unavailable—local fallback scoring with particle/conjugation penalties.
- **Adjustable Strictness**: Choose your JLPT level (N5, N4, N3). The AI dynamically adjusts its grading rules, forgiving common Speech-to-Text kanji homophone errors at lower levels.
- **Dual STT Modes**: Seamlessly toggle between AI (Groq Whisper) for maximum accuracy, or your browser's built-in Web Speech API for live text preview.
- **Dual TTS Modes**: Hear questions with the browser's built-in Japanese voice (free, instant) or **Cloud VOICEVOX** (via api.tts.quest) for high-quality anime voices. Configure voice in settings.
- **Hybrid Avatar System**: A Live2D avatar (Chitose or Simple) provides visual engagement and lip-syncing for browser TTS. When using Voicevox, the app seamlessly switches to high-quality static character portraits with CSS bounce animations to match the voice.
- **Furigana Support**: Automatically generates furigana readings for spoken kanji to help you review your transcripts.
- **Tutorial Mode**: The first few questions display the target answer and romaji to help beginners practice with guided prompts.
- **Randomized Practice Sessions**: Questions are presented in a fresh, randomized order every time you start a new practice session.
- **Starter Q&A Included**: First-time users get a 10-question sample set so the app is usable immediately without importing data.
- **Local Privacy**: No backend server required. Your API keys and imported Q&A databases are stored entirely in your browser's `localStorage`.

## 🚀 Getting Started

You can use the live deployed version on Vercel immediately, or run it locally. This is a client-side vanilla JavaScript app with no build step.

### Prerequisites

1. A modern web browser. Chrome or Edge is required for the live voice-recognition workflow in this app.
2. A free [Groq API Key](https://console.groq.com/keys) for AI speech recognition and grading.
3. *(Optional)* Select VOICEVOX in the settings to automatically use the free community `api.tts.quest` service for cloud-based TTS. No setup required!
4. *(Optional - For Faster TTS)* If you find the cloud Voicevox service too slow, you can download and install [VOICEVOX](https://voicevox.hiroshiba.jp/) on your computer. Running it locally provides instant audio generation without relying on community servers.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rcs-morales/jlpt-speaking-app-web.git
   ```
2. Navigate to the project folder:
   ```bash
   cd jlpt-speaking-app-web
   ```
3. Serve the directory using any local web server. For example, using Python:
   ```bash
   python -m http.server 8000
   ```
4. Open `http://localhost:8000` in your browser.
5. If you are setting up Groq for the first time, use the in-app setup guide link or open `groq-guide.html` for the recommended configuration steps.

## 📖 How to Use

1. **Configure AI**: On the home screen, paste your Groq API key into the AI Settings section and click **Save Key**.
2. **Adjust settings**: Choose grading speed (balanced or fast Groq model), speech recognition engine, text-to-speech mode (browser or VOICEVOX), JLPT grading strictness, and voice.
3. *(Optional)* **Local Voicevox Setup**: If you installed Voicevox locally for faster audio, open `src/tts.js` and change `const VOICEVOX_API = 'https://api.tts.quest/v3/voicevox/synthesis';` to `const VOICEVOX_API = 'http://localhost:50021/synthesis';` (or similar depending on your local API routing).
4. **Use the setup guide if needed**: If Groq or Whisper setup is unclear, open the included guide page (`groq-guide.html`) for the recommended flow.
5. **Import Data**: Import your Japanese Q&A database (JSON format).
6. **Practice**: Click **Start Practice!** The app speaks the question aloud, records your answer, and returns instant AI grading and feedback.

## 🏗️ Project Structure

The codebase is built with vanilla JavaScript using ES6 Modules:

| File | Role |
|------|------|
| `index.html` | Markup, settings UI, and tutorial answer display |
| `style.css` | Layout, theme, and UI component styling |
| `app.js` | Main entry point; coordinates state, practice flow, and module integration |
| `ai.js` | Groq API integration (Llama 3 grading & Whisper STT) |
| `stt.js` | Speech-to-Text logic (Web Speech API & audio recording for Whisper) |
| `tts.js` | Text-to-Speech logic (Browser built-in & VOICEVOX) |
| `avatar.js` | Hybrid avatar system: manages PixiJS Live2D models (Chitose) and static portrait switching for Voicevox |
| `parser.js` | File parsing (JSON, CSV, Excel) and fuzzy furigana conversion |
| `ui.js` | DOM manipulation and UI state updates |
| `data.js` | Default starter Q&A dataset |
| `groq-guide.html` | Recommended Groq setup and key configuration guide |

## 🗺️ Roadmap

- [x] N5 Speaking Practice Support
- [x] Advanced AI Grading (Groq)
- [x] High-accuracy AI Speech Recognition (Whisper)
- [x] Cloud AI text-to-speech (VOICEVOX via api.tts.quest)
- [x] Hybrid Avatar system (Live2D + Static Portraits)
- [x] Randomized Question Order per Session
- [ ] Add N4 & N3 Q&A Databases
- [ ] Mobile-responsive UI improvements

## 🤔 Why Groq only?

OpenRouter’s free routing was removed because grading felt noticeably slow. For this app, **Groq** is the best fit today: one key powers fast **Llama 3** grading, **JSON** responses, and **Whisper** STT in the browser.

Other options (not built in yet):

| Option | Pros | Cons for this app |
|--------|------|-------------------|
| **Hugging Face Inference** ([tokens](https://huggingface.co/settings/tokens)) | Many open models; free tier; OpenAI-compatible API | Cold starts on free tier; variable latency; CORS/key exposure in pure client apps |
| **Ollama / llama.cpp (local)** | Private, no cloud quota | Requires a local server; not suitable for the hosted Vercel demo without extra setup |
| **Smaller Groq model** | Faster checks — optional **Fast** mode in settings (`llama-3.1-8b-instant`) | Slightly less nuanced Japanese feedback |

If you want a second provider later, Hugging Face’s router (`https://router.huggingface.co/v1`) is the most practical open-source-friendly choice—ideally behind a small backend proxy so API keys are not exposed in the browser.

## 📄 License & Credits

This project is open-source and available for educational use.

**Live2D Avatar Credits**:
This app uses a sample model provided by **Live2D Inc.** The use of these materials is governed by the [Free Material License Agreement](https://www.live2d.com/en/sdk/sample/) and the [Terms of Use for Live2D Cubism Sample Data](https://www.live2d.com/en/sdk/sample/). 

**VOICEVOX Audio Generation**:
Audio synthesis is powered by [VOICEVOX](https://voicevox.hiroshiba.jp/) and served through the free community API [api.tts.quest](https://tts.quest/). When using VOICEVOX characters (e.g., Zundamon, Shikoku Metan), please adhere to their respective character terms of service. 

