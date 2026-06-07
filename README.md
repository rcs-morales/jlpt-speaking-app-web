# 🗣️ JLPT Speaking Practice App

A web-based application designed to help Japanese language learners practice their speaking skills. Currently tailored for **JLPT N5** level practice, the app uses AI to evaluate pronunciation, vocabulary, and grammar in real-time.

**🌍 Live Demo**: [Play JLPT Speaking Practice App on Vercel](https://jlpt-speaking-app-web.vercel.app/) *(Add a Groq API key in settings for AI speech recognition and grading. ElevenLabs is optional for AI text-to-speech.)*

## ✨ Key Features

- **AI Speech Recognition**: Powered by Groq's Whisper API (`whisper-large-v3-turbo`) for incredibly fast and accurate Japanese speech-to-text, natively handling kanji and katakana.
- **Intelligent Grading**: Uses Llama 3 (via Groq) to grade your answers. It provides detailed feedback on grammar, particle usage, and vocabulary.
- **Adjustable Strictness**: Choose your JLPT level (N5, N4, N3). The AI dynamically adjusts its grading rules, forgiving common Speech-to-Text kanji homophone errors at lower levels.
- **Dual STT Modes**: Seamlessly toggle between AI (Groq Whisper) for maximum accuracy, or your browser's built-in Web Speech API for live text preview.
- **Dual TTS Modes**: Hear questions with the browser's built-in Japanese voice (free, instant) or **ElevenLabs** AI voices (ultra-realistic). AI TTS caches audio in `localStorage` to reduce API usage. Configure voice and playback speed in settings.
- **Furigana Support**: Automatically generates furigana readings for spoken kanji to help you review your transcripts.
- **Randomized Practice Sessions**: Questions are presented in a fresh, randomized order every time you start a new practice session.
- **Local Privacy**: No backend server required. Your API keys and imported Q&A databases are stored entirely in your browser's `localStorage`.

## 🚀 Getting Started

You can use the live deployed version on Vercel immediately, or run it locally. This is a client-side vanilla JavaScript app with no build step.

### Prerequisites

1. A modern web browser (Chrome or Edge recommended if using the browser's built-in Speech Recognition).
2. A free [Groq API Key](https://console.groq.com/keys) for AI speech recognition and grading.
3. *(Optional)* An [ElevenLabs API Key](https://elevenlabs.io/) if you want AI text-to-speech instead of the browser voice.

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

## 📖 How to Use

1. **Configure AI**: On the home screen, paste your Groq API key into the AI Settings section and click **Save Key**.
2. **Adjust settings**: Choose grading speed (balanced or fast Groq model), speech recognition engine, text-to-speech mode (browser or ElevenLabs), JLPT grading strictness, and—if using AI TTS—voice and speed.
3. **Import Data**: Import your Japanese Q&A database (JSON format).
4. **Practice**: Click **Start Practice!** The app speaks the question aloud, records your answer, and returns instant AI grading and feedback.

## 🏗️ Project Structure

| File | Role |
|------|------|
| `index.html` | Markup and settings UI |
| `script.js` | Practice flow, STT/TTS, grading, and `localStorage` |
| `style.css` | Layout and theme |

## 🗺️ Roadmap

- [x] N5 Speaking Practice Support
- [x] Advanced AI Grading (Groq)
- [x] High-accuracy AI Speech Recognition (Whisper)
- [x] Optional AI text-to-speech (ElevenLabs) with local audio cache
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

## 📄 License

This project is open-source and available for educational use.
