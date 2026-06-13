import { DEFAULT_QA } from './data.js';
import {
  parseJSON, parseCSV, parseExcel, ensureXLSXLoaded,
  formatLiveTranscript
} from './parser.js';
import {
  setStatus, showTranscript, showCheckedTranscript,
  showResult, showResultPanel, showBtn, updateQACount, updateStartButton,
  showImportStatus, showApiKeyStatus, toggleKeyVisibility
} from './ui.js';
import {
  getGradingModel, saveGradingModel, updateAIStatusChip,
  saveApiKeyFromInput, clearApiKey, hasGroqApiKey,
  testApiConnection, gradeWithAI, transcribeWithWhisper, isCorrectLocal
} from './ai.js';
import {
  initAvatar, clearAvatarMotionLoop, startAvatarMotionLoop,
  toggleSpeaking, getAvatarModelName, saveAvatarModel,
  getAvatarModelConfig
} from './avatar.js';
import {
  speakQuestion, speakFeedback, cancelCurrentSpeech,
  toggleTTSVoicePanels, saveVoicevoxSpeaker, preloadVoicevoxAudio
} from './tts.js';
import {
  initRecognizer, startListening, abortRecognition,
  startAIRecording, stopAIRecording, getLiveTranscript,
  setLiveTranscript, getMicStream, setMicStream, releaseMic
} from './stt.js';

// ─────────────────────────────────────────────
// GLOBAL EXPORTS (Immediate Registration)
// ─────────────────────────────────────────────


window.saveTTSMode = () => {
  const select = document.getElementById('tts-mode-select');
  if (select) {
    const mode = select.value;
    localStorage.setItem('tts_mode', mode);
    
    if (mode === 'voicevox') {
      localStorage.setItem('voicevox_speaker', '3');
      const vvSelect = document.getElementById('voicevox-speaker-select');
      if (vvSelect) vvSelect.value = '3';
    }
    
    toggleTTSVoicePanels(mode);
    initAvatar();
  }
};

window.saveSTTMode = () => {
  const select = document.getElementById('stt-mode-select');
  if (select) localStorage.setItem('stt_mode', select.value);
};

window.saveJLPTLevel = () => {
  const select = document.getElementById('jlpt-level-select');
  if (select) localStorage.setItem('jlpt_level', select.value);
};


window.saveGradingModel = saveGradingModel;
window.testApiConnection = testApiConnection;
window.saveApiKeyFromInput = saveApiKeyFromInput;
window.clearApiKey = clearApiKey;
window.toggleKeyVisibility = toggleKeyVisibility;
window.saveAvatarModel = saveAvatarModel;
window.initAvatar = initAvatar;
window.saveVoicevoxSpeaker = saveVoicevoxSpeaker;


// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let QA = [];
let current   = 0;
let score     = 0;
let results   = [];
let synth         = window.speechSynthesis;
let isChecking    = false;
window.isChecking = false;

// ─────────────────────────────────────────────
// FILE IMPORT
// ─────────────────────────────────────────────
async function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  const fileName = file.name.toLowerCase();
  const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

  reader.onload = async (e) => {
    try {
      let qa;

      if (isExcel) {
        await ensureXLSXLoaded();
        qa = parseExcel(e.target.result);
      } else {
        const content = e.target.result;
        if (fileName.endsWith('.json')) {
          qa = parseJSON(content);
        } else if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
          qa = parseCSV(content);
        } else {
          throw new Error('Unsupported file format. Use JSON, CSV, or Excel.');
        }
      }

      if (!Array.isArray(qa) || qa.length === 0) {
        throw new Error('No valid Q&A data found in file');
      }

      QA = qa;
      localStorage.setItem('jlpt_qa_data', JSON.stringify(qa));
      updateQACount(QA.length);
      updateStartButton(QA.length);
      showImportStatus('✅ Successfully imported ' + qa.length + ' question' + (qa.length !== 1 ? 's' : '') + ' from ' + file.name, 'success');
    } catch (error) {
      showImportStatus('❌ Import failed: ' + error.message, 'error');
    }
  };

  reader.onerror = () => {
    showImportStatus('❌ Error reading file', 'error');
  };

  if (isExcel) {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file);
  }

  event.target.value = '';
}

