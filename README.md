# 🗣️ JLPT Speaking Practice App

A web-based application designed to help Japanese language learners practice their speaking skills. Currently tailored for **JLPT N5** level practice, the app uses state-of-the-art AI to evaluate pronunciation, vocabulary, and grammar in real-time.

**🌍 Live Demo**: [Play JLPT Speaking Practice App on Vercel](https://jlpt-speaking-app-web.vercel.app/) *(Make sure to get a Groq API key to use the AI features!)*

## ✨ Key Features

- **AI Speech Recognition**: Powered by Groq's Whisper API (`whisper-large-v3-turbo`) for incredibly fast and accurate Japanese speech-to-text, natively handling kanji and katakana.
- **Intelligent Grading**: Uses Llama 3 (via Groq) to grade your answers. It provides detailed feedback on grammar, particle usage, and vocabulary.
- **Adjustable Strictness**: Choose your JLPT level (N5, N4, N3). The AI dynamically adjusts its grading rules, forgiving common Speech-to-Text kanji homophone errors at lower levels.
- **Dual STT Modes**: Seamlessly toggle between AI (Groq Whisper) for maximum accuracy, or your browser's built-in Web Speech API for live text preview.
- **Furigana Support**: Automatically generates furigana readings for spoken kanji to help you review your transcripts.
- **Local Privacy**: No backend server required. Your API keys and imported Q&A databases are stored entirely in your browser's `localStorage`.

## 🚀 Getting Started

You can use the live deployed version on Vercel immediately, or run it locally. Since this is a client-side vanilla JavaScript app, running it locally is incredibly simple.

### Prerequisites
1. A modern web browser (Chrome or Edge recommended if using the browser's built-in Speech Recognition).
2. A free [Groq API Key](https://console.groq.com/keys) to power the AI Speech Recognition and Grading.

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
2. **Adjust Settings**: Select your preferred Speech Recognition engine and JLPT Grading Strictness.
3. **Import Data**: Import your Japanese Q&A database (JSON format).
4. **Practice**: Click **Start Practice!** The app will speak the question aloud. Wait for the recording indicator, speak your answer in Japanese, and click **Submit** to receive instant AI grading and feedback.

## 🗺️ Roadmap

- [x] N5 Speaking Practice Support
- [x] Advanced AI Grading (Groq/OpenRouter)
- [x] High-accuracy AI Speech Recognition (Whisper)
- [ ] Add N4 & N3 Q&A Databases
- [ ] Mobile-responsive UI improvements
- [ ] Audio playback for expected answers

## 📄 License

This project is open-source and available for educational use.
