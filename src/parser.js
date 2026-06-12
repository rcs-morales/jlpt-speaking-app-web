import { KATAKANA_HIRAGANA_MAP, MONTH_READ, DAY_READ, KANJI_DIGIT, KANJI_MAP, LESSON_KANJI_MAP, SINGLE_KANJI_READ } from './data.js';

export function parseJSON(content) {
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

export function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least 2 rows (header + 1 data row)');
  }

  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }

    result.push(current.trim());
    return result;
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

export function parseExcel(arrayBuffer) {
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

export function ensureXLSXLoaded() {
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

export function katakanaToHiragana(s) {
  let result = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    result += KATAKANA_HIRAGANA_MAP[ch] || ch;
  }
  return result;
}

export function toInt(s) {
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

let _allKanjiMapCache = null;
export function getAllKanjiMap() {
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

export function applyKanjiMap(s, passes) {
  const map = getAllKanjiMap();
  for (let p = 0; p < (passes || 2); p++) {
    let next = s;
    for (const [kanji, hira] of map) next = next.split(kanji).join(hira);
    if (next === s) break;
    s = next;
  }
  return s;
}

export function convertRemainingSingleKanji(s) {
  return s.replace(/[一-鿿㐀-䶿]/g, ch => SINGLE_KANJI_READ[ch] || ch);
}

export function numberToHiragana(n) {
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

export function transcriptToFurigana(s) {
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

export function transcriptToFuriganaForGrading(raw, answer) {
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

export function toFuriganaHtml(text) {
  let s = String(text || '');

  const phrasePairs = [...KANJI_MAP, ...LESSON_KANJI_MAP]
    .sort((a, b) => b[0].length - a[0].length);

  for (const [kanji, reading] of phrasePairs) {
    s = s.split(kanji).join(`<ruby>${kanji}<rt>${reading}</rt></ruby>`);
  }

  s = s.replace(/[一-鿿㐀-䶿]/g, (ch) => {
    const reading = SINGLE_KANJI_READ[ch] || katakanaToHiragana(ch);
    return reading && reading !== ch
      ? `<ruby>${ch}<rt>${reading}</rt></ruby>`
      : ch;
  });

  return s;
}

export function formatLiveTranscript(s) {
  const level = localStorage.getItem('jlpt_level') || 'N5';
  if (level === 'N5') {
    return transcriptToFurigana(s);
  }
  return transcriptToFurigana(s);
}

export function sttSegmentText(result) {
  return result[0].transcript;
}