function clearDatabase() {
  localStorage.removeItem('jlpt_qa_data');
  QA = [];
  updateQACount(QA.length);
  updateStartButton(QA.length);
  showImportStatus('🗑 Database cleared. Import a Q&A file to begin practice.', 'info');
  document.getElementById('file-input').value = '';
}

// ─────────────────────────────────────────────
// FLOW
// ─────────────────────────────────────────────
function startPractice() {
  if (QA.length === 0) {
    alert('Please import a Q&A database before starting practice.');
    return;
  }
  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
    alert('Voice recognition requires Chrome or Microsoft Edge. Safari and Firefox are not supported.');
    return;
  }
  // Shuffle questions
  for (let i = QA.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [QA[i], QA[j]] = [QA[j], QA[i]];
  }
  current = 0; score = 0; results = [];
  document.getElementById('screen-start').classList.add('hidden');
  document.getElementById('screen-practice').classList.remove('hidden');

  initAvatar();

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      setMicStream(stream);
      if (!initRecognizer()) {
        setStatus('', 'SpeechRecognition not supported. Use Chrome.');
        return;
      }
      loadQuestion();
    })
    .catch(() => {
      initRecognizer();
      loadQuestion();
    });
}

async function loadQuestion() {
  const item = QA[current];
  const qText = document.getElementById('question-text');
  qText.textContent = item.q;
  qText.style.display = 'none';
  const toggleBtn = document.getElementById('btn-toggle-question');
  if (toggleBtn) {
    toggleBtn.textContent = '👁 Show Text';
    toggleBtn.classList.remove('highlight-pulse');
  }

  document.getElementById('result-badge').className = 'result-badge';
  document.getElementById('warning-box').style.display = 'none';
  showTranscript('');
  showBtn('btn-submit',   false);
  showBtn('btn-next',     false);
  showBtn('btn-rerecord', false);
  showBtn('btn-skip',     true);

  const targetBox = document.getElementById('target-answer-box');
  if (targetBox) {
    targetBox.style.display = 'none';
  }

  const pct = (current / QA.length) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('progress-label').textContent =
    'Question ' + (current + 1) + ' / ' + QA.length;

  cancelCurrentSpeech();
  setStatus('speaking', 'Preparing…');
  try {
    const { resetAvatarPose } = await import('./avatar.js?' + Date.now());
    resetAvatarPose();
  } catch (error) {
    console.warn('Avatar pose reset unavailable:', error);
  }

  if (synth.getVoices().length === 0) {
    synth.addEventListener('voiceschanged', () => speakThenListen(item), { once: true });
  } else {
    speakThenListen(item);
  }
}

function toggleQuestionText() {
  const qText = document.getElementById('question-text');
  const btn = document.getElementById('btn-toggle-question');
  if (!qText || !btn) return;

  btn.classList.remove('highlight-pulse');

  if (qText.style.display === 'none') {
    qText.style.display = 'block';
    btn.textContent = '👁 Hide Text';
  } else {
    qText.style.display = 'none';
    btn.textContent = '👁 Show Text';
  }
}

function speakThenListen(item) {
  speakQuestion(item.q, () => {
    setStatus('', 'Starting microphone…');
    setTimeout(() => beginListen(), 800);
  });
}

function beginListen() {
  const item = QA[current];
  const targetBox = document.getElementById('target-answer-box');
  if (targetBox) {
    if (item.r && current < 3) {
      const label = document.getElementById('target-label');
      if (label) label.textContent = '🎯 Tutorial Mode (' + (current + 1) + '/3) Please say the sample answer clearly:';
      document.getElementById('target-answer-text').textContent = item.a;
      document.getElementById('target-romaji-text').textContent = item.r;
      targetBox.style.display = 'block';
    } else if (current >= 3 && !hasGroqApiKey()) {
      const label = document.getElementById('target-label');
      if (label) {
        label.innerHTML = '⚠️ AI Grading Not Configured<br><span style="font-size:0.75rem; font-weight:normal; color:var(--teal);">Showing answer key. Enable AI grading in settings for flexible answers and feedback!</span>';
      }
      document.getElementById('target-answer-text').textContent = item.a;
      document.getElementById('target-romaji-text').textContent = item.r || '';
      targetBox.style.display = 'block';
    }
  }

  if (current < 3) {
    const toggleBtn = document.getElementById('btn-toggle-question');
    if (toggleBtn) toggleBtn.classList.add('highlight-pulse');
  }

  const sttMode = localStorage.getItem('stt_mode') || 'ai';
  const useWhisper = sttMode === 'ai' && hasGroqApiKey();

  if (useWhisper) {
    startAIRecording((err) => {
      setStatus('', 'Error: ' + err);
      if (err.includes('permission')) {
        document.getElementById('warning-box').style.display = 'block';
      }
      showBtn('btn-rerecord', true);
      showBtn('btn-skip',     true);
    });
  } else {
    if (sttMode === 'ai' && !hasGroqApiKey()) {
      setStatus('listening', '🌐 Browser recognition (save a Groq key for AI Whisper)');
    }
    startListening((err) => {
      setStatus('', 'Error: ' + err);
      if (err.includes('permission')) {
        document.getElementById('warning-box').style.display = 'block';
      }
      showBtn('btn-rerecord', true);
      showBtn('btn-skip',     true);
    }, formatLiveTranscript);
  }
}

