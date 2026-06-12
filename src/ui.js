export function setStatus(state, text) {
  const dot  = document.getElementById('pulse');
  const stxt = document.getElementById('status-text');
  if (dot) dot.className  = 'pulse-dot ' + (state || '');
  if (stxt) stxt.textContent = text;
}

export function showTranscript(text, active) {
  const box = document.getElementById('transcript-box');
  const ph  = document.getElementById('transcript-placeholder');
  const ct  = document.getElementById('transcript-content');
  if (!box || !ph || !ct) return;
  if (text) {
    ph.classList.add('hidden');
    ct.classList.remove('hidden');
    ct.textContent = text;
  } else {
    ph.classList.remove('hidden');
    ct.classList.add('hidden');
    ct.replaceChildren();
  }
  box.classList.toggle('active', !!active);
}

export function showCheckedTranscript(raw, furiganaReading, formatLiveTranscript) {
  const ph  = document.getElementById('transcript-placeholder');
  const ct  = document.getElementById('transcript-content');
  const box = document.getElementById('transcript-box');
  if (!ph || !ct || !box) return;
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

export function showResultPanel(visible) {
  const badge = document.getElementById('result-badge');
  if (badge) badge.classList.toggle('hidden', !visible);
}

export function showResult(gradeResult, answer) {
  const badge = document.getElementById('result-badge');
  const icon  = document.getElementById('result-icon');
  const msg   = document.getElementById('result-msg');
  const rev   = document.getElementById('answer-reveal');
  const aiFb  = document.getElementById('ai-feedback');
  if (!badge || !icon || !msg || !rev || !aiFb) return;
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

  aiFb.replaceChildren();
  if (gradeResult.source !== 'local' && gradeResult.feedback) {
    const fbText = document.createElement('div');
    fbText.className = 'ai-feedback-text';
    fbText.textContent = '🤖 ' + gradeResult.feedback;
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

export function showBtn(id, visible) {
  const btn = document.getElementById(id);
  if (btn) btn.classList.toggle('hidden', !visible);
}

export function updateQACount(count) {
  const chip = document.getElementById('qa-count-chip');
  if (!chip) return;
  chip.textContent = count > 0
    ? '🗂 ' + count + ' Question' + (count !== 1 ? 's' : '')
    : '🗂 No Questions Loaded';
}

export function updateStartButton(count) {
  const btn = document.getElementById('btn-start-practice');
  if (!btn) return;
  if (count === 0) {
    btn.disabled = true;
    btn.textContent = '⏳ Import a Q&A database to begin';
    btn.classList.add('btn-disabled');
  } else {
    btn.disabled = false;
    btn.textContent = '▶ Start Practice';
    btn.classList.remove('btn-disabled');
  }
}

export function showImportStatus(message, type) {
  const statusDiv = document.getElementById('import-status');
  if (!statusDiv) return;
  statusDiv.textContent = message;
  statusDiv.className = 'import-status ' + type;
  if (type !== 'info') {
    setTimeout(() => {
      statusDiv.className = 'import-status';
    }, 5000);
  }
}

export function showApiKeyStatus(message, type) {
  const statusDiv = document.getElementById('api-key-status');
  if (!statusDiv) return;
  statusDiv.textContent = message;
  statusDiv.className = 'import-status ' + type;
  if (type !== 'info') {
    setTimeout(() => { statusDiv.className = 'import-status'; }, 5000);
  }
}
export function toggleKeyVisibility() {
  const input = document.getElementById('api-key-input');
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}
