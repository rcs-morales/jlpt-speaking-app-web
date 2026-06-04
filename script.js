// ─────────────────────────────────────────────
// Q&A DATA  (from QAdatabase.xlsx)
// ─────────────────────────────────────────────
const DEFAULT_QA = [
  { q: "まいにち　なんで　しごとへ　いきますか。",
    a: "でんしゃで　いきます。" },
  { q: "まいにち　だれと　しごとへ　いきますか。",
    a: "ひとりで　いきます。" },
  { q: "たんじょうびは　いつですか。",
    a: "たんじょうびは　くがつじゅうににちです。" },
  { q: "やすみのひ　になにを　しますか。",
    a: "イラストを　かきます。" },
  { q: "せんしゅうの　どようび　なにを　しましたか。それからは？",
    a: "えいがかんへ　いきました。それから　ともだちに　あいました。" },
  { q: "あなたは　まいにちどこで　ひるごはんを　たべますか。",
    a: "ともだちと　ちかくの　しょくどうで　たべます。" },
  { q: "あなたは　テニスを　しますか。いっしょに　いきませんか。",
    a: "ええ、そうしましょう。なんようびに　いきますか。" },
  { q: "まいあさ　なにを　たべますか。なにで　たべますか",
    a: "くだものと　やさいを　たべます。てで　たべます。" },
  { q: "「ありがとうございます」はじぶんの　げんごで　なんですか。",
    a: "ありがとうございますは　たがルゴごで　Salamat Poです。" },
  { q: "きょねんのたんじょうびに　かぞくに　なにを　もらいましたか。",
    a: "たんじょうびに　ちちに　シャツを　もらいました。そして　あねに　おかねを　もらいました。" },
  { q: "にほんごの　べんきょうは　もうおわりましたか。",
    a: "いいえ、まだです。ことしの　しちがつに　おわります。" },
  { q: "にほんは？",
    a: "にほんは　ゆうめいです。" },
  { q: "ふじさんは？",
    a: "ふじさんは　たかいです。" },
  { q: "ふじさんは　どうですか？",
    a: "ふじさんは　たかい　やまです。" },
  { q: "にほんは　どうですか？",
    a: "にほんは　べんりな　くにです。" },
  { q: "フィリピンの　ぶっかは　どうですか。",
    a: "フィリピンの　ぶっかは　あまり　やすくないです。" },
  { q: "まいにちの　せいかつは　どうですか。",
    a: "ちょっと　いそがしいですが、だいじょうぶです。" },
  { q: "あなたの　おとうさんは　どんなひとですか。",
    a: "ちちは　おもしろいです。そして　げんきな　ひとです。" },
  { q: "しつれいですが、あなたは　りょうがじょうずですか。",
    a: "わたしは　りょうりが　あまり　とくいではありませんが、ときどき　つくります。" },
];

let QA = [];

// ─────────────────────────────────────────────
// FILE IMPORT FUNCTIONALITY
// ─────────────────────────────────────────────

function updateQACount() {
  const count = QA.length;
  document.getElementById('qa-count-chip').textContent = count > 0
    ? '🗂 ' + count + ' Question' + (count !== 1 ? 's' : '')
    : '🗂 No Questions Loaded';
}

function updateStartButton() {
  const btn = document.getElementById('btn-start-practice');
  if (!btn) return;
  if (QA.length === 0) {
    btn.disabled = true;
    btn.textContent = '⏳ Import a Q&A database to begin';
    btn.classList.add('btn-disabled');
  } else {
    btn.disabled = false;
    btn.textContent = '▶ Start Practice';
    btn.classList.remove('btn-disabled');
  }
}

function showImportStatus(message, type) {
  const statusDiv = document.getElementById('import-status');
  statusDiv.textContent = message;
  statusDiv.className = 'import-status ' + type;
  if (type !== 'info') {
    setTimeout(() => {
      statusDiv.className = 'import-status';
    }, 5000);
  }
}

function parseJSON(content) {
  try {
    const data = JSON.parse(content);
    if (!Array.isArray(data)) {
      throw new Error('JSON must be an array of objects');
    }
    if (data.length === 0) {
      throw new Error('JSON array cannot be empty');
    }

    const qa = data.map(item => {
      if (typeof item !== 'object' || item === null) {
        throw new Error('Each item must be an object');
      }
      const q = item.q || item.question || item.Q || item.Question;
      const a = item.a || item.answer || item.A || item.Answer;

      if (!q || !a) {
        throw new Error('Each item must have "q"/"question" and "a"/"answer" fields');
      }

      return { q: String(q).trim(), a: String(a).trim() };
    });

    return qa;
  } catch (e) {
    throw new Error('JSON parse error: ' + e.message);
  }
}

function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least 2 rows (header + 1 data row)');
  }

  function parseCSVLine(line) {
    return line.split(',').map(field => field.trim());
  }

  const headerLine = parseCSVLine(lines[0]);
  if (headerLine.length < 2) {
    throw new Error('CSV must have at least 2 columns');
  }

  let qIdx = 0, aIdx = 1;
  const header = headerLine.map(h => h.toLowerCase());

  const qHeaders = ['q', 'question', 'ques', 'prompt'];
  const aHeaders = ['a', 'answer', 'ans', 'response'];

  for (let i = 0; i < header.length; i++) {
    if (qHeaders.includes(header[i])) qIdx = i;
    if (aHeaders.includes(header[i])) aIdx = i;
  }

  const qa = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length > Math.max(qIdx, aIdx)) {
      const q = fields[qIdx].trim();
      const a = fields[aIdx].trim();
      if (q && a) {
        qa.push({ q, a });
      }
    }
  }

  if (qa.length === 0) {
    throw new Error('No valid Q&A pairs found in CSV');
  }

  return qa;
}

function parseExcel(arrayBuffer) {
  try {
    if (typeof XLSX === 'undefined') {
      throw new Error('Excel library is still loading. Please wait a moment and try again.');
    }

    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    if (!workbook.SheetNames.length) {
      throw new Error('Excel file is empty');
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length < 2) {
      throw new Error('Excel sheet must have at least 2 rows (header + 1 data row)');
    }

    const headerLine = data[0];
    if (headerLine.length < 2) {
      throw new Error('Excel sheet must have at least 2 columns');
    }

    let qIdx = 0, aIdx = 1;
    const header = headerLine.map(h => String(h || '').toLowerCase().trim());

    const qHeaders = ['q', 'question', 'ques', 'prompt'];
    const aHeaders = ['a', 'answer', 'ans', 'response'];

    for (let i = 0; i < header.length; i++) {
      if (qHeaders.includes(header[i])) qIdx = i;
      if (aHeaders.includes(header[i])) aIdx = i;
    }

    const qa = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.length > Math.max(qIdx, aIdx)) {
        const q = String(row[qIdx] || '').trim();
        const a = String(row[aIdx] || '').trim();
        if (q && a) {
          qa.push({ q, a });
        }
      }
    }

    if (qa.length === 0) {
      throw new Error('No valid Q&A pairs found in Excel sheet');
    }

    return qa;
  } catch (e) {
    throw new Error('Excel parse error: ' + e.message);
  }
}

