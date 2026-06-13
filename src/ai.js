import { GROQ_GRADING_MODELS } from './data.js';
import { showApiKeyStatus } from './ui.js';

export function getGradingModel() {
  const saved = localStorage.getItem('groq_grading_model');
  if (saved === GROQ_GRADING_MODELS.fast || saved === GROQ_GRADING_MODELS.balanced) {
    return saved;
  }
  return GROQ_GRADING_MODELS.balanced;
}

export function saveGradingModel() {
  const select = document.getElementById('grading-model-select');
  if (select) localStorage.setItem('groq_grading_model', select.value);
}

export function updateAIStatusChip() {
  const apiKey = localStorage.getItem('api_key') || localStorage.getItem('gemini_api_key');
  const chip = document.getElementById('ai-status-chip');
  const text = document.getElementById('ai-status-text');

  if (!chip || !text) return;
  if (apiKey) {
    chip.classList.add('active');
    text.textContent = 'Groq Active';
  } else {
    chip.classList.remove('active');
    text.textContent = 'Not configured';
  }
}

export function saveApiKeyFromInput() {
  const input = document.getElementById('api-key-input');
  let key = input ? input.value : '';
  key = key.replace(/[^\x21-\x7E]/g, '');
  if (input) input.value = key;

  if (!key) {
    showApiKeyStatus('❌ Please enter an API key.', 'error');
    return;
  }
  if (!key.startsWith('gsk_')) {
    showApiKeyStatus('❌ This app uses Groq only. Keys start with gsk_ — get one at console.groq.com.', 'error');
    return;
  }
  localStorage.setItem('api_key', key);
  localStorage.setItem('api_provider', 'groq');
  updateAIStatusChip();
  showApiKeyStatus('✅ Groq API key saved!', 'success');
}

export function clearApiKey() {
  localStorage.removeItem('api_key');
  localStorage.removeItem('gemini_api_key');
  localStorage.removeItem('api_provider');
  const input = document.getElementById('api-key-input');
  if (input) input.value = '';
  updateAIStatusChip();
  showApiKeyStatus('🗑 API key cleared. Grading will use local fallback.', 'info');
}

export function hasGroqApiKey() {
  return !!localStorage.getItem('api_key');
}

