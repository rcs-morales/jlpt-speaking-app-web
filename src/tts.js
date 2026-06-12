import { setStatus } from './ui.js';
import { toggleSpeaking } from './avatar.js';

let currentAudio = null;
let currentAudioUrl = null;
const prefetchCache = {};
const inFlightVoicevoxRequests = new Map();

export function toggleTTSVoicePanels(mode) {
  const browserContainer = document.getElementById('browser-voice-container');
  const vvSettings = document.getElementById('voicevox-settings-section');
  const avatarSettings = document.getElementById('avatar-settings-section');

  if (browserContainer) browserContainer.style.display = (mode === 'browser') ? 'flex' : 'none';
  if (vvSettings) vvSettings.style.display = (mode === 'voicevox') ? 'block' : 'none';
  if (avatarSettings) avatarSettings.style.display = (mode === 'browser') ? 'block' : 'none';
}

export async function preloadVoicevoxAudio(text) {
  const speakerId = parseInt(localStorage.getItem('voicevox_speaker')) || 3;
  const cacheKey = `${speakerId}:${text}`;

  if (prefetchCache[cacheKey]) return prefetchCache[cacheKey];
  if (inFlightVoicevoxRequests.has(cacheKey)) return inFlightVoicevoxRequests.get(cacheKey);

  const promise = (async () => {
    try {
      const apiUrl = `https://api.tts.quest/v3/voicevox/synthesis?text=${encodeURIComponent(text)}&speaker=${speakerId}`;
      let res;
      res = await fetch(apiUrl);
      if (res.status === 429) {
        console.warn('TTS Quest API Rate Limited (429). Skipping retry to avoid repeated bursts.');
        return null;
      }
      if (!res.ok) throw new Error(`TTS Quest API failed: ${res.status}`);

      const data = await res.json();

      const statusUrl = data.audioStatusUrl;
      const audioUrl = data.wavDownloadUrl || data.mp3DownloadUrl;

      if (!statusUrl || !audioUrl) throw new Error("No download URL in response");

      while (true) {
        const statusRes = await fetch(statusUrl);
        const statusData = await statusRes.json();
        if (statusData.isAudioReady) break;
        if (statusData.isAudioError) throw new Error('Audio generation failed on server');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const audioRes = await fetch(audioUrl);
      if (!audioRes.ok) throw new Error('Failed to download audio blob');
      return await audioRes.blob();
    } catch (err) {
      console.error("Voicevox Prefetch failed:", err);
      return null;
    }
  })();

  inFlightVoicevoxRequests.set(cacheKey, promise);
  prefetchCache[cacheKey] = promise;
  try {
    return await promise;
  } finally {
    inFlightVoicevoxRequests.delete(cacheKey);
  }
}

function showVoicevoxLoading() {
  if (document.getElementById('vv-loading-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'vv-loading-overlay';
  overlay.className = 'vv-loading-overlay';
  overlay.innerHTML = `
    <div class="vv-loading-card">
      <div class="vv-spinner"></div>
      <h3>☁️ Loading Cloud Voice…</h3>
      <p>Preparing audio from Voicevox. This may take a few seconds.</p>
    </div>
  `;
  document.body.appendChild(overlay);
}

function hideVoicevoxLoading() {
  const overlay = document.getElementById('vv-loading-overlay');
  if (overlay) overlay.remove();
}

async function speakWithVoicevox(text, onEnd) {
  // Only show the loading overlay if the fetch takes longer than 2.5s
  const loadingTimer = setTimeout(() => showVoicevoxLoading(), 2500);
  try {
    const blob = await preloadVoicevoxAudio(text);
    clearTimeout(loadingTimer);
    hideVoicevoxLoading();
    if (!blob) throw new Error("Could not fetch Voicevox audio");

    if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = URL.createObjectURL(blob);
    currentAudio = new Audio(currentAudioUrl);

    const speed = parseFloat(localStorage.getItem('tts_speed') || '0.85');
    currentAudio.playbackRate = speed;

    currentAudio.onplay = () => {
      toggleSpeaking(true);
      setStatus('speaking', 'Speaking question…');
    };

    currentAudio.onended = () => {
      if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
      currentAudioUrl = null;
      currentAudio = null;
      if (onEnd) onEnd();
    };
    currentAudio.onerror = () => {
      if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
      currentAudioUrl = null;
      currentAudio = null;
      if (onEnd) onEnd();
    };
    currentAudio.play();
  } catch (err) {
    clearTimeout(loadingTimer);
    hideVoicevoxLoading();
    console.error('Voicevox TTS failed:', err);
    if (onEnd) onEnd();
  }
}

export function saveVoicevoxSpeaker() {
  const select = document.getElementById('voicevox-speaker-select');
  const input = document.getElementById('voicevox-speaker-input');
  if (select && select.value) {
    localStorage.setItem('voicevox_speaker', select.value);
    if (input) input.value = select.value;
  }
}

function speakWithBrowser(text, onEnd) {
  const synth = window.speechSynthesis;
  if (!synth) {
    if (onEnd) onEnd();
    return;
  }

  if (synth.speaking) synth.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'ja-JP';
  utter.rate = 0.85;
  utter.pitch = 1.0;

  const jpVoice = pickJapaneseBrowserVoice();
  if (jpVoice) utter.voice = jpVoice;

  utter.onstart = () => {
    toggleSpeaking(true);
  };
  utter.onend = onEnd;
  utter.onerror = onEnd;
  synth.speak(utter);
}

export function cancelCurrentSpeech() {
  const synth = window.speechSynthesis;
  if (synth && synth.speaking) synth.cancel();

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio = null;
  }

  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }

  try {
    toggleSpeaking(false);
  } catch (_) { }
}

export function speakQuestion(text, onEnd) {
  const mode = localStorage.getItem('tts_mode') || 'browser';
  setStatus('speaking', mode === 'voicevox' ? '☁️ Loading cloud voice...' : 'Speaking question…');

  const wrapOnEnd = () => {
    toggleSpeaking(false);
    if (onEnd) onEnd();
  };

  if (mode === 'voicevox') {
    speakWithVoicevox(text, wrapOnEnd);
    return;
  }

  speakWithBrowser(text, wrapOnEnd);
}

export function speakFeedback(text, onEnd) {
  setStatus('speaking', 'Speaking feedback…');
  const wrapOnEnd = () => {
    toggleSpeaking(false);
    if (onEnd) onEnd();
  };

  // Result feedback should use the configured Voicevox path only.
  const mode = localStorage.getItem('tts_mode') || 'browser';
  if (mode === 'voicevox') {
    speakWithVoicevox(text, wrapOnEnd);
    return;
  }

  // Browser TTS is kept only as a last-resort fallback for non-Voicevox sessions.
  speakWithBrowser(text, wrapOnEnd);
}

function getJapaneseVoices() {
  const synth = window.speechSynthesis;
  return synth ? synth.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith('ja')) : [];
}