function ensureXLSXLoaded() {
  return new Promise((resolve) => {
    if (typeof XLSX !== 'undefined') {
      resolve();
    } else {
      const checkInterval = setInterval(() => {
        if (typeof XLSX !== 'undefined') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 5000);
    }
  });
}

function handleFileImport(event) {
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
      updateQACount();
      updateStartButton();
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
  updateQACount();
  updateStartButton();
  showImportStatus('🗑 Database cleared. Import a Q&A file to begin practice.', 'info');
  document.getElementById('file-input').value = '';
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
  }
  updateQACount();
  updateStartButton();

  // Load saved API key
  const savedKey = localStorage.getItem('api_key') || localStorage.getItem('gemini_api_key');
  const savedProvider = localStorage.getItem('api_provider') || 'groq';
  if (savedKey) {
    const input = document.getElementById('api-key-input');
    if (input) input.value = savedKey;
    const providerSelect = document.getElementById('api-provider-select');
    if (providerSelect) providerSelect.value = savedProvider;
    if (typeof updateProviderHint === 'function') updateProviderHint();
    updateAIStatusChip();
  }

  // Load saved STT Mode
  const savedSTTMode = localStorage.getItem('stt_mode') || 'ai';
  const sttSelect = document.getElementById('stt-mode-select');
  if (sttSelect) sttSelect.value = savedSTTMode;

  // Load saved JLPT Level
  const savedJLPTLevel = localStorage.getItem('jlpt_level') || 'N5';
  const jlptSelect = document.getElementById('jlpt-level-select');
  if (jlptSelect) jlptSelect.value = savedJLPTLevel;
});

// ─────────────────────────────────────────────
// AI INTEGRATION
// ─────────────────────────────────────────────

function updateProviderHint() {
  const provider = document.getElementById('api-provider-select')?.value || 'groq';
  const hintEl = document.getElementById('provider-hint');
  if (hintEl) {
    if (provider === 'groq') {
      hintEl.innerHTML = 'Get a free API key at <a href="https://console.groq.com/keys" target="_blank" style="color: var(--teal);">Groq Console</a> — Generous free tier for testing!';
    } else if (provider === 'openrouter') {
      hintEl.innerHTML = 'Get a free API key at <a href="https://openrouter.ai/settings/keys" target="_blank" style="color: var(--teal);">OpenRouter</a> — Huge selection of free models.';
    }
  }
}

function updateAIStatusChip() {
  const provider = localStorage.getItem('api_provider') || 'groq';
  const apiKey = localStorage.getItem('api_key') || localStorage.getItem('gemini_api_key');
  const chip = document.getElementById('ai-status-chip');
  const text = document.getElementById('ai-status-text');
  
  if (!chip || !text) return;
  if (apiKey) {
    chip.classList.add('active');
    text.textContent = provider === 'groq' ? 'Groq Active' : 'OpenRouter Active';
  } else {
    chip.classList.remove('active');
    text.textContent = 'Not configured';
  }
}

function showApiKeyStatus(message, type) {
  const statusDiv = document.getElementById('api-key-status');
  if (!statusDiv) return;
  statusDiv.textContent = message;
  statusDiv.className = 'import-status ' + type;
  if (type !== 'info') {
    setTimeout(() => { statusDiv.className = 'import-status'; }, 5000);
  }
}

function saveApiKeyFromInput() {
  const input = document.getElementById('api-key-input');
  let provider = document.getElementById('api-provider-select')?.value || 'groq';
  let key = input ? input.value : '';
  key = key.replace(/[^\x21-\x7E]/g, ''); // Remove any non-visible/non-ASCII characters
  if (input) input.value = key;
  
  // Auto-detect OpenRouter or Groq keys
  const providerSelect = document.getElementById('api-provider-select');
  if (key.startsWith('sk-or-v1-')) {
    provider = 'openrouter';
    if (providerSelect) providerSelect.value = 'openrouter';
  } else if (key.startsWith('gsk_')) {
    provider = 'groq';
    if (providerSelect) providerSelect.value = 'groq';
  }
  if (providerSelect && typeof updateProviderHint === 'function') updateProviderHint();

  if (!key) {
    showApiKeyStatus('❌ Please enter an API key.', 'error');
    return;
  }
  localStorage.setItem('api_key', key);
  localStorage.setItem('api_provider', provider);
  updateAIStatusChip();
  showApiKeyStatus('✅ API key saved!', 'success');
}

function clearApiKey() {
  localStorage.removeItem('api_key');
  localStorage.removeItem('gemini_api_key');
  localStorage.removeItem('api_provider');
  const input = document.getElementById('api-key-input');
  if (input) input.value = '';
  updateAIStatusChip();
  showApiKeyStatus('🗑 API key cleared. Grading will use local fallback.', 'info');
}

function saveSTTMode() {
  const select = document.getElementById('stt-mode-select');
  if (select) {
    localStorage.setItem('stt_mode', select.value);
  }
}

function saveJLPTLevel() {
  const select = document.getElementById('jlpt-level-select');
  if (select) {
    localStorage.setItem('jlpt_level', select.value);
  }
}