export async function testApiConnection() {
  const input = document.getElementById('api-key-input');
  let key = input ? input.value : '';
  key = key.replace(/[^\x21-\x7E]/g, '');
  if (input) input.value = key;

  if (!key) {
    showApiKeyStatus('❌ Please enter an API key first.', 'error');
    return;
  }
  if (!key.startsWith('gsk_')) {
    showApiKeyStatus('❌ Groq keys start with gsk_. Get one at console.groq.com.', 'error');
    return;
  }
  showApiKeyStatus('🔄 Testing connection…', 'info');
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: getGradingModel(),
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

export function getGradingPrompt(level, question, expectedAnswer, transcript) {
  return `You are grading a JLPT ${level} speaking answer.

Question: ${question}
Expected answer: ${expectedAnswer}
Student answer: ${transcript}

Rules:
- Judge meaning first.
- Accept small noun, verb, adjective, or date changes if the meaning is still correct.
- Only mark wrong for real changes in core action, tense, polarity, or who does what.
- Mark wrong if the student gives only a fragment or answers only one part of a multi-part question.
- If the expected answer contains multiple sentences, clauses, or a follow-up question, the student must cover all required parts.
- For N5, do not fail for harmless wording differences.
- Return ONLY valid JSON with these keys:
  {"correct": true, "score": 100, "feedback": "", "grammar_notes": "", "particle_notes": "", "vocabulary_notes": "", "suggested_answer": ""}
`;
}

function createGrammarRuleHelper(transcriptToFurigana, katakanaToHiragana) {
  const ROMAJI_PARTICLE_MAP = {
    ha: 'は', ga: 'が', wo: 'を', ni: 'に', he: 'へ', de: 'で', no: 'の',
    to: 'と', ya: 'や', mo: 'も', kara: 'から', made: 'まで', yori: 'より'
  };
  const PARTICLE_REGEX = /(?:は|が|を|に|へ|で|の|と|や|も|から|まで|より)/g;
  const ROMAJI_PARTICLE_REGEX = /\b(?:ha|ga|wo|ni|he|de|no|to|ya|mo|kara|made|yori)\b/gi;

  const normalizeText = (s) => {
    const text = String(s || '');
    return katakanaToHiragana(transcriptToFurigana(text))
      .replace(/[\s　、。！？・「」『』【】〜〈〉（）,，.]/g, '');
  };
  const normalizeParticleToken = (token) => {
    const lower = String(token || '').toLowerCase();
    return ROMAJI_PARTICLE_MAP[lower] || lower;
  };
  const extractParticles = (s) => {
    const text = String(s || '');
    const fromKana = Array.from(text.matchAll(PARTICLE_REGEX), m => normalizeParticleToken(m[0])).join('');
    const fromRomaji = Array.from(text.matchAll(ROMAJI_PARTICLE_REGEX), m => normalizeParticleToken(m[0])).join('');
    return (fromKana + fromRomaji).replace(/[\s　、。！？・「」『』【】〜〈〉（）,，.]/g, '');
  };
  const stripParticles = (s) => String(s || '')
    .replace(/[\s　、。！？・「」『』【】〜〈〉（）,，.]/g, '')
    .replace(PARTICLE_REGEX, '')
    .replace(ROMAJI_PARTICLE_REGEX, '');

  const detectTenseMismatch = (answer, transcript) => {
    const a = normalizeText(answer);
    const t = normalizeText(transcript);
    const pastVerbRe = /([ぁ-んー]{1,6})ました/g;
    const stems = new Set();
    let match;
    while ((match = pastVerbRe.exec(a)) !== null) stems.add(match[1]);

    for (const stem of stems) {
      const presentForm = stem + 'ます';
      const pastForm = stem + 'ました';
      const countA_past = (a.match(new RegExp(pastForm, 'g')) || []).length;
      const countT_past = (t.match(new RegExp(pastForm, 'g')) || []).length;
      const countT_present = (t.match(new RegExp(presentForm, 'g')) || []).length;
      if (countA_past > 0 && countT_past < countA_past && countT_present > 0) {
        return true;
      }
    }
    return false;
  };

  const detectPolarityMismatch = (answer, transcript) => {
    const a = normalizeText(answer);
    const t = normalizeText(transcript);
    const negativePatterns = [/ない/g, /ません/g, /ませんでした/g, /なく/g, /ませんか/g];
    const positivePatterns = [/ます/g, /ました/g, /です/g, /でした/g, /ますか/g, /でしたか/g];
    const matchesAny = (text, patterns) => patterns.some((re) => {
      re.lastIndex = 0;
      return re.test(text);
    });
    const expectedNegative = matchesAny(a, negativePatterns);
    const heardNegative = matchesAny(t, negativePatterns);
    const expectedPositive = matchesAny(a, positivePatterns);
    const heardPositive = matchesAny(t, positivePatterns);

    const hasPolaritySignalA = expectedNegative || expectedPositive;
    const hasPolaritySignalT = heardNegative || heardPositive;
    if (!hasPolaritySignalA || !hasPolaritySignalT) return false;

    return (expectedNegative !== heardNegative) || (expectedPositive !== heardPositive);
  };

  return function analyzeGrammar(answer, transcript) {
    const a = normalizeText(answer);
    const t = normalizeText(transcript);
    const particleSeqA = extractParticles(answer);
    const particleSeqT = extractParticles(transcript);
    const exactNormalizedMatch = a === t;
    const particleMismatch = !exactNormalizedMatch
      && particleSeqA.length > 0 && particleSeqT.length > 0
      && stripParticles(t) === stripParticles(a)
      && particleSeqA !== particleSeqT;
    const missingOrExtraParticles = (particleSeqA.length > 0 || particleSeqT.length > 0)
      && !exactNormalizedMatch
      && stripParticles(t) === stripParticles(a)
      && particleSeqA !== particleSeqT;

    return {
      particleMismatch: particleMismatch || missingOrExtraParticles,
      tenseMismatch: detectTenseMismatch(answer, transcript),
      polarityMismatch: detectPolarityMismatch(answer, transcript),
      particleSeqA,
      particleSeqT,
      normalizedAnswer: a,
      normalizedTranscript: t
    };
  };
}

const PREDICATE_MARKER_RE = /(ませんでした|ませんか|ましたか|でしたか|ますか|ですか|ました|でした|ません|ます|です|ましょう|ない|ている|ています|ていました|たい|たかった)/g;
const PREDICATE_END_RE = /(ませんでした|ませんか|ましたか|でしたか|ますか|ですか|ました|でした|ません|ます|です|ましょう|ない|ている|ています|ていました|たい|たかった)$/;
const DANGLING_END_RE = /(は|が|を|に|へ|で|と|の|も|から|まで|より|そして|それから)$/;
const QUESTION_MARKER_RE = /(か[。！？?]|[？?])/g;

function countMatches(text, re) {
  re.lastIndex = 0;
  return Array.from(String(text || '').matchAll(re)).length;
}

function analyzeAnswerCompleteness(question, answer, transcript, transcriptToFurigana, katakanaToHiragana) {
  const normalize = (s) => katakanaToHiragana(transcriptToFurigana(String(s || '')))
    .replace(STRIP_RE, '')
    .toLowerCase();

  const a = normalize(answer);
  const t = normalize(transcript);
  const predicateCountA = countMatches(a, PREDICATE_MARKER_RE);
  const predicateCountT = countMatches(t, PREDICATE_MARKER_RE);
  const questionParts = countMatches(question, QUESTION_MARKER_RE);
  const requiredResponses = Math.max(predicateCountA, Math.min(questionParts, 2));
  const hasExtraTrailingChars = t.startsWith(a) && t.slice(a.length).replace(STRIP_RE, '').length > 0;
  const hasIncompleteSentence = PREDICATE_END_RE.test(a) && !PREDICATE_END_RE.test(t) && a.startsWith(t);
  const hasDanglingEnding = t.length > 0 && !PREDICATE_END_RE.test(t) && DANGLING_END_RE.test(t);
  const missingRequiredResponse = requiredResponses >= 2 && predicateCountT < requiredResponses;

  let reason = '';
  if (missingRequiredResponse) {
    reason = 'This answer is incomplete: it does not cover every required part of the prompt.';
  } else if (hasIncompleteSentence || hasDanglingEnding) {
    reason = 'This answer appears to stop before the sentence is complete.';
  } else if (hasExtraTrailingChars) {
    reason = 'Extra trailing characters were detected. Please remove the extra words at the end.';
  }

  return {
    incomplete: missingRequiredResponse || hasIncompleteSentence || hasDanglingEnding,
    hasExtraTrailingChars,
    reason,
    predicateCountA,
    predicateCountT,
    requiredResponses
  };
}

function parseAIGradingResponse(rawText) {
  let text = String(rawText || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const startIdx = text.indexOf('{');
  if (startIdx === -1) return null;

  const endIdx = text.lastIndexOf('}');
  const candidate = endIdx !== -1 && endIdx > startIdx
    ? text.substring(startIdx, endIdx + 1)
    : text.substring(startIdx);

  try {
    return JSON.parse(candidate);
  } catch {
    // Groq can occasionally truncate a long JSON string. Keep any complete
    // fields that did arrive so the UI can still show useful grading feedback.
  }

  const parseStringField = (key) => {
    const match = candidate.match(new RegExp('"' + key + '"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"', 's'));
    if (!match) return '';
    try {
      return JSON.parse('"' + match[1] + '"');
    } catch {
      return match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
  };
  const parseBoolField = (key) => {
    const match = candidate.match(new RegExp('"' + key + '"\\s*:\\s*(true|false)', 'i'));
    return match ? match[1].toLowerCase() === 'true' : null;
  };
  const parseNumberField = (key) => {
    const match = candidate.match(new RegExp('"' + key + '"\\s*:\\s*(-?\\d+(?:\\.\\d+)?)'));
    return match ? Number(match[1]) : null;
  };

  const partial = {
    correct: parseBoolField('correct'),
    score: parseNumberField('score'),
    feedback: parseStringField('feedback'),
    grammar_notes: parseStringField('grammar_notes'),
    particle_notes: parseStringField('particle_notes'),
    vocabulary_notes: parseStringField('vocabulary_notes'),
    suggested_answer: parseStringField('suggested_answer')
  };

  const hasUsefulFeedback = partial.correct !== null
    || partial.score !== null
    || partial.feedback
    || partial.grammar_notes
    || partial.particle_notes
    || partial.vocabulary_notes;

  if (!hasUsefulFeedback) return null;
  if (partial.correct === null) partial.correct = false;
  if (partial.score === null) partial.score = partial.correct ? 100 : 0;
  return partial;
}

export async function gradeWithAI(question, expectedAnswer, transcript) {
  const apiKey = localStorage.getItem('api_key') || localStorage.getItem('gemini_api_key');
  if (!apiKey) return null;

  try {
    const level = localStorage.getItem('jlpt_level') || 'N5';
    const prompt = getGradingPrompt(level, question, expectedAnswer, transcript);
    const requestBody = {
      model: getGradingModel(),
      temperature: 0.1,
      max_tokens: 520,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a Japanese language teacher. Return compact valid JSON only.' },
        { role: 'user', content: prompt }
      ]
    };

    let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      const errText = await response.text();
      if (/response_format|json_object/i.test(errText)) {
        const fallbackBody = { ...requestBody };
        delete fallbackBody.response_format;
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(fallbackBody)
        });
        if (response.ok) {
          const data = await response.json();
          let text = data.choices?.[0]?.message?.content || '';
          if (!text) {
            console.error('AI returned empty text');
            return null;
          }
          return finalizeAIGradingResult(text, question, expectedAnswer, transcript);
        }
      }
      console.error('Groq API failed:', response.status, errText);
      return null;
    }
    const data = await response.json();
    let text = data.choices?.[0]?.message?.content || '';

    if (!text) {
      console.error('AI returned empty text');
      return null;
    }

    return finalizeAIGradingResult(text, question, expectedAnswer, transcript);
  } catch (e) {
    console.error('AI grading error:', e);
    return null;
  }
}

