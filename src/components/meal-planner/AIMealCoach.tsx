"use client"

import React, { useState } from 'react';
import { Bot, Send, RefreshCw, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MealType } from '@/lib/types';

interface AIMealCoachProps {
  weekStartDate: string;
  onApplySuggestions: (suggestions: { day: number; mealType: MealType; dishName: string }[]) => void;
  lang: 'en' | 'ar';
}

interface Suggestion {
  day: number;
  mealType: MealType;
  dishName: string;
}

const PROMPT_CHIPS = [
  { en: 'Plan dinners this week', ar: 'خطط عشاء الأسبوع' },
  { en: 'Suggest kid-friendly lunches', ar: 'اقترح غداءً للأطفال' },
  { en: 'Use what\'s in the fridge', ar: 'استخدم ما في الثلاجة' },
  { en: 'High-protein week', ar: 'أسبوع غني بالبروتين' },
];

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];
const DAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LABELS_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

const MEAL_LABELS: Partial<Record<MealType, { en: string; ar: string }>> = {
  breakfast: { en: 'Breakfast', ar: 'إفطار' },
  lunch:     { en: 'Lunch',     ar: 'غداء'  },
  dinner:    { en: 'Dinner',    ar: 'عشاء'  },
};

async function callGemini(promptText: string): Promise<Suggestion[]> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error('No Gemini API key');

  const systemPrompt = `You are a helpful family meal planning assistant.
Respond ONLY with valid JSON in this exact format, no markdown, no explanation:
{"suggestions": [{"day": 0, "mealType": "breakfast", "dishName": "Pancakes"}, ...]}
day is 0-6 (Sunday=0). mealType is one of: breakfast, lunch, dinner.
Provide at most 21 suggestions (7 days × 3 meal types). Keep dish names short and family-friendly.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt + '\n\nUser request: ' + promptText },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

  const data = await response.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed?.suggestions)) throw new Error('Invalid response shape');

  return (parsed.suggestions as Suggestion[])
    .filter(
      s =>
        typeof s.day === 'number' &&
        s.day >= 0 &&
        s.day <= 6 &&
        MEAL_TYPES.includes(s.mealType) &&
        typeof s.dishName === 'string'
    )
    .slice(0, 28);
}

export function AIMealCoach({ weekStartDate, onApplySuggestions, lang }: AIMealCoachProps) {
  const isRtl = lang === 'ar';
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dayLabels = isRtl ? DAY_LABELS_AR : DAY_LABELS_EN;

  const handleChip = (chip: { en: string; ar: string }) => {
    setPrompt(isRtl ? chip.ar : chip.en);
  };

  const handleSend = async (customPrompt?: string) => {
    const text = customPrompt ?? prompt;
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setSuggestions(null);

    try {
      const result = await callGemini(text);
      setSuggestions(result);
    } catch {
      setError(isRtl ? 'الذكاء الاصطناعي غير متاح — حاول مرة أخرى لاحقاً' : 'AI unavailable — try again later');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!suggestions) return;
    onApplySuggestions(suggestions);
    setSuggestions(null);
    setPrompt('');
  };

  const handleCancel = () => {
    setSuggestions(null);
    setError(null);
  };

  const getSuggestion = (day: number, mealType: MealType): string => {
    const s = suggestions?.find(s => s.day === day && s.mealType === mealType);
    return s?.dishName ?? '–';
  };

  return (
    <div
      className="rounded-[2.5rem] border overflow-hidden shadow-sm"
      style={{ background: 'linear-gradient(135deg, #FFF8E1 0%, #FFF3E0 100%)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Bot className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-black text-amber-900">
            {isRtl ? 'مساعد تخطيط الوجبات بالذكاء الاصطناعي' : 'AI Meal Coach'}
          </h2>
        </div>
        <p className="text-xs text-amber-700/70 font-medium">
          {isRtl
            ? 'اطلب اقتراحات مخصصة لوجبات الأسبوع'
            : 'Ask for personalised meal suggestions for the week'}
        </p>
      </div>

      <div className="px-6 pb-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {PROMPT_CHIPS.map((chip, i) => (
            <button
              key={i}
              onClick={() => handleChip(chip)}
              className={cn(
                'px-3 py-1.5 rounded-full border text-xs font-bold transition-all',
                prompt === (isRtl ? chip.ar : chip.en)
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white/80 text-amber-800 border-amber-200 hover:border-orange-400 hover:bg-orange-50'
              )}
            >
              {isRtl ? chip.ar : chip.en}
            </button>
          ))}
        </div>

        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder={isRtl ? 'أو اكتب طلبك هنا...' : 'Or type your request here...'}
          rows={3}
          className={cn(
            'w-full resize-none border rounded-2xl px-4 py-3 text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-orange-400/50 placeholder:text-amber-700/40',
            isRtl ? 'text-right' : ''
          )}
        />

        <button
          onClick={() => handleSend()}
          disabled={!prompt.trim() || loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-500 text-white font-bold text-sm disabled:opacity-40 transition-all hover:bg-orange-600 shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isRtl ? 'جاري التفكير...' : 'Thinking...'}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {isRtl ? 'إرسال' : 'Send'}
            </>
          )}
        </button>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            <X className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {suggestions && suggestions.length > 0 && (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden border border-amber-200 bg-white/90">
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[600px]">
                  <thead>
                    <tr className="bg-amber-50">
                      <th className="py-2 px-3 font-black text-amber-800 text-left border-b border-amber-100">
                        {isRtl ? 'وجبة' : 'Meal'}
                      </th>
                      {Array.from({ length: 7 }, (_, i) => (
                        <th key={i} className="py-2 px-2 font-black text-amber-800 border-b border-amber-100 text-center">
                          {dayLabels[i]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MEAL_TYPES.map(mealType => (
                      <tr key={mealType} className="border-b border-amber-50 last:border-0">
                        <td className="py-2 px-3 font-bold text-amber-900 whitespace-nowrap">
                          {MEAL_LABELS[mealType]?.[lang] ?? mealType}
                        </td>
                        {Array.from({ length: 7 }, (_, day) => {
                          const name = getSuggestion(day, mealType);
                          return (
                            <td key={day} className="py-2 px-2 text-center text-muted-foreground">
                              {name === '–' ? (
                                <span className="opacity-30">–</span>
                              ) : (
                                <span className="text-foreground font-medium">{name}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleApply}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-sm"
              >
                <Check className="w-4 h-4" />
                {isRtl ? 'تطبيق على المخطط' : 'Apply to Planner'}
              </button>
              <button
                onClick={() => handleSend()}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-amber-300 bg-white/80 text-amber-800 font-bold text-sm hover:bg-amber-50 transition-all disabled:opacity-40"
              >
                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                {isRtl ? 'إعادة توليد' : 'Regenerate'}
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 bg-white/80 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all"
              >
                <X className="w-4 h-4" />
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