function toggleKeyVisibility() {
  const input = document.getElementById('api-key-input');
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

async function testApiConnection() {
  const input = document.getElementById('api-key-input');
  let provider = document.getElementById('api-provider-select')?.value || 'gemini';
  let key = input ? input.value : '';
  key = key.replace(/[^\x21-\x7E]/g, ''); // Remove any non-visible/non-ASCII characters
  if (input) input.value = key;

  // Auto-detect OpenRouter keys
  if (key.startsWith('sk-or-v1-')) {
    provider = 'openrouter';
    const providerSelect = document.getElementById('api-provider-select');
    if (providerSelect) {
      providerSelect.value = 'openrouter';
      if (typeof updateProviderHint === 'function') updateProviderHint();
    }
  }

  if (!key) {
    showApiKeyStatus('❌ Please enter an API key first.', 'error');
    return;
  }
  showApiKeyStatus('🔄 Testing connection…', 'info');
  try {
    if (provider === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{role: 'user', content: 'Reply with exactly: OK'}]
        })
      });
      if (!response.ok) {
        if (response.status === 401) throw new Error('API_KEY_INVALID');
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const text = data.choices[0].message.content || '';
      if (text.toLowerCase().includes('ok')) {
        showApiKeyStatus('✅ Connection successful! Groq is ready.', 'success');
      } else {
        showApiKeyStatus('✅ Connected, got response: ' + text.substring(0, 50), 'success');
      }
    } else if (provider === 'openrouter') {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: [{role: 'user', content: 'Reply with exactly: OK'}]
        })
      });
      if (!response.ok) {
        if (response.status === 401) throw new Error('API_KEY_INVALID');
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const text = data.choices[0].message.content || '';
      if (text.toLowerCase().includes('ok')) {
        showApiKeyStatus('✅ Connection successful! OpenRouter is ready.', 'success');
      } else {
        showApiKeyStatus('✅ Connected, got response: ' + text.substring(0, 50), 'success');
      }
    }
  } catch (e) {
    const msg = e.message || String(e);
    if (msg.includes('API_KEY_INVALID') || msg.includes('401')) {
      showApiKeyStatus('❌ Invalid API key. Please check your key.', 'error');
    } else if (msg.includes('429')) {
      showApiKeyStatus('⚠️ Rate limited — hit the free tier limit. Try again shortly.', 'error');
    } else {
      showApiKeyStatus('❌ Connection failed: ' + msg.substring(0, 80), 'error');
    }
  }
}
function getGradingPrompt(level, question, expectedAnswer, transcript) {
  let strictnessRules = '';
  
  if (level === 'N5') {
    strictnessRules = `
- **SPEECH-TO-TEXT HOMOPHONE RULE (CRITICAL)**: The transcript is generated by Speech-to-Text. STT frequently outputs the wrong kanji for homophones (words that sound identical, e.g. transcribing 'seiri' as 生理 instead of 整理). If a word in the transcript sounds exactly the same as the correct answer, you MUST treat it as perfectly correct. Do not penalize homophone kanji errors.
- Be EXTREMELY LENIENT with vocabulary. If the student uses a valid beginner alternative (e.g. わたしの instead of うちの), mark it correct.
- Prioritize correct pronunciation and basic meaning. Do not be a strict grammarian for N5.`;
  } else if (level === 'N4') {
    strictnessRules = `
- Be LENIENT with STT homophones (e.g. 生理 vs 整理). If it sounds the same, it is likely an STT artifact and should not be heavily penalized.
- Be moderately strict with vocabulary and grammar, but accept valid N4-level alternatives.`;
  } else {
    strictnessRules = `
- Expect precise vocabulary and correct grammar suitable for N3 level.
- You may forgive obvious STT kanji homophone errors, but hold the student to a high standard for particle usage and verb conjugation.`;
  }

  return `You are a Japanese language teacher grading a JLPT ${level} speaking practice answer.

Question asked: ${question}
Expected answer: ${expectedAnswer}
Student's spoken answer (speech-to-text transcript): ${transcript}

Evaluate the student's answer. Consider that the transcript comes from speech recognition and may contain minor recognition errors or kanji/katakana variations.

Respond ONLY with valid JSON (no markdown, no code fences, no explanation outside JSON):
{"correct":true or false,"score":0 to 100,"feedback":"1-2 sentence explanation in English","grammar_notes":"Grammar issues found, or empty string if none","particle_notes":"Particle usage issues, or empty string if none","vocabulary_notes":"Vocabulary issues, or empty string if none","suggested_answer":"The ideal answer if incorrect, or empty string if correct"}

CRITICAL JSON RULES:
- Do NOT use double quotes (") inside any of your text values. Use single quotes (') instead.
- Ensure the JSON is completely valid and properly escaped.
- Do not output any text before or after the JSON object.

Grading rules:${strictnessRules}
- Be STRICT with: particle usage (で/に/を/が/は/へ), verb tense and conjugation (ます/ました/ません), answering the actual question asked
- When providing feedback, cite the EXACT kanji or kana used in the transcript. If providing kana for kanji, use standard readings (e.g. 猫 is ねこ, do not write にゃん) unless specifically written as such in the transcript.
- If the transcript is garbled or empty, mark as incorrect with helpful feedback
- Set score 80-100 for correct answers, 40-79 for partially correct, 0-39 for incorrect.`;
}
async function gradeWithAI(question, expectedAnswer, transcript) {
  const provider = localStorage.getItem('api_provider') || 'groq';
  const apiKey = localStorage.getItem('api_key') || localStorage.getItem('gemini_api_key');
  if (!apiKey) return null;

  try {
    const level = localStorage.getItem('jlpt_level') || 'N5';
    const prompt = getGradingPrompt(level, question, expectedAnswer, transcript);

    let text = '';

    if (provider === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          response_format: { type: "json_object" },
          messages: [
            { role: 'system', content: 'You are a Japanese language teacher.' },
            { role: 'user', content: prompt }
          ]
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error('Groq API failed:', response.status, errText);
        return null;
      }
      const data = await response.json();
      text = data.choices?.[0]?.message?.content || '';
    } else if (provider === 'openrouter') {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: [
            { role: 'system', content: 'You are a Japanese language teacher.' },
            { role: 'user', content: prompt }
          ]
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error('OpenRouter API failed:', response.status, errText);
        return null;
      }
      const data = await response.json();
      text = data.choices?.[0]?.message?.content || '';
    }

    if (!text) {
      console.error('AI returned empty text');
      return null;
    }

    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
       text = text.substring(startIdx, endIdx + 1);
    } else {
      console.error('AI text did not contain JSON object:', text);
      return null;
    }

    let result;
    try {
      result = JSON.parse(text);
    } catch (pe) {
      console.error('Failed to parse AI JSON:', pe, 'Raw text:', text);
      return null;
    }

    return {
      correct: !!result.correct,
      score: typeof result.score === 'number' ? result.score : (result.correct ? 100 : 0),
      feedback: result.feedback || '',
      grammarNotes: result.grammar_notes || '',
      particleNotes: result.particle_notes || '',
      vocabularyNotes: result.vocabulary_notes || '',
      suggestedAnswer: result.suggested_answer || '',
      source: provider
    };
  } catch (e) {
    console.error('AI grading error:', e);
    return null; // Fallback to local grading
  }
}

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let current   = 0;
let score     = 0;
let results   = [];
let synth         = window.speechSynthesis;
let recog         = null;
let listening     = false;
let isChecking    = false;
let liveTranscript = '';
let micStream     = null;
let mediaRecorder = null;
let audioChunks   = [];

function isSpeechRecognitionSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function abortRecognition() {
  listening = false;
  if (recog) {
    try { recog.abort(); } catch (e) {}
  }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try { mediaRecorder.stop(); } catch (e) {}
  }
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const KATAKANA_HIRAGANA_MAP = {
  'ア': 'あ', 'イ': 'い', 'ウ': 'う', 'エ': 'え', 'オ': 'お',
  'カ': 'か', 'キ': 'き', 'ク': 'く', 'ケ': 'け', 'コ': 'こ',
  'サ': 'さ', 'シ': 'し', 'ス': 'す', 'セ': 'せ', 'ソ': 'そ',
  'タ': 'た', 'チ': 'ち', 'ツ': 'つ', 'テ': 'て', 'ト': 'と',
  'ナ': 'な', 'ニ': 'に', 'ヌ': 'ぬ', 'ネ': 'ね', 'ノ': 'の',
  'ハ': 'は', 'ヒ': 'ひ', 'フ': 'ふ', 'ヘ': 'へ', 'ホ': 'ほ',
  'マ': 'ま', 'ミ': 'み', 'ム': 'む', 'メ': 'め', 'モ': 'も',
  'ヤ': 'や', 'ユ': 'ゆ', 'ヨ': 'よ',
  'ラ': 'ら', 'リ': 'り', 'ル': 'る', 'レ': 'れ', 'ロ': 'ろ',
  'ワ': 'わ', 'ヲ': 'を', 'ン': 'ん',
  'ガ': 'が', 'ギ': 'ぎ', 'グ': 'ぐ', 'ゲ': 'げ', 'ゴ': 'ご',
  'ザ': 'ざ', 'ジ': 'じ', 'ズ': 'ず', 'ゼ': 'ぜ', 'ゾ': 'ぞ',
  'ダ': 'だ', 'ヂ': 'ぢ', 'ヅ': 'づ', 'デ': 'で', 'ド': 'ど',
  'バ': 'ば', 'ビ': 'び', 'ブ': 'ぶ', 'ベ': 'べ', 'ボ': 'ぼ',
  'パ': 'ぱ', 'ピ': 'ぴ', 'プ': 'ぷ', 'ペ': 'ぺ', 'ポ': 'ぽ',
  'ァ': 'ぁ', 'ィ': 'ぃ', 'ゥ': 'ぅ', 'ェ': 'ぇ', 'ォ': 'ぉ',
  'ャ': 'ゃ', 'ュ': 'ゅ', 'ョ': 'ょ',
  'ッ': 'っ', 'ー': 'う',
  'ヴ': 'ゔ'
};

function katakanaToHiragana(s) {
  let result = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    result += KATAKANA_HIRAGANA_MAP[ch] || ch;
  }
  return result;
}