async function finishRecording() {
  if (isChecking) return;
  isChecking = true;
  window.isChecking = true;

  showBtn('btn-submit', false);
  showBtn('btn-rerecord', false);
  showBtn('btn-skip', false);

  const sttMode = localStorage.getItem('stt_mode') || 'ai';
  const item = QA[current];

  if (sttMode === 'ai' && hasGroqApiKey()) {
    setStatus('checking', '🤖 Transcribing audio…');
    const ct = document.getElementById('transcript-content');
    if (ct) ct.innerHTML = '<div class="ai-transcribing-indicator">Transcribing<span class="dots"></span></div>';

    const audioBlob = await stopAIRecording();
    if (audioBlob) {
      showTranscript('Transcribing…', true);
      const transcript = await transcribeWithWhisper(audioBlob, item.a);
      if (transcript) {
        setLiveTranscript(transcript);
        showTranscript(transcript, true);
      } else {
        setLiveTranscript('');
        showTranscript('', false);
      }
    }
  } else {
    abortRecognition();
  }

  const raw = getLiveTranscript().trim();

  if (!raw || raw.startsWith('Transcribing')) {
    setStatus('', 'Transcription failed or no speech captured — try re-recording.');
    showBtn('btn-rerecord', true);
    showBtn('btn-skip',     true);
    isChecking = false;
    window.isChecking = false;
    return;
  }

  setStatus('', 'Transcript ready. Review it, then click Check Answer.');
  showBtn('btn-check', true);
  showBtn('btn-rerecord', true);
  showBtn('btn-skip', true);
  isChecking = false;
  window.isChecking = false;
}

async function checkAnswer() {
  if (isChecking) return;
  isChecking = true;
  window.isChecking = true;

  showBtn('btn-check', false);
  showBtn('btn-rerecord', false);
  showBtn('btn-skip', false);

  const item = QA[current];
  const raw = getLiveTranscript().trim();

  const level = localStorage.getItem('jlpt_level') || 'N5';
  const furiganaReading = await import('./parser.js').then(m =>
    level === 'N5' ? m.transcriptToFurigana(raw) : m.transcriptToFuriganaForGrading(raw, item.a)
  );
  showCheckedTranscript(raw, furiganaReading, formatLiveTranscript);

  setStatus('checking', '🤖 AI is checking your answer…');

  // Do not prefetch result feedback audio during grading; it creates unnecessary cloud TTS traffic.
  // The result audio will be prepared only after the answer has been graded.

  let gradeResult = await gradeWithAI(item.q, item.a, raw);
  if (!gradeResult) {
    setStatus('checking', '⚙️ AI unavailable — using local grading…');
    gradeResult = await isCorrectLocal(raw, item.a, item.q);
  }

  if (gradeResult.correct) score++;
  const feedbackText = gradeResult.correct ? '正解です！' : '不正解です。';
  results.push({
    q: item.q, a: item.a, transcript: raw, furigana: furiganaReading,
    correct: gradeResult.correct, gradeResult: gradeResult
  });

  showResultPanel(false);
  if (localStorage.getItem('tts_mode') === 'voicevox') {
    setStatus('checking', '🔄 Preparing result voice…');
    const blob = await preloadVoicevoxAudio(feedbackText);
    if (!blob) {
      setStatus('checking', '⚠️ Voice response unavailable — showing result without audio.');
    }
  }

  showResult(gradeResult, item.a);
  showResultPanel(true);
  cancelCurrentSpeech();
  setStatus('checking', '🔊 Speaking result feedback…');
  speakFeedback(feedbackText, () => {
    setStatus('', gradeResult.correct ? 'Correct! 🎉' : 'Incorrect. Review the feedback.');
  });
  showBtn('btn-next',     true);
  showBtn('btn-rerecord', false);
  showBtn('btn-check',    false);
  showBtn('btn-skip',     false);
  isChecking = false;
  window.isChecking = false;
}

