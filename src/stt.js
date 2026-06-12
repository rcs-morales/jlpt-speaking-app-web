import { setStatus, showTranscript, showBtn } from './ui.js';
import { hasGroqApiKey } from './ai.js';

let recog = null;
let listening = false;
let liveTranscript = '';
let finalTranscript = '';
let intentionalStop = false;
let micStream = null;
let mediaRecorder = null;
let audioChunks = [];

export function isSpeechRecognitionSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function abortRecognition() {
  intentionalStop = true;
  listening = false;
  if (recog) {
    try { recog.abort(); } catch (e) {}
  }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try { mediaRecorder.stop(); } catch (e) {}
  }
}

export function initRecognizer() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return false;
  recog = new SpeechRecognition();
  recog.lang            = 'ja-JP';
  recog.continuous      = true;
  recog.interimResults  = true;
  recog.maxAlternatives = 5;
  return true;
}

export function startListening(onError, formatLiveTranscript) {
  if (!recog) {
    onError('SpeechRecognition not supported in this browser. Use Chrome.');
    return;
  }
  liveTranscript = '';
  finalTranscript = '';
  intentionalStop = false;

  recog.onstart = () => {
    listening = true;
    setStatus('listening', '🎤 Recording… click Submit or Re-record when done');
    showTranscript(formatLiveTranscript(liveTranscript) || '', true);
    showBtn('btn-submit', true);
    showBtn('btn-rerecord', true);
    showBtn('btn-skip', false);
  };
  
  recog.onend = () => {
    if (!intentionalStop) {
      // Browser stopped listening due to silence. Save what we have and restart.
      finalTranscript = liveTranscript;
      try { 
        recog.start(); 
      } catch(e) { 
        listening = false; 
      }
    } else {
      listening = false;
      const isSubmitting = window.isChecking === true;
      if (liveTranscript && document.getElementById('btn-next')?.classList.contains('hidden') && !isSubmitting) {
        showBtn('btn-submit', true);
        showBtn('btn-rerecord', true);
      }
    }
  };
  
  recog.onresult = (e) => {
    let accumulated = '';
    let interimRaw  = '';
    for (let i = 0; i < e.results.length; i++) {
      if (e.results[i].isFinal) accumulated += e.results[i][0].transcript;
      else                      interimRaw  += e.results[i][0].transcript;
    }

    const transcript = finalTranscript + accumulated + interimRaw;
    liveTranscript = transcript;
    showTranscript(formatLiveTranscript(transcript), true);
  };
  
  recog.onerror = (e) => {
    if (e.error === 'no-speech') return; // Ignore silence errors, onend will restart it
    
    // Some browsers use 'aborted' when we call recog.abort(). 
    if (e.error === 'aborted') return;

    intentionalStop = true; // Stop restarting if there's a real error
    listening = false;
    const msg = e.error === 'not-allowed'
      ? 'Microphone permission denied.'
      : 'Recognition error: ' + e.error;
    onError(msg);
  };

  try {
    recog.start();
  } catch(e) {}
}

export function startAIRecording(onError) {
  if (!micStream) {
    onError('Microphone not available.');
    return;
  }
  if (!hasGroqApiKey()) {
    onError('AI Whisper requires a Groq API key. Save your key in settings, or use Browser speech recognition.');
    return;
  }

  liveTranscript = '';
  audioChunks = [];

  const preferredMimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : '';

  try {
    mediaRecorder = preferredMimeType
      ? new MediaRecorder(micStream, {
          mimeType: preferredMimeType,
          audioBitsPerSecond: 64000
        })
      : new MediaRecorder(micStream);
  } catch (e) {
    onError('MediaRecorder not supported: ' + e.message);
    return;
  }

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) audioChunks.push(e.data);
  };

  mediaRecorder.onstart = () => {
    listening = true;
    setStatus('listening', '🤖 AI Recording… speak clearly then click Submit');

    const ct = document.getElementById('transcript-content');
    const ph = document.getElementById('transcript-placeholder');
    const box = document.getElementById('transcript-box');
    if (ph) ph.classList.add('hidden');
    if (ct) {
      ct.classList.remove('hidden');
      ct.innerHTML = '<div class="ai-recording-indicator"><div class="rec-dot"></div>Recording audio for AI transcription...</div>';
    }
    if (box) box.classList.add('active');

    showBtn('btn-submit', true);
    showBtn('btn-rerecord', true);
    showBtn('btn-skip', false);
  };

  mediaRecorder.onerror = (e) => {
    listening = false;
    onError('Recording error: ' + e.error);
  };

  mediaRecorder.start(250);
}

export function stopAIRecording() {
  return new Promise((resolve) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      resolve(null);
      return;
    }

    mediaRecorder.onstop = () => {
      listening = false;
      const mimeType = (mediaRecorder.mimeType || 'audio/webm').split(';')[0].trim();
      const blob = new Blob(audioChunks, { type: mimeType });
      resolve(blob);
    };

    try {
      mediaRecorder.stop();
    } catch (e) {
      resolve(null);
    }
  });
}

export function getLiveTranscript() {
  return liveTranscript;
}

export function setLiveTranscript(val) {
  liveTranscript = val;
}

export function getMicStream() {
  return micStream;
}

export function setMicStream(stream) {
  micStream = stream;
}

export function releaseMic() {
  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
    micStream = null;
  }
}