const MONTH_READ = [
  '', 'いちがつ','にがつ','さんがつ','しがつ','ごがつ','ろくがつ',
  'しちがつ','はちがつ','くがつ','じゅうがつ','じゅういちがつ','じゅうにがつ'
];
const DAY_READ = [
  '', 'ついたち','ふつか','みっか','よっか','いつか','むいか',
  'なのか','ようか','ここのか','とおか',
  'じゅういちにち','じゅうににち','じゅうさんにち','じゅうよっか','じゅうごにち',
  'じゅうろくにち','じゅうしちにち','じゅうはちにち','じゅうくにち','はつか',
  'にじゅういちにち','にじゅうににち','にじゅうさんにち','にじゅうよっか','にじゅうごにち',
  'にじゅうろくにち','にじゅうしちにち','にじゅうはちにち','にじゅうくにち',
  'さんじゅうにち','さんじゅういちにち'
];
const KANJI_DIGIT = {'０':0,'１':1,'２':2,'３':3,'４':4,'５':5,'６':6,'７':7,'８':8,'９':9,
  '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10};
function toInt(s) {
  s = s.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  let v = 0, cur = 0;
  for (const ch of s) {
    const d = KANJI_DIGIT[ch];
    if (d === undefined) continue;
    if (d === 10) { cur = cur === 0 ? 10 : cur * 10; }
    else { cur += d; }
  }
  return cur || 0;
}

const KANJI_MAP = [
  ['お父さん',    'おとうさん'],
  ['お母さん',    'おかあさん'],
  ['お姉さん',    'おねえさん'],
  ['お兄さん',    'おにいさん'],
  ['日本語',      'にほんご'],
  ['自転車',      'じてんしゃ'],
  ['誕生日',      'たんじょうび'],
  ['映画館',      'えいがかん'],
  ['何曜日',      'なんようび'],
  ['土曜日',      'どようび'],
  ['日曜日',      'にちようび'],
  ['月曜日',      'げつようび'],
  ['友達',        'ともだち'],
  ['食堂',        'しょくどう'],
  ['毎日',        'まいにち'],
  ['毎朝',        'まいあさ'],
  ['毎週',        'まいしゅう'],
  ['先週',        'せんしゅう'],
  ['仕事',        'しごと'],
  ['一人で',      'ひとりで'],
  ['一人',        'ひとり'],
  ['独りで',      'ひとりで'],
  ['独り',        'ひとり'],
  ['野菜',        'やさい'],
  ['果物',        'くだもの'],
  ['去年',        'きょねん'],
  ['今年',        'ことし'],
  ['今日',        'きょう'],
  ['明日',        'あした'],
  ['昨日',        'きのう'],
  ['家族',        'かぞく'],
  ['生活',        'せいかつ'],
  ['料理',        'りょうり'],
  ['電車',        'でんしゃ'],
  ['勉強',        'べんきょう'],
  ['面白',        'おもしろ'],
  ['元気',        'げんき'],
  ['得意',        'とくい'],
  ['言語',        'げんご'],
  ['タガログ語',  'たがるごご'],
  ['タガログ',    'たがるご'],
  ['何時',        'なんじ'],
  ['何分',        'なんぷん'],
  ['何月',        'なんがつ'],
  ['何日',        'なんにち'],
  ['何年',        'なんねん'],
  ['お金',        'おかね'],
  ['シャツ',      'しゃつ'],
  ['食べまし',    'たべまし'],
  ['食べます',    'たべます'],
  ['食べ',        'たべ'],
  ['行きまし',    'いきまし'],
  ['行きます',    'いきます'],
  ['行きませ',    'いきませ'],
  ['行き',        'いき'],
  ['行っ',        'いっ'],
  ['行く',        'いく'],
  ['銀行',        'ぎんこう'],
  ['書きまし',    'かきまし'],
  ['書きます',    'かきます'],
  ['書き',        'かき'],
  ['書',          'か'],
  ['会いまし',    'あいまし'],
  ['会います',    'あいます'],
  ['会い',        'あい'],
  ['会っ',        'あっ'],
  ['会',          'あ'],
  ['作りまし',    'つくりまし'],
  ['作ります',    'つくります'],
  ['作り',        'つくり'],
  ['作',          'つく'],
  ['終わりまし',  'おわりまし'],
  ['終わります',  'おわります'],
  ['終わり',      'おわり'],
  ['終わ',        'おわ'],
  ['終',          'お'],
  ['貰いまし',    'もらいまし'],
  ['貰います',    'もらいます'],
  ['貰い',        'もらい'],
  ['貰',          'もら'],
  ['飲みまし',    'のみまし'],
  ['飲みます',    'のみます'],
  ['飲み',        'のみ'],
  ['飲',          'の'],
  ['来ました',    'きました'],
  ['来ます',      'きます'],
  ['来',          'き'],
  ['見まし',      'みまし'],
  ['見ます',      'みます'],
  ['見',          'み'],
  ['話しまし',    'はなしまし'],
  ['話します',    'はなします'],
  ['話し',        'はなし'],
  ['話',          'はな'],
  ['父',          'ちち'],
  ['母',          'はは'],
  ['姉',          'あね'],
  ['兄',          'あに'],
  ['妹',          'いもうと'],
  ['弟',          'おとうと'],
  ['私',          'わたし'],
  ['人',          'ひと'],
  ['一',          'いち'],
  ['二',          'に'],
  ['三',          'さん'],
  ['四',          'よん'],
  ['五',          'ご'],
  ['六',          'ろく'],
  ['七',          'しち'],
  ['八',          'はち'],
  ['九',          'く'],
  ['十',          'じゅう'],
  ['土',          'ど'],
  ['曜',          'よう'],
  ['語',          'ご'],
  ['言',          'げん'],
  ['金',          'かね'],
  ['野',          'や'],
  ['菜',          'さい'],
  ['果',          'くだ'],
  ['小',          'ちい'],
  ['大',          'おお'],
  ['不',          'ふ'],
  ['未',          'み'],
  ['本',          'ほん'],
  ['中',          'なか'],
  ['高',          'たか'],
  ['低',          'ひく'],
  ['好',          'す'],
  ['見',          'み'],
  ['聞',          'き'],
  ['読',          'よ'],
  ['書',          'か'],
  ['話',          'はな'],
  ['買',          'か'],
  ['売',          'う'],
  ['行',          'い'],
  ['来',          'き'],
  ['帰',          'かえ'],
  ['入',          'はい'],
  ['出',          'で'],
  ['使',          'つか'],
  ['持',          'も'],
  ['知',          'し'],
  ['思',          'おも'],
  ['言',          'い'],
  ['立',          'た'],
  ['座',          'すわ'],
  ['歩',          'ある'],
  ['走',          'はし'],
];

const LESSON_KANJI_MAP = [
  ['ありがとうございます', 'ありがとうございます'],
  ['九月十二日', 'くがつじゅうににち'],
  ['そうしましょう', 'そうしましょう'],
  ['いきませんか', 'いきませんか'],
  ['ではありません', 'ではありません'],
  ['行きませんか', 'いきませんか'],
  ['行きません', 'いきません'],
  ['おもしろいです', 'おもしろいです'],
  ['元気な', 'げんきな'],
  ['面白い', 'おもしろい'],
  ['昼ごはん', 'ひるごはん'],
  ['昼御飯', 'ひるごはん'],
  ['御飯', 'ごはん'],
  ['近くの', 'ちかくの'],
  ['近く', 'ちかく'],
  ['大丈夫', 'だいじょうぶ'],
  ['物価', 'ぶっか'],
  ['時々', 'ときどき'],
  ['料理が', 'りょうりが'],
  ['上手', 'じょうず'],
  ['素敵', 'すてき'],
  ['忙しい', 'いそがしい'],
  ['安くない', 'やすくない'],
  ['安く', 'やすく'],
  ['安い', 'やすい'],
  ['自分', 'じぶん'],
  ['休みの日', 'やすみのひ'],
  ['休み', 'やすみ'],
  ['ありがとう', 'ありがとう'],
  ['食べました', 'たべました'],
  ['行きました', 'いきました'],
  ['会いました', 'あいました'],
  ['もらいました', 'もらいました'],
  ['終わります', 'おわります'],
  ['作ります', 'つくります'],
  ['食べます', 'たべます'],
  ['行きます', 'いきます'],
  ['しました', 'しました'],
  ['します', 'します'],
  ['ましょう', 'ましょう'],
  ['それから', 'それから'],
  ['そして', 'そして'],
  ['いいえ', 'いいえ'],
  ['ちょっと', 'ちょっと'],
  ['あまり', 'あまり'],
  ['まだ', 'まだ'],
  ['九月', 'くがつ'],
  ['七月', 'しちがつ'],
  ['十二日', 'じゅうににち'],
  ['映画', 'えいが'],
  ['日本', 'にほん'],
  ['物', 'もの'],
  ['人', 'ひと'],
];

const SINGLE_KANJI_READ = {
  '近': 'ちか', '休': 'やす', '安': 'やす', '忙': 'いそ', '上': 'じょう', '手': 'て',
  '素': 'そ', '敵': 'てき', '物': 'もの', '価': 'か', '昼': 'ひる', '御': 'ご', '飯': 'はん',
  '画': 'が', '館': 'かん', '映': 'えい', '電': 'でん', '車': 'しゃ', '友': 'とも', '達': 'だち',
  '食': 'た', '堂': 'どう', '勉': 'べん', '強': 'きょう', '習': 'しゅう', '料': 'りょう', '理': 'り',
  '味': 'み', '面': 'おも', '白': 'しろ', '元': 'げん', '気': 'き', '今': 'こん', '年': 'ねん',
  '去': 'きょ', '先': 'せん', '週': 'しゅう', '毎': 'まい', '朝': 'あさ', '日': 'にち', '月': 'がつ',
  '誕': 'たん', '生': 'せい', '何': 'なに', '分': 'ぶん', '自': 'じ', '身': 'み', '族': 'ぞく',
  '活': 'かつ', '父': 'ちち', '母': 'はは', '姉': 'あね', '兄': 'あに', '妹': 'いもうと', '弟': 'おとうと',
  '私': 'わたし', '人': 'ひと', '一': 'いち', '二': 'に', '三': 'さん', '四': 'よん', '五': 'ご',
  '六': 'ろく', '七': 'しち', '八': 'はち', '九': 'く', '十': 'じゅう', '土': 'ど', '曜': 'よう',
  '語': 'ご', '言': 'げん', '金': 'かね', '野': 'や', '菜': 'さい', '果': 'くだ', '小': 'ちい',
  '大': 'おお', '不': 'ふ', '未': 'み', '本': 'ほん', '中': 'なか', '高': 'たか', '低': 'ひく',
  '好': 'す', '見': 'み', '聞': 'き', '読': 'よ', '書': 'か', '話': 'はな', '買': 'か', '売': 'う',
  '行': 'い', '来': 'き', '帰': 'かえ', '入': 'はい', '出': 'で', '使': 'つか', '持': 'も',
  '知': 'し', '思': 'おも', '言': 'い', '立': 'た', '座': 'すわ', '歩': 'ある', '走': 'はし',
};

let _allKanjiMapCache = null;
function getAllKanjiMap() {
  if (_allKanjiMapCache) return _allKanjiMapCache;
  const seen = new Set();
  _allKanjiMapCache = [];
  for (const pair of [...KANJI_MAP, ...LESSON_KANJI_MAP]) {
    if (seen.has(pair[0])) continue;
    seen.add(pair[0]);
    _allKanjiMapCache.push(pair);
  }
  _allKanjiMapCache.sort((a, b) => b[0].length - a[0].length);
  return _allKanjiMapCache;
}

function applyKanjiMap(s, passes) {
  const map = getAllKanjiMap();
  for (let p = 0; p < (passes || 2); p++) {
    let next = s;
    for (const [kanji, hira] of map) next = next.split(kanji).join(hira);
    if (next === s) break;
    s = next;
  }
  return s;
}

function convertRemainingSingleKanji(s) {
  return s.replace(/[一-鿿㐀-䶿]/g, ch => SINGLE_KANJI_READ[ch] || ch);
}

function transcriptToFurigana(s) {
  s = s.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
  s = s.replace(/1人で/g, 'ひとりで');
  s = s.replace(/1人/g, 'ひとり');
  s = applyKanjiMap(s, 3);
  s = s.replace(/([0-9]+|[一二三四五六七八九十百千]+)月/g, (_, n) => {
    const m = toInt(n);
    return (m >= 1 && m <= 12) ? MONTH_READ[m] : _;
  });
  s = s.replace(/([0-9]+|[一二三四五六七八九十百千]+)日/g, (_, n) => {
    const d = toInt(n);
    return (d >= 1 && d <= 31) ? DAY_READ[d] : _;
  });
  s = s.replace(/([0-9]+)年/g, (_, n) => {
    const digits = ['ぜろ','いち','に','さん','し','ご','ろく','なな','はち','く'];
    return n.split('').map(d => digits[+d] || d).join('') + 'ねん';
  });
  s = s.replace(/[一二三四五六七八九十百千万]+/g, m => {
    const n = toInt(m);
    if (n === 0) return m;
    return numberToHiragana(n);
  });
  s = s.replace(/\d+/g, n => numberToHiragana(parseInt(n, 10)));
  s = katakanaToHiragana(s);
  s = convertRemainingSingleKanji(s);
  s = applyKanjiMap(s, 2);
  s = katakanaToHiragana(s);
  return s;
}

function transcriptToFuriganaForGrading(raw, answer) {
  let s = transcriptToFurigana(raw);
  const rawHasKanji = /[一-鿿㐀-䶿]/.test(raw);
  if (rawHasKanji) {
    for (const [kanji, hira] of getAllKanjiMap()) {
      if (raw.includes(kanji)) s = s.split(kanji).join(hira);
    }
    s = convertRemainingSingleKanji(s);
    s = applyKanjiMap(s, 2);
    s = katakanaToHiragana(s);
  }
  return s;
}

function numberToHiragana(n) {
  if (n === 0) return 'ぜろ';
  const ones  = ['','いち','に','さん','し','ご','ろく','しち','はち','く'];
  const onesM = ['','いち','に','さん','よん','ご','ろく','なな','はち','きゅう'];
  let s = '';
  if (n >= 1000) { s += (n >= 2000 ? ones[Math.floor(n/1000)] : '') + 'せん'; n %= 1000; }
  if (n >= 100)  { s += (n >= 200  ? ones[Math.floor(n/100)]  : '') + 'ひゃく'; n %= 100; }
  if (n >= 10)   { s += (n >= 20   ? ones[Math.floor(n/10)]   : '') + 'じゅう'; n %= 10; }
  if (n > 0)     { s += ones[n]; }
  return s || 'ぜろ';
}

function formatLiveTranscript(s) {
  return transcriptToFurigana(s);
}

function sttSegmentText(result) {
  return result[0].transcript;
}

// ─────────────────────────────────────────────
// LOCAL FALLBACK GRADING (used when Gemini is unavailable)
// ─────────────────────────────────────────────
const STRIP_RE = /[\s　、。！？・「」『』【】〜〈〉（）,，.]/g;

function normalizeAnswer(s) {
  return katakanaToHiragana(s).replace(STRIP_RE, '').toLowerCase();
}

function normalizeTranscript(raw, answer) {
  const furigana = answer != null
    ? transcriptToFuriganaForGrading(raw, answer)
    : transcriptToFurigana(raw);
  return furigana.replace(STRIP_RE, '').toLowerCase();
}

function lcsLength(s1, s2) {
  const m = s1.length, n = s2.length;
  let prev = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    const curr = new Array(n + 1).fill(0);
    for (let j = 1; j <= n; j++) {
      curr[j] = s1[i-1] === s2[j-1]
        ? prev[j-1] + 1
        : Math.max(prev[j], curr[j-1]);
    }
    prev = curr;
  }
  return prev[n];
}

