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

let QA = [...DEFAULT_QA];

// ─────────────────────────────────────────────
// FILE IMPORT FUNCTIONALITY
// ─────────────────────────────────────────────

function updateQACount() {
  const count = QA.length;
  document.getElementById('qa-count-chip').textContent = '🗂 ' + count + ' Question' + (count !== 1 ? 's' : '');
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
      showImportStatus('✅ Successfully imported ' + qa.length + ' question' + (qa.length !== 1 ? 's' : '') + ' from ' + file.name, 'success');
    } catch (error) {
      showImportStatus('❌ Import failed: ' + error.message, 'error');
      QA = [...DEFAULT_QA];
      updateQACount();
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

function resetToDefault() {
  localStorage.removeItem('jlpt_qa_data');
  QA = [...DEFAULT_QA];
  updateQACount();
  showImportStatus('↺ Switched to default Q&A database (' + DEFAULT_QA.length + ' questions)', 'info');
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
      QA = JSON.parse(savedQA);
    } catch (e) {
      console.error('Error loading saved QA data:', e);
    }
  }
  updateQACount();
});

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let current   = 0;
let score     = 0;
let results   = [];
let synth         = window.speechSynthesis;
let recog         = null;
let listening     = false;
let liveTranscript = '';
let micStream     = null;

function isSpeechRecognitionSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function abortRecognition() {
  if (!recog) return;
  listening = false;
  try { recog.abort(); } catch (e) {}
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

const ROMAJI_READING_VARIANTS = {
  salamatpo: ['salamatpo', 'salamat', 'さらまっと', 'さらまっとぽ', 'さらまっとぽ'],
  salamat: ['salamat', 'さらまっと', 'さらまっとぽ'],
};

function answerHasRomaji(s) {
  return /[a-zA-Z]/.test(s);
}

function extractRomajiPhrases(answer) {
  return (answer.match(/[a-zA-Z]+(?:\s+[a-zA-Z]+)*/g) || [])
    .map((p) => p.trim().toLowerCase());
}

function compactLatin(s) {
  return s.toLowerCase().replace(/\s+/g, '');
}

function transcriptHasRomajiPhrase(raw, furiganaNorm, phrase) {
  const compact = compactLatin(phrase);
  if (compactLatin(raw).includes(compact)) return true;
  const variants = ROMAJI_READING_VARIANTS[compact]
    || ROMAJI_READING_VARIANTS[compact.replace(/po$/, '')]
    || [];
  return variants.some((v) =>
    (/^[a-z]+$/.test(v) ? compactLatin(raw).includes(v) : furiganaNorm.includes(v))
  );
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

const PARTICLES_COMPOUND = ['から','まで','より','ので','のに','ては','では','には','とは',
  'ながら','として','について','によって','において'];
const PARTICLES_SINGLE   = ['で','に','を','が','は','へ','と','も','か','や','の'];

function extractParticleTokens(s) {
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    let matched = false;
    for (const p of PARTICLES_COMPOUND) {
      if (s.startsWith(p, i)) {
        const prefix = s.slice(Math.max(0, i - 4), i);
        tokens.push(prefix + '|' + p);
        i += p.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      for (const p of PARTICLES_SINGLE) {
        if (s.startsWith(p, i) && i >= 3) {
          const prefix = s.slice(Math.max(0, i - 4), i);
          tokens.push(prefix + '|' + p);
          i += p.length;
          matched = true;
          break;
        }
      }
    }
    if (!matched) i++;
  }
  return tokens;
}

function particlesMatchNorm(tNorm, aNorm) {
  const answerParticles = extractParticleTokens(aNorm);
  if (answerParticles.length === 0) return true;
  const transcriptParticles = new Set(extractParticleTokens(tNorm));
  for (const pt of answerParticles) {
    if (!transcriptParticles.has(pt)) return false;
  }
  return true;
}

function particlesMatch(transcript, answer) {
  return particlesMatchNorm(normalizeTranscript(transcript, answer), normalizeAnswer(answer));
}

function stripLatin(s) {
  return s.replace(/[a-zA-Z]+/g, '');
}

function gradeAnswerWithRomaji(raw, answer) {
  const furiganaNorm = normalizeTranscript(raw, answer);
  const aNorm = normalizeAnswer(answer);
  const tJp = stripLatin(furiganaNorm);
  const aJp = stripLatin(aNorm);
  if (!particlesMatchNorm(tJp, aJp)) return false;
  const coreScore = !aJp.length ? 1
    : tJp === aJp ? 1
    : lcsLength(tJp, aJp) / aJp.length;
  if (coreScore < 0.55) return false;
  const phrases = extractRomajiPhrases(answer);
  const hasRomaji = phrases.some((p) => transcriptHasRomajiPhrase(raw, furiganaNorm, p));
  return hasRomaji ? coreScore >= 0.55 : coreScore >= 0.75;
}

function answerHasKatakanaLoanword(answer) {
  const katakana = (answer.match(/[゠-ヿ]+/g) || []).join('');
  return katakana.length >= 2;
}

function extractMainKatakana(answer) {
  const match = answer.match(/[゠-ヿ]+/);
  return match ? match[0] : null;
}

function katakanaAppearsInTranscript(katakana, transcriptHiragana) {
  if (!katakana) return true;
  const kataHira = katakanaToHiragana(katakana);
  return transcriptHiragana.includes(kataHira);
}

function isCorrect(rawTranscript, answer) {
  if (answerHasRomaji(answer)) return gradeAnswerWithRomaji(rawTranscript, answer);

  const t = normalizeTranscript(rawTranscript, answer);
  const a = normalizeAnswer(answer);

  if (answerHasKatakanaLoanword(answer)) {
    const mainKata = extractMainKatakana(answer);
    if (mainKata && !katakanaAppearsInTranscript(mainKata, t)) {
      return false;
    }
    return similarity(rawTranscript, answer) >= 0.70;
  }

  if (!particlesMatch(rawTranscript, answer)) return false;
  return similarity(rawTranscript, answer) >= 0.65;
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

function showResult(correct, transcript, answer) {
  const badge = document.getElementById('result-badge');
  const icon  = document.getElementById('result-icon');
  const msg   = document.getElementById('result-msg');
  const rev   = document.getElementById('answer-reveal');
  badge.className = 'result-badge ' + (correct ? 'correct' : 'wrong');
  icon.textContent = correct ? '✅' : '❌';
  msg.textContent  = correct ? '正解！ Correct!' : '不正解。 Incorrect.';
  if (!correct) {
    rev.replaceChildren();
    const strong = document.createElement('strong');
    strong.textContent = 'Correct answer: ';
    rev.append(strong, document.createTextNode(answer));
  } else {
    rev.textContent = '';
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
    if (liveTranscript && document.getElementById('btn-next').classList.contains('hidden')) {
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
  startListening((err) => {
    setStatus('', 'Error: ' + err);
    if (err.includes('permission')) {
      document.getElementById('warning-box').style.display = 'block';
    }
    showBtn('btn-rerecord', true);
    showBtn('btn-skip',     true);
  });
}

function submitAnswer() {
  abortRecognition();
  showBtn('btn-submit', false);
  const item       = QA[current];
  const raw = liveTranscript.trim();

  if (!raw) {
    setStatus('', 'No speech captured — try re-recording.');
    showBtn('btn-rerecord', true);
    showBtn('btn-skip',     true);
    return;
  }

  const furiganaReading = transcriptToFuriganaForGrading(raw, item.a);
  setStatus('checking', 'Checking your answer…');
  showCheckedTranscript(raw, furiganaReading);
  const correct = isCorrect(raw, item.a);
  if (correct) score++;
  results.push({ q: item.q, a: item.a, transcript: raw, furigana: furiganaReading, correct });
  showResult(correct, raw, item.a);
  showBtn('btn-next',     true);
  showBtn('btn-rerecord', !correct);
  showBtn('btn-skip',     false);
  setStatus('', correct ? 'Correct! 🎉' : 'Incorrect. Review the answer.');
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
    let label = 'Heard: ' + r.transcript;
    if (r.furigana) label += ' · Checked: ' + r.furigana;
    ans.textContent = label;
    div.append(tag, rq, ans);
    if (!r.correct) {
      const expected = document.createElement('div');
      expected.className = 'ra';
      expected.textContent = '✔ Expected: ' + r.a;
      div.appendChild(expected);
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
}

window.speechSynthesis.getVoices();