function rerecordAnswer() {
  const item = QA[current];
  abortRecognition();
  setLiveTranscript('');
  document.getElementById('result-badge').className = 'result-badge';
  showTranscript('');
  showBtn('btn-next',     false);
  showBtn('btn-rerecord', false);
  showBtn('btn-submit',   false);
  showBtn('btn-check',    false);
  speakThenListen(item);
}

function nextQuestion() {
  cancelCurrentSpeech();
  current++;
  if (current >= QA.length) showResults();
  else loadQuestion();
}

function skipQuestion() {
  cancelCurrentSpeech();
  abortRecognition();
  results.push({ q: QA[current].q, a: QA[current].a, transcript: '(skipped)', correct: false });
  current++;
  if (current >= QA.length) showResults();
  else loadQuestion();
}

function endSession() {
  cancelCurrentSpeech();
  abortRecognition();
  releaseMic();
  while (results.length < QA.length) {
    const i = results.length;
    results.push({ q: QA[i].q, a: QA[i].a, transcript: '(not reached)', correct: false });
  }
  showResults();
}

function showResults() {
  if (synth.speaking) synth.cancel();
  document.getElementById('screen-practice').classList.add('hidden');
  const rs = document.getElementById('screen-results');
  if (rs) rs.style.display = 'block';

  const total = results.length;
  const pct   = total ? Math.round((score / total) * 100) : 0;

  document.getElementById('score-display').textContent = score + ' / ' + total;
  document.getElementById('score-bar').style.width = pct + '%';

  const msg = pct === 100 ? '🏆 Perfect score! Excellent work!' :
              pct >= 75   ? '✨ Great job! Almost there.' :
              pct >= 50   ? '👍 Good effort. Keep practicing!' :
                            '📚 Keep studying, you\'ll improve!';
  document.getElementById('score-message').textContent = msg;

  const list = document.getElementById('results-list');
  if (list) list.replaceChildren();
  results.forEach((r, i) => {
    const div = document.createElement('div');
    div.className = 'result-row ' + (r.correct ? 'c' : 'w');
    const tag = document.createElement('span');
    tag.className = 'tag ' + (r.correct ? 'tag-ok' : 'tag-ng');
    tag.textContent = (i + 1) + '. ' + (r.correct ? '✓ Correct' : '✗ Incorrect');
    const rq = document.createElement('div');
    rq.className = 'rq';
    rq.textContent = r.q;
    const ans = document.createElement('div');
    ans.className = r.correct ? 'rc' : 'rw';
    ans.textContent = 'Heard: ' + r.transcript;
    div.append(tag, rq, ans);
    const expected = document.createElement('div');
    expected.className = 'ra';
    expected.textContent = (r.correct ? '📝 Expected: ' : '✔ Expected: ') + r.a;
    div.appendChild(expected);
    if (r.gradeResult && r.gradeResult.feedback) {
      const fbDiv = document.createElement('div');
      fbDiv.className = 'ai-result-feedback';
      const src = r.gradeResult.source === 'gemini' ? '🤖' : '⚙️';
      fbDiv.textContent = src + ' ' + r.gradeResult.feedback;

      const gr = r.gradeResult;
      const noteTypes = [
        { label: 'Grammar', text: gr.grammarNotes },
        { label: 'Particles', text: gr.particleNotes },
        { label: 'Vocab', text: gr.vocabularyNotes },
      ];
      for (const nt of noteTypes) {
        if (nt.text && nt.text.toLowerCase() !== 'none' && nt.text.trim()) {
          const note = document.createElement('div');
          note.className = 'ai-note';
          const lbl = document.createElement('span');
          lbl.className = 'ai-note-label';
          lbl.textContent = nt.label;
          const txt = document.createElement('span');
          txt.className = 'ai-note-text';
          txt.textContent = nt.text;
          note.append(lbl, txt);
          fbDiv.appendChild(note);
        }
      }
      div.appendChild(fbDiv);
    }
    list.appendChild(div);
  });
}