function similarity(transcript, answer) {
  const t = normalizeTranscript(transcript, answer);
  const a = normalizeAnswer(answer);
  if (t === a) return 1;
  if (a.length === 0) return 0;
  return lcsLength(t, a) / a.length;
}

function isCorrectLocal(rawTranscript, answer) {
  const sim = similarity(rawTranscript, answer);
  return {
    correct: sim >= 0.65,
    score: Math.round(sim * 100),
    feedback: sim >= 0.65 ? 'Answer matched (local check).' : 'Answer did not match closely enough (local check).',
    grammarNotes: '',
    particleNotes: '',
    vocabularyNotes: '',
    suggestedAnswer: sim >= 0.65 ? '' : answer,
    source: 'local'
  };
}

// ─────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────
function setStatus(state, text) {
  const dot  = document.getElementById('pulse');
  const stxt = document.getElementById('status-text');
  dot.className  = 'pulse-dot ' + (state || '');
  stxt.textContent = text;
}

function showTranscript(text, active) {
  const box = document.getElementById('transcript-box');
  const ph  = document.getElementById('transcript-placeholder');
  const ct  = document.getElementById('transcript-content');
  if (text) {
    ph.classList.add('hidden');
    ct.classList.remove('hidden');
    ct.replaceChildren(document.createTextNode(text));
  } else {
    ph.classList.remove('hidden');
    ct.classList.add('hidden');
    ct.replaceChildren();
  }
  box.classList.toggle('active', !!active);
}

