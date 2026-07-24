"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const SUGGESTIONS = [
  "adventurous", "affectionate", "ambitious", "amiable", "artistic", "athletic",
  "beautiful", "blessed", "bookish", "brave", "calm", "caring", "charitable",
  "charming", "cheerful", "compassionate", "confident", "considerate", "content",
  "cooking", "courteous", "creative", "curious", "dependable", "devoted",
  "diligent", "disciplined", "easygoing", "educated", "elegant", "emotional",
  "energetic", "expressive", "faithful", "familyoriented", "fashionable",
  "fit", "flexible", "focused", "forgiving", "friendly", "generous", "gentle",
  "giving", "godfearing", "graceful", "grateful", "grounded", "happy",
  "hardworking", "humble", "humorous", "independent", "innocent", "joyful",
  "just", "khat", "kind", "knowledgeable", "loving", "loyal", "mindful",
  "modest", "motivated", "musical", "nurturing", "obedient", "openminded",
  "optimistic", "organized", "outgoing", "passionate", "patient", "peaceful",
  "playful", "polite", "prayerful", "professional", "progressive", "protective",
  "punctual", "purposeful", "respectful", "righteous", "romantic", "sincere",
  "social", "spiritual", "stable", "supportive", "thoughtful", "tolerant",
  "traditional", "travel", "trustworthy", "understanding", "virtuous",
  "volunteering", "warm", "welcoming", "wise", "cooking", "baking",
  "reading", "writing", "hiking", "swimming", "jogging", "yoga",
  "painting", "drawing", "photography", "gardening", "fishing", "camping",
  "cycling", "running", "soccer", "basketball", "volleyball", "tennis",
  "quran", "sunnah", "fiqh", "tajweed", "hifdh", "dua", "dhikr",
  "islamicstudies", "seerah", "hadith", "tahajjud", "fajr", "dhuhr",
  "asr", "maghrib", "isha", "ramadan", "sadaqah", "zakat", "hajj",
  "umrah", "nikah", "mahr", "halal", "haram", "sabr", "shukr",
  "cookingethiopian", "injera", "doro", "coffee", "buna",
  "adventure", "charity", "community", "family", "fitness",
  "gardening", "homeschooling", "languages", "nature", "poetry",
  "calligraphy", "handicrafts", "sewing", "knitting",
  "decorating", "organizing", "planning", "mentoring", "teaching",
  "learning", "exploring", "discovering", "growing",
];
function getCurrentWord(text: string, cursorPos: number): { word: string; start: number; end: number } {
  if (cursorPos === 0) return { word: "", start: 0, end: 0 };
  const before = text.slice(0, cursorPos);
  const after = text.slice(cursorPos);
  const wordStart = Math.max(before.lastIndexOf(" ") + 1, before.lastIndexOf("\n") + 1, before.lastIndexOf(",") + 1, 0);
  const wordEnd = cursorPos + Math.max(after.search(/[\s,.\n]|$/), 0);
  return { word: text.slice(wordStart, cursorPos), start: wordStart, end: wordEnd };
}

export default function WordSuggest({ value, onChange, placeholder, rows, className }: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPos, setCursorPos] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });

  const updateSuggestions = useCallback((text: string, pos: number) => {
    const { word } = getCurrentWord(text, pos);
    if (!word || word.length < 1) { setSuggestions([]); return; }
    const matches = SUGGESTIONS.filter((s) => s.startsWith(word.toLowerCase()) && s !== word.toLowerCase());
    setSuggestions(matches.slice(0, 8));
    setSelectedIdx(-1);
  }, []);

  const applySuggestion = useCallback((suggestion: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { start, end } = getCurrentWord(value, cursorPos);
    const newText = value.slice(0, start) + suggestion + value.slice(end);
    onChange(newText);
    setSuggestions([]);
    requestAnimationFrame(() => {
      ta.focus();
      const newPos = start + suggestion.length;
      ta.setSelectionRange(newPos, newPos);
      setCursorPos(newPos);
    });
  }, [value, cursorPos, onChange]);

  const handleSelect = (s: string) => applySuggestion(s);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    onChange(newVal);
    const pos = e.target.selectionStart;
    setCursorPos(pos);
    updateSuggestions(newVal, pos);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length === 0) return;
    if (e.key === "Tab" || (e.key === "Enter" && selectedIdx >= 0)) {
      e.preventDefault();
      if (selectedIdx >= 0) applySuggestion(suggestions[selectedIdx]);
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, suggestions.length - 1)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); return; }
    if (e.key === "Escape") { setSuggestions([]); return; }
  };

  const handleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const pos = (e.target as HTMLTextAreaElement).selectionStart;
    setCursorPos(pos);
    updateSuggestions(value, pos);
  };

  const handleBlur = () => {
    setTimeout(() => setSuggestions([]), 200);
  };

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta || suggestions.length === 0) return;
    const { word } = getCurrentWord(value, cursorPos);
    const lineHeight = parseFloat(getComputedStyle(ta).lineHeight || "20");
    const textBefore = value.slice(0, cursorPos);
    const lines = textBefore.split("\n");
    const currentLine = lines.length - 1;
    const col = lines[currentLine]?.length || 0;
    const charWidth = 8;
    const topOffset = (currentLine + 1) * lineHeight;
    const leftOffset = Math.min(col * charWidth, ta.clientWidth - 200);
    setPopupPos({ top: topOffset + 4, left: leftOffset + 8 });
  }, [suggestions, cursorPos, value]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onBlur={handleBlur}
        onScroll={() => setSuggestions([])}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />
      {suggestions.length > 0 && (
        <div
          className="absolute z-50 bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 rounded-lg shadow-xl max-h-40 overflow-y-auto"
          style={{ top: popupPos.top, left: popupPos.left, minWidth: 160 }}
        >
          {suggestions.map((s, i) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
              className={`block w-full text-left px-3 py-1.5 text-sm transition-colors ${
                i === selectedIdx
                  ? "bg-accent/10 text-accent"
                  : "text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