function restartApp() {
  abortRecognition();
  releaseMic();
  document.getElementById('screen-results').style.display = 'none';
  document.getElementById('screen-start').classList.remove('hidden');
  document.getElementById('screen-practice').classList.add('hidden');
  updateQACount(QA.length);
  updateStartButton(QA.length);
}

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('file-input');
  if (fileInput) {
    fileInput.addEventListener('change', handleFileImport);
  }

  const savedQA = localStorage.getItem('jlpt_qa_data');
  if (savedQA) {
    try {
      const parsed = JSON.parse(savedQA);
      if (Array.isArray(parsed) && parsed.length > 0) {
        QA = parsed;
      }
    } catch (e) {
      console.error('Error loading saved QA data:', e);
    }
  } else {
    QA = DEFAULT_QA.slice(0, 10);
  }
  updateQACount(QA.length);
  updateStartButton(QA.length);

  const savedProvider = localStorage.getItem('api_provider');
  if (savedProvider && savedProvider !== 'groq') {
    localStorage.removeItem('api_provider');
    localStorage.removeItem('api_key');
    showApiKeyStatus('Previous provider removed. Please save a Groq API key (starts with gsk_).', 'info');
  }
  const savedKey = localStorage.getItem('api_key') || localStorage.getItem('gemini_api_key');
  if (savedKey) {
    const input = document.getElementById('api-key-input');
    if (input) input.value = savedKey;
    updateAIStatusChip();
  }

  const gradingModelSelect = document.getElementById('grading-model-select');
  if (gradingModelSelect) gradingModelSelect.value = getGradingModel();

  const savedSTTMode = localStorage.getItem('stt_mode') || 'ai';
  const sttSelect = document.getElementById('stt-mode-select');
  if (sttSelect) sttSelect.value = savedSTTMode;

  const savedJLPTLevel = localStorage.getItem('jlpt_level') || 'N5';
  const jlptSelect = document.getElementById('jlpt-level-select');
  if (jlptSelect) jlptSelect.value = savedJLPTLevel;

  const avatarModelSelect = document.getElementById('avatar-model-select');
  if (avatarModelSelect) avatarModelSelect.value = getAvatarModelName();

  const TTS_DEFAULT = 'browser';
  if (!localStorage.getItem('tts_default_browser_v1')) {
    localStorage.setItem('tts_mode', TTS_DEFAULT);
    localStorage.setItem('tts_default_browser_v1', '1');
  } else if (!localStorage.getItem('tts_mode')) {
    localStorage.setItem('tts_mode', TTS_DEFAULT);
  }
  const savedTTSMode = localStorage.getItem('tts_mode') || TTS_DEFAULT;
  const ttsSelect = document.getElementById('tts-mode-select');
  if (ttsSelect) {
    ttsSelect.value = savedTTSMode;
    toggleTTSVoicePanels(savedTTSMode);
  }

  const savedVvSpeaker = localStorage.getItem('voicevox_speaker') || '3';
  const vvSpeakerSelect = document.getElementById('voicevox-speaker-select');
  if (vvSpeakerSelect) {
    vvSpeakerSelect.value = savedVvSpeaker;
  }
});

// Export functions to window for HTML buttons
window.startPractice = startPractice;
window.toggleQuestionText = toggleQuestionText;
window.finishRecording = finishRecording;
window.checkAnswer = checkAnswer;
window.rerecordAnswer = rerecordAnswer;
window.nextQuestion = nextQuestion;
window.skipQuestion = skipQuestion;
window.endSession = endSession;
window.saveApiKeyFromInput = saveApiKeyFromInput;
window.saveGradingModel = saveGradingModel;
window.saveSTTMode = saveSTTMode;
window.saveJLPTLevel = saveJLPTLevel;
window.saveAvatarModel = saveAvatarModel;
window.saveTTSMode = saveTTSMode;
window.saveVoicevoxSpeaker = saveVoicevoxSpeaker;
window.restartApp = restartApp;
window.clearDatabase = clearDatabase;