function showCheckedTranscript(raw, furiganaReading) {
  const ph  = document.getElementById('transcript-placeholder');
  const ct  = document.getElementById('transcript-content');
  const box = document.getElementById('transcript-box');
  ph.classList.add('hidden');
  ct.classList.remove('hidden');
  box.classList.remove('active');

  const heard = document.createElement('div');
  heard.textContent = formatLiveTranscript(raw);

  const checked = document.createElement('div');
  checked.className = 'transcript-furigana';
  checked.textContent = 'Checked (reading): ' + furiganaReading;

  ct.replaceChildren(heard, checked);
}

function showResult(gradeResult, answer) {
  const badge = document.getElementById('result-badge');
  const icon  = document.getElementById('result-icon');
  const msg   = document.getElementById('result-msg');
  const rev   = document.getElementById('answer-reveal');
  const aiFb  = document.getElementById('ai-feedback');
  const correct = gradeResult.correct;

  badge.className = 'result-badge ' + (correct ? 'correct' : 'wrong');
  icon.textContent = correct ? '✅' : '❌';
  msg.textContent  = correct ? '正解！ Correct!' : '不正解。 Incorrect.';

  if (!correct && gradeResult.suggestedAnswer) {
    rev.replaceChildren();
    const strong = document.createElement('strong');
    strong.textContent = 'Correct answer: ';
    rev.append(strong, document.createTextNode(gradeResult.suggestedAnswer || answer));
  } else {
    rev.replaceChildren();
    const strong = document.createElement('strong');
    strong.textContent = correct ? 'Expected answer: ' : 'Expected: ';
    rev.append(strong, document.createTextNode(answer));
  }

  // Show AI feedback details
  aiFb.replaceChildren();
  if (gradeResult.source !== 'local' && gradeResult.feedback) {
    const fbText = document.createElement('div');
    fbText.className = 'ai-feedback-text';
    const sourceIcon = gradeResult.source === 'openrouter' ? '🤖' : '🤖';
    fbText.textContent = sourceIcon + ' ' + gradeResult.feedback;
    aiFb.appendChild(fbText);

    const notes = document.createElement('div');
    notes.className = 'ai-feedback-notes';

    const noteTypes = [
      { label: 'Grammar', text: gradeResult.grammarNotes },
      { label: 'Particles', text: gradeResult.particleNotes },
      { label: 'Vocab', text: gradeResult.vocabularyNotes },
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
        notes.appendChild(note);
      }
    }

    if (notes.children.length > 0) {
      aiFb.appendChild(notes);
    }
  } else if (gradeResult.source === 'local') {
    const fbText = document.createElement('div');
    fbText.className = 'ai-feedback-text';
    fbText.textContent = '⚙️ ' + gradeResult.feedback + ' (AI unavailable — used local matching)';
    aiFb.appendChild(fbText);
  }
}

function showBtn(id, visible) {
  document.getElementById(id).classList.toggle('hidden', !visible);
}

// ─────────────────────────────────────────────
// SPEECH SYNTHESIS (TTS)
// ─────────────────────────────────────────────
function speakQuestion(text, onEnd) {
  if (synth.speaking) synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang  = 'ja-JP';
  utter.rate  = 0.85;
  utter.pitch = 1.0;

  const voices = synth.getVoices();
  const jpVoice = voices.find(v => v.lang === 'ja-JP') || voices.find(v => v.lang.startsWith('ja'));
  if (jpVoice) utter.voice = jpVoice;

  utter.onend   = onEnd;
  utter.onerror = onEnd;
  setStatus('speaking', 'Speaking question…');
  synth.speak(utter);
}

// ─────────────────────────────────────────────
// SPEECH RECOGNITION (STT)
// ─────────────────────────────────────────────

function initRecognizer() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return false;
  recog = new SpeechRecognition();
  recog.lang            = 'ja-JP';
  recog.continuous      = true;
  recog.interimResults  = true;
  recog.maxAlternatives = 5;
  return true;
}

function startListening(onError) {
  if (!recog) {
    onError('SpeechRecognition not supported in this browser. Use Chrome.');
    return;
  }
  liveTranscript = '';

  recog.onstart = () => {
    listening = true;
    setStatus('listening', '🎤 Recording… click Submit or Re-record when done');
    showTranscript('', true);
    showBtn('btn-submit', true);
    showBtn('btn-rerecord', true);
    showBtn('btn-skip', false);
  };
  recog.onend = () => {
    listening = false;
    if (liveTranscript && document.getElementById('btn-next').classList.contains('hidden') && !isChecking) {
      showBtn('btn-submit', true);
      showBtn('btn-rerecord', true);
    }
  };
  recog.onresult = (e) => {
    let accumulated = '';
    let interimRaw  = '';
    for (let i = 0; i < e.results.length; i++) {
      if (e.results[i].isFinal) accumulated += sttSegmentText(e.results[i]);
      else                      interimRaw  += sttSegmentText(e.results[i]);
    }
    liveTranscript = accumulated;
    showTranscript(formatLiveTranscript(accumulated + interimRaw), true);
  };
  recog.onerror = (e) => {
    listening = false;
    if (e.error === 'no-speech') return;
    const msg = e.error === 'not-allowed'
      ? 'Microphone permission denied.'
      : 'Recognition error: ' + e.error;
    onError(msg);
  };

  recog.start();
}

function startAIRecording(onError) {
  if (!micStream) {
    onError('Microphone not available.');
    return;
  }
  const provider = localStorage.getItem('api_provider') || 'groq';
  const apiKey = localStorage.getItem('api_key');
  if (provider !== 'groq' || !apiKey) {
    onError('AI recording requires Groq API key.');
    return;
  }

  liveTranscript = '';
  audioChunks = [];
  
  try {
    mediaRecorder = new MediaRecorder(micStream);
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
    ph.classList.add('hidden');
    ct.classList.remove('hidden');
    box.classList.add('active');
    
    ct.innerHTML = '<div class="ai-recording-indicator"><div class="rec-dot"></div>Recording audio for AI transcription...</div>';
    
    showBtn('btn-submit', true);
    showBtn('btn-rerecord', true);
    showBtn('btn-skip', false);
  };

  mediaRecorder.onerror = (e) => {
    listening = false;
    onError('Recording error: ' + e.error);
  };

  mediaRecorder.start();
}

function stopAIRecording() {
  return new Promise((resolve) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      resolve(null);
      return;
    }
    mediaRecorder.onstop = () => {
      listening = false;
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      resolve(blob);
    };
    mediaRecorder.stop();
  });
}

