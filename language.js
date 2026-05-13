// language.js — Language preference manager and translator for Idot 2
// Stores user language preferences in a local JSON file.
// Uses Claude to translate all bot responses into the user's chosen language.

const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const STORAGE_PATH = path.join(__dirname, 'languages.json');

// ─── Supported Languages ──────────────────────────────────────────────────────
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', flag: '🇲🇾' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'cs', name: 'Czech', flag: '🇨🇿' },
  { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
  { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
  { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
  { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
  { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
  { code: 'lt', name: 'Lithuanian', flag: '🇱🇹' },
  { code: 'lv', name: 'Latvian', flag: '🇱🇻' },
  { code: 'et', name: 'Estonian', flag: '🇪🇪' },
  { code: 'sr', name: 'Serbian', flag: '🇷🇸' },
  { code: 'ca', name: 'Catalan', flag: '🏴' },
  { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'fa', name: 'Persian (Farsi)', flag: '🇮🇷' },
  { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
  { code: 'pa', name: 'Punjabi', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
  { code: 'sq', name: 'Albanian', flag: '🇦🇱' },
  { code: 'hy', name: 'Armenian', flag: '🇦🇲' },
  { code: 'ka', name: 'Georgian', flag: '🇬🇪' },
];

// ─── Storage Helpers ──────────────────────────────────────────────────────────
function loadPreferences() {
  try {
    if (!fs.existsSync(STORAGE_PATH)) {
      fs.writeFileSync(STORAGE_PATH, JSON.stringify({}), 'utf8');
    }
    return JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function savePreferences(prefs) {
  try {
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(prefs, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save language preferences:', err);
  }
}

function getUserLanguage(userId) {
  const prefs = loadPreferences();
  return prefs[userId] || 'en';
}

function setUserLanguage(userId, langCode) {
  const prefs = loadPreferences();
  prefs[userId] = langCode;
  savePreferences(prefs);
}

// ─── Translation ──────────────────────────────────────────────────────────────
async function translate(text, langCode) {
  if (langCode === 'en') return text; // No translation needed

  const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
  if (!lang) return text;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are a translator. Translate the given text into ${lang.name}.
Rules:
- Preserve the tone exactly — if it's funny, sarcastic, savage, or casual, keep it that way in the target language.
- Preserve any emoji exactly as-is.
- Do not add explanations, notes, or preamble. Return ONLY the translated text.
- Preserve Discord markdown formatting (**, \`, etc.).`,
      messages: [{ role: 'user', content: text }],
    });

    return response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim() || text;
  } catch (err) {
    console.error('Translation error:', err);
    return text; // Fallback to original if translation fails
  }
}

// ─── Build language select pages (25 per page max for Discord select menus) ──
function getLanguagePage(page = 0) {
  const pageSize = 25;
  const start = page * pageSize;
  return SUPPORTED_LANGUAGES.slice(start, start + pageSize);
}

function getTotalPages() {
  return Math.ceil(SUPPORTED_LANGUAGES.length / 25);
}

module.exports = {
  SUPPORTED_LANGUAGES,
  getUserLanguage,
  setUserLanguage,
  translate,
  getLanguagePage,
  getTotalPages,
};