async function finalizeAIGradingResult(text, question, expectedAnswer, transcript) {
    const result = parseAIGradingResponse(text);
    if (!result) {
      console.error('AI text did not contain parseable grading JSON:', text);
      return null;
    }

    // Strip garbled replacement/box/diamond characters the AI may still produce
    const sanitize = (str) => (str || '')
      .replace(/[\uFFFD\u25C6\u25A0\u25CF\u2022\u00A0\u3000]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Local verb-tense safety net: count occurrences of past verbs
    const { katakanaToHiragana, transcriptToFurigana } = await import('./parser.js');
    const analyzeGrammar = createGrammarRuleHelper(transcriptToFurigana, katakanaToHiragana);
    const grammarSignals = analyzeGrammar(expectedAnswer, transcript);
    const completionSignals = analyzeAnswerCompleteness(question, expectedAnswer, transcript, transcriptToFurigana, katakanaToHiragana);
    const detectTense = (text) => {
      const normalized = transcriptToFurigana(String(text || '')).replace(/[\s\u3000]/g, '');
      const patterns = [
        { type: 'past', re: /(ました|でした|ていた|ていました|たこと|かった|だった)/g },
        { type: 'present', re: /(ます|です|ています|ている|いる|ある|ですか|ますか)/g }
      ];

      let lastType = 'unknown';
      let lastIndex = -1;
      for (const { type, re } of patterns) {
        for (const match of normalized.matchAll(re)) {
          const idx = match.index ?? 0;
          if (idx >= lastIndex) {
            lastType = type;
            lastIndex = idx;
          }
        }
      }

      return lastType;
    };

    const normT = grammarSignals.normalizedTranscript;
    const normA = grammarSignals.normalizedAnswer;
    const particlesInAnswer = grammarSignals.particleSeqA;
    const particlesInTranscript = grammarSignals.particleSeqT;
    const particleWrong = grammarSignals.particleMismatch;

    const pastVerbRe = /([\u3041-\u3096]{1,6})\u307e\u3057\u305f/g; // Xました
    let tenseMismatch = false;
    let pastVerbMatch;
    
    // Find unique stems
    const stems = new Set();
    while ((pastVerbMatch = pastVerbRe.exec(normA)) !== null) {
      stems.add(pastVerbMatch[1]);
    }

    for (const stem of stems) {
      const presentForm = stem + '\u307e\u3059';  // stem + ます
      const pastForm = stem + '\u307e\u3057\u305f'; // stem + ました
      
      const countA_past = (normA.match(new RegExp(pastForm, 'g')) || []).length;
      const countT_past = (normT.match(new RegExp(pastForm, 'g')) || []).length;
      const countT_present = (normT.match(new RegExp(presentForm, 'g')) || []).length;
      
      // If transcript is missing the expected number of past tense forms
      // AND has a present tense form of that verb, it's a tense mismatch.
      if (countT_past < countA_past && countT_present > 0) {
        tenseMismatch = true;
        break;
      }
    }

    const questionTense = detectTense(question);
    const answerTense = detectTense(expectedAnswer);
    const questionAnswerTenseMismatch = questionTense !== 'unknown' && answerTense !== 'unknown' && questionTense !== answerTense;
    const particleMismatch = particleWrong || (
      particlesInAnswer.length > 0 &&
      particlesInTranscript.length > 0 &&
      normT !== normA &&
      particlesInTranscript !== particlesInAnswer
    );
    const localResult = await isCorrectLocal(transcript, expectedAnswer);
    const aiLooksWrong = !result.correct && localResult.correct && localResult.score >= 70 && !particleMismatch;
    const hasTenseProblem = tenseMismatch || questionAnswerTenseMismatch || grammarSignals.tenseMismatch || grammarSignals.polarityMismatch;
    const hasCompletionProblem = completionSignals.incomplete || completionSignals.hasExtraTrailingChars;
    const isCorrect = hasCompletionProblem ? false : (hasTenseProblem ? false : (particleMismatch ? false : (aiLooksWrong ? true : !!result.correct)));
    let scoreVal;
    if (hasCompletionProblem) {
      scoreVal = Math.min(typeof result.score === 'number' ? result.score : 70, completionSignals.incomplete ? 40 : 35);
    } else if (hasTenseProblem) {
      scoreVal = Math.min(typeof result.score === 'number' ? result.score : 70, 35);
    } else if (aiLooksWrong) {
      scoreVal = Math.max(typeof result.score === 'number' ? result.score : 0, localResult.score);
    } else if (typeof result.score === 'number') {
      scoreVal = Math.min(result.score, particleMismatch ? 25 : 100);
    } else {
      scoreVal = particleMismatch ? 25 : (result.correct ? 100 : 0);
    }
    const grammarVal = hasCompletionProblem
      ? completionSignals.reason
      : (hasTenseProblem
      ? (questionAnswerTenseMismatch
        ? 'Question and answer tense do not match.'
        : 'Verb tense error: used present tense (ます) instead of required past tense (ました).')
      : sanitize(result.grammar_notes));

    return {
      correct: isCorrect,
      score: scoreVal,
      feedback: hasCompletionProblem
        ? completionSignals.reason
        : (particleMismatch
        ? 'Particle usage should follow the expected pattern in this level.'
        : (aiLooksWrong ? 'Meaning is correct; minor wording differences are acceptable.' : sanitize(result.feedback))),
      grammarNotes: grammarVal,
      particleNotes: aiLooksWrong ? '' : sanitize(result.particle_notes),
      vocabularyNotes: aiLooksWrong ? '' : sanitize(result.vocabulary_notes),
      suggestedAnswer: sanitize(result.suggested_answer) || (tenseMismatch || hasCompletionProblem ? expectedAnswer : ''),
      source: 'groq'
    };
}

export async function transcribeWithWhisper(audioBlob, expectedAnswer = '') {
  if (!hasGroqApiKey()) return null;
  if (!audioBlob || audioBlob.size === 0) {
    console.error('Whisper request skipped: empty audio blob');
    return null;
  }

  const apiKey = localStorage.getItem('api_key');
  const formData = new FormData();
  const fileName = (audioBlob.type || 'audio/webm').includes('mp4') ? 'audio.mp4' : 'audio.webm';

  formData.append('file', audioBlob, fileName);
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('language', 'ja');
  formData.append('temperature', '0');
  formData.append('response_format', 'json');
  
  const promptText = (expectedAnswer || '').trim();
  if (promptText) {
    formData.append('prompt', promptText.slice(0, 120));
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey
      },
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Whisper API failed:', response.status, errText);
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
// LOCAL FALLBACK GRADING
// ─────────────────────────────────────────────
const STRIP_RE = /[\s　、。！？・「」『』【】〜〈〉（）,，.]/g;

export async function isCorrectLocal(rawTranscript, answer, question = '') {
  const { katakanaToHiragana, transcriptToFurigana, transcriptToFuriganaForGrading } = await import('./parser.js');
  const analyzeGrammar = createGrammarRuleHelper(transcriptToFurigana, katakanaToHiragana);
  const grammarSignals = analyzeGrammar(answer, rawTranscript);

  const normalizeAnswer = (s) => katakanaToHiragana(s).replace(STRIP_RE, '').toLowerCase();
  const normalizeTranscript = (raw, ans) => {
    const furigana = ans != null
      ? transcriptToFuriganaForGrading(raw, ans)
      : transcriptToFurigana(raw);
    return furigana.replace(STRIP_RE, '').toLowerCase();
  };

  const t = normalizeTranscript(rawTranscript, answer);
  const a = normalizeTranscript(answer, answer);

  const exactNormalizedMatch = a === t || a.replace(STRIP_RE, '') === t.replace(STRIP_RE, '');
  let sim = 0;
  if (exactNormalizedMatch) sim = 1;
  else if (a.length === 0) sim = 0;
  else {
    const m = t.length, n = a.length;
    let prev = new Array(n + 1).fill(0);
    for (let i = 1; i <= m; i++) {
      const curr = new Array(n + 1).fill(0);
      for (let j = 1; j <= n; j++) {
        curr[j] = t[i-1] === a[j-1]
          ? prev[j-1] + 1
          : Math.max(prev[j], curr[j-1]);
      }
      prev = curr;
    }
    sim = prev[n] / a.length;
  }

  let finalScore = Math.round(sim * 100);
  let grammarNotes = '';
  let particleNotes = '';

  const completionSignals = analyzeAnswerCompleteness(question, answer, rawTranscript, transcriptToFurigana, katakanaToHiragana);
  const hasCompletionProblem = completionSignals.incomplete || completionSignals.hasExtraTrailingChars;
  if (completionSignals.incomplete || completionSignals.hasExtraTrailingChars) {
    finalScore = Math.min(finalScore, completionSignals.incomplete ? 40 : 35);
    grammarNotes = completionSignals.reason;
  }

  // N5-friendly: small wording differences should not be treated as hard failures.
  if (finalScore >= 70) {
    finalScore = Math.max(finalScore, 85);
  }

  const particles = ['は', 'が', 'に', 'へ', 'で', 'を', 'の', 'も'];
  const romajiParticleMap = {
    ha: 'は', ga: 'が', wo: 'を', ni: 'に', he: 'へ', de: 'で', no: 'の',
    to: 'と', ya: 'や', mo: 'も', kara: 'から', made: 'まで', yori: 'より'
  };
  const particleSet = /(?:は|が|を|に|へ|で|の|と|や|も|から|まで|より)/g;
  const romajiParticleSet = /\b(?:ha|ga|wo|ni|he|de|no|to|ya|mo|kara|made|yori)\b/gi;
  const normalizeParticleToken = (token) => {
    const lower = String(token || '').toLowerCase();
    return romajiParticleMap[lower] || lower;
  };
  const stripParticlesRaw = (s) => String(s || '').replace(particleSet, '').replace(romajiParticleSet, '');
  const stripParticlesForComparison = (s) => transcriptToFurigana(stripParticlesRaw(s)).replace(/[\s\u3000]/g, '');
  const detectTense = (text) => {
    const normalized = transcriptToFurigana(String(text || '')).replace(/[\s\u3000]/g, '');
    const patterns = [
      { type: 'past', re: /(ました|でした|ていた|ていました|たこと|かった|だった)/g },
      { type: 'present', re: /(ます|です|ています|ている|いる|ある|ですか|ますか)/g }
    ];

    let lastType = 'unknown';
    let lastIndex = -1;
    for (const { type, re } of patterns) {
      for (const match of normalized.matchAll(re)) {
        const idx = match.index ?? 0;
        if (idx >= lastIndex) {
          lastType = type;
          lastIndex = idx;
        }
      }
    }

    return lastType;
  };
  const extractParticles = (s) => {
    const text = String(s || '');
    const fromKana = Array.from(text.matchAll(particleSet), m => normalizeParticleToken(m[0])).join('');
    const fromRomaji = Array.from(text.matchAll(romajiParticleSet), m => normalizeParticleToken(m[0])).join('');
    return fromKana + fromRomaji;
  };
  const pastVerbRe = /([ぁ-んー]{1,6})ました/g;
  let tenseMismatch = false;
  let pastVerbMatch;
  const stems = new Set();
  while ((pastVerbMatch = pastVerbRe.exec(a)) !== null) {
    stems.add(pastVerbMatch[1]);
  }
  for (const stem of stems) {
    const presentForm = stem + 'ます';
    const pastForm = stem + 'ました';
    const countA_past = (a.match(new RegExp(pastForm, 'g')) || []).length;
    const countT_past = (t.match(new RegExp(pastForm, 'g')) || []).length;
    const countT_present = (t.match(new RegExp(presentForm, 'g')) || []).length;
    if (countA_past > 0 && countT_past < countA_past && countT_present > 0) {
      tenseMismatch = true;
      break;
    }
  }
  const questionTense = detectTense(question);
  const answerTense = detectTense(answer);
  const questionAnswerTenseMismatch = questionTense !== 'unknown' && answerTense !== 'unknown' && questionTense !== answerTense;
  const particleSeqA = grammarSignals.particleSeqA;
  const particleSeqT = grammarSignals.particleSeqT;
  const missingParticles = [];
  particles.forEach(p => {
    const countA = (a.match(new RegExp(p, 'g')) || []).length;
    const countT = (t.match(new RegExp(p, 'g')) || []).length;
    if (countA > 0 && countT < countA) missingParticles.push(p);
    if (countT > 0 && countA === 0) missingParticles.push(p);
  });

  const hasParticleMismatch = grammarSignals.particleMismatch || missingParticles.length > 0;

  const markers = ['ます', 'ました', 'ません', 'です', 'でした', 'ましょう', 'ますか', 'ませんか'];
  const missingVerbs = [];
  markers.forEach(marker => {
    const pattern = new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const countA = (a.match(pattern) || []).length;
    const countT = (t.match(pattern) || []).length;
    if ((countA > 0 || countT > 0) && countA !== countT) missingVerbs.push(marker);
  });

  const hasPolarityProblem = grammarSignals.polarityMismatch;
  const hasTenseProblem = tenseMismatch || questionAnswerTenseMismatch || grammarSignals.tenseMismatch;
  const particlePenalty = (hasParticleMismatch ? 40 : 0) + missingParticles.length * 4;
  const verbPenalty = ((hasTenseProblem || hasPolarityProblem) ? 60 : 0) + missingVerbs.length * 6;
  if (particlePenalty + verbPenalty > 0) {
    finalScore -= particlePenalty + verbPenalty;
    if (hasParticleMismatch) {
      particleNotes = 'Particle mismatch: expected particles "' + particleSeqA + '" but heard "' + particleSeqT + '".';
    } else if (missingParticles.length > 0) {
      particleNotes = 'Check your particles: ' + missingParticles.join(', ') + ' seems missing or incorrect.';
    }
    if (hasCompletionProblem) {
      grammarNotes = completionSignals.reason;
    } else if (hasPolarityProblem) {
      grammarNotes = 'Polarity mismatch: positive/negative form does not match the expected answer.';
    } else if (hasTenseProblem || missingVerbs.length > 0) {
      grammarNotes = hasTenseProblem
        ? (questionAnswerTenseMismatch
          ? 'Question and answer tense do not match.'
          : 'Verb tense error: used present tense (ます) instead of required past tense (ました).')
        : 'Check your verb tense/conjugation: ' + missingVerbs.join(', ') + ' seems missing or incorrect.';
    }
  }

  finalScore = Math.max(0, finalScore);
  const isCorrect = !hasCompletionProblem && !hasParticleMismatch && !hasTenseProblem && finalScore >= 45;

  return {
    correct: isCorrect,
    score: finalScore,
    feedback: isCorrect ? 'Answer matched (local check).' : 'Answer did not match closely enough (local check).',
    grammarNotes: grammarNotes,
    particleNotes: particleNotes,
    vocabularyNotes: '',
    suggestedAnswer: isCorrect ? '' : answer,
    source: 'local'
  };
}