async function transcribeWithWhisper(audioBlob) {
  const apiKey = localStorage.getItem('api_key');
  if (!apiKey) return null;

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('language', 'ja');
  // Add temperature 0 for max accuracy on short deterministic speech
  formData.append('temperature', '0');

  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey
      },
      body: formData
    });

    if (!response.ok) {
      console.error('Whisper API failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data.text || '';
  } catch (e) {
    console.error('Transcription error:', e);
    return null;
  }
}

// ─────────────────────────────────────────────
// FLOW
// ─────────────────────────────────────────────
function releaseMic() {
  if (micStream) {
    micStream.getTracks().forEach(t => t.stop());
    micStream = null;
  }
}

function startPractice() {
  if (QA.length === 0) {
    alert('Please import a Q&A database before starting practice.');
    return;
  }
  if (!isSpeechRecognitionSupported()) {
    alert('Voice recognition requires Chrome or Microsoft Edge. Safari and Firefox are not supported.');
    return;
  }
  current = 0; score = 0; results = [];
  document.getElementById('screen-start').classList.add('hidden');
  document.getElementById('screen-practice').classList.remove('hidden');

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      micStream = stream;
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

function loadQuestion() {
  const item = QA[current];
  document.getElementById('question-text').textContent = item.q;
  document.getElementById('result-badge').className = 'result-badge';
  document.getElementById('warning-box').style.display = 'none';
  showTranscript('');
  showBtn('btn-submit',   false);
  showBtn('btn-next',     false);
  showBtn('btn-rerecord', false);
  showBtn('btn-skip',     true);

  const pct = (current / QA.length) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('progress-label').textContent =
    'Question ' + (current + 1) + ' / ' + QA.length;

  setStatus('speaking', 'Preparing…');

  if (synth.getVoices().length === 0) {
    synth.addEventListener('voiceschanged', () => speakThenListen(item), { once: true });
  } else {
    speakThenListen(item);
  }
}

function speakThenListen(item) {
  speakQuestion(item.q, () => {
    setStatus('', 'Starting microphone…');
    setTimeout(() => beginListen(), 800);
  });
}

function beginListen() {
  const sttMode = localStorage.getItem('stt_mode') || 'ai';
  
  if (sttMode === 'ai') {
    startAIRecording((err) => {
      setStatus('', 'Error: ' + err);
      if (err.includes('permission')) {
        document.getElementById('warning-box').style.display = 'block';
      }
      showBtn('btn-rerecord', true);
      showBtn('btn-skip',     true);
    });
  } else {
    startListening((err) => {
      setStatus('', 'Error: ' + err);
      if (err.includes('permission')) {
        document.getElementById('warning-box').style.display = 'block';
      }
      showBtn('btn-rerecord', true);
      showBtn('btn-skip',     true);
    });
  }
}

async function submitAnswer() {
  if (isChecking) return;
  isChecking = true;
  
  showBtn('btn-submit', false);
  showBtn('btn-rerecord', false);
  showBtn('btn-skip', false);
  
  const sttMode = localStorage.getItem('stt_mode') || 'ai';
  
  if (sttMode === 'ai' && mediaRecorder && mediaRecorder.state === 'recording') {
    setStatus('checking', '🤖 Transcribing audio…');
    const ct = document.getElementById('transcript-content');
    ct.innerHTML = '<div class="ai-transcribing-indicator">Transcribing<span class="dots"></span></div>';
    
    const audioBlob = await stopAIRecording();
    if (audioBlob) {
      const transcript = await transcribeWithWhisper(audioBlob);
      if (transcript) liveTranscript = transcript;
    }
  } else {
    abortRecognition();
  }

  const item = QA[current];
  const raw = liveTranscript.trim();

  if (!raw) {
    setStatus('', 'No speech captured — try re-recording.');
    showBtn('btn-rerecord', true);
    showBtn('btn-skip',     true);
    isChecking = false;
    return;
  }

  const furiganaReading = transcriptToFuriganaForGrading(raw, item.a);
  showCheckedTranscript(raw, furiganaReading);

  // Try AI grading first, fall back to local
  setStatus('checking', '🤖 AI is checking your answer…');
  let gradeResult = await gradeWithAI(item.q, item.a, raw);
  if (!gradeResult) {
    setStatus('checking', '⚙️ Using local grading…');
    gradeResult = isCorrectLocal(raw, item.a);
  }

  if (gradeResult.correct) score++;
  results.push({
    q: item.q, a: item.a, transcript: raw, furigana: furiganaReading,
    correct: gradeResult.correct, gradeResult: gradeResult
  });
  showResult(gradeResult, item.a);
  showBtn('btn-next',     true);
  showBtn('btn-rerecord', !gradeResult.correct);
  showBtn('btn-skip',     false);
  setStatus('', gradeResult.correct ? 'Correct! 🎉' : 'Incorrect. Review the feedback.');
  isChecking = false;
}

function rerecordAnswer() {
  const item = QA[current];
  abortRecognition();
  liveTranscript = '';
  document.getElementById('result-badge').className = 'result-badge';
  showTranscript('');
  showBtn('btn-next',     false);
  showBtn('btn-rerecord', false);
  showBtn('btn-submit',   false);
  speakThenListen(item);
}

function nextQuestion() {
  current++;
  if (current >= QA.length) showResults();
  else loadQuestion();
}

function skipQuestion() {
  abortRecognition();
  results.push({ q: QA[current].q, a: QA[current].a, transcript: '(skipped)', correct: false });
  current++;
  if (current >= QA.length) showResults();
  else loadQuestion();
}

function endSession() {
  if (synth.speaking) synth.cancel();
  abortRecognition();
  recog = null;
  releaseMic();
  while (results.length < QA.length) {
    const i = results.length;
    results.push({ q: QA[i].q, a: QA[i].a, transcript: '(not reached)', correct: false });
  }
  showResults();
}

// ─────────────────────────────────────────────
// RESULTS
// ─────────────────────────────────────────────
function showResults() {
  if (synth.speaking) synth.cancel();
  document.getElementById('screen-practice').classList.add('hidden');
  const rs = document.getElementById('screen-results');
  rs.style.display = 'block';

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
  list.replaceChildren();
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
    // Always show expected answer
    const expected = document.createElement('div');
    expected.className = 'ra';
    expected.textContent = (r.correct ? '📝 Expected: ' : '✔ Expected: ') + r.a;
    div.appendChild(expected);
    // Show AI feedback in results
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
  recog = null;
  releaseMic();
  document.getElementById('screen-results').style.display = 'none';
  document.getElementById('screen-start').classList.remove('hidden');
  document.getElementById('screen-practice').classList.add('hidden');
  updateQACount();
  updateStartButton();
}

window.speechSynthesis.getVoices();