function scoreJapaneseBrowserVoice(voice) {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  let score = lang === 'ja-jp' ? 20 : 10;
  
  const preferred = [
    'google 日本語', 'google japanese', 'haruka', 'nanami', 'ichiro', 'keita', 'ayumi',
    'kyoko', 'otoya', 'sakura', 'japanese', '日本語', 'microsoft',
  ];
  for (const hint of preferred) {
    if (name.includes(hint)) score += 15;
  }
  
  if (name.includes('english') || name.includes(' us ') || name.includes('uk ')) score -= 100;

  const avatarModel = localStorage.getItem('avatar_model') || 'simple';
  if (avatarModel === 'chitose') {
    if (name.includes('male') && !name.includes('female')) score += 50;
    if (name.includes('ichiro') || name.includes('keita')) score += 50;
    if (name.includes('female') || name.includes('haruka') || name.includes('nanami')) score -= 50;
  } else {
    if (name.includes('female')) score += 50;
    if (name.includes('haruka') || name.includes('nanami')) score += 50;
    if (name.includes('male') && !name.includes('female')) score -= 50;
  }

  return score;
}

function pickJapaneseBrowserVoice() {
  const voices = getJapaneseVoices();
  if (!voices.length) return null;

  const savedUri = localStorage.getItem('browser_tts_voice');
  if (savedUri) {
    const chosen = voices.find(v => v.voiceURI === savedUri);
    if (chosen) return chosen;
  }

  return voices.reduce((best, v) => {
    const score = scoreJapaneseBrowserVoice(v);
    const bestScore = best ? scoreJapaneseBrowserVoice(best) : -1;
    return score > bestScore ? v : best;
  }, null);
}

export function populateBrowserVoiceSelect() {
  const select = document.getElementById('browser-voice-select');
  if (!select) return;

  const synth = window.speechSynthesis;
  if (synth && !select.dataset.voicesBound) {
    synth.getVoices();
    synth.addEventListener('voiceschanged', populateBrowserVoiceSelect, { once: false });
    select.dataset.voicesBound = '1';
  }

  const savedUri = localStorage.getItem('browser_tts_voice') || '';
  const voices = getJapaneseVoices().sort((a, b) => {
    return scoreJapaneseBrowserVoice(b) - scoreJapaneseBrowserVoice(a);
  });

  select.replaceChildren();
  const autoOpt = document.createElement('option');
  autoOpt.value = '';
  autoOpt.textContent = 'Auto — best Japanese voice';
  select.appendChild(autoOpt);

  for (const v of voices) {
    const opt = document.createElement('option');
    opt.value = v.voiceURI;
    opt.textContent = v.name + ' (' + v.lang + ')';
    select.appendChild(opt);
  }

  if (savedUri && voices.some(v => v.voiceURI === savedUri)) {
    select.value = savedUri;
  } else {
    select.value = '';
  }
}
