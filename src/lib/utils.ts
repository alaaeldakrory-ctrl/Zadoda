import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, addMinutes, parse, isSameDay, startOfWeek, addDays, getDay } from 'date-fns';
import { CalendarEventSeries, CalendarEventOccurrenceOverride, RecurrenceRule, Person, Language } from './types';
import { PlaceHolderImages } from './placeholder-images';
import { getTranslation } from './i18n';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPersonName(person: Person, lang: Language): string {
  if (!person) return '';
  const t = getTranslation(lang);
  // @ts-ignore - Dynamically check for person names in translations
  const translatedName = t[`${person.id}Name`] || t[person.id];
  return translatedName || person.name;
}

export function getAvatarUrl(personIdOrName: string): string {
  if (!personIdOrName) return 'https://picsum.photos/seed/default/100/100';
  
  const cleanKey = personIdOrName.toLowerCase().trim();
  
  // Try ID first (most robust)
  if (cleanKey.startsWith('person')) {
    const idMap: Record<string, string> = {
      person1: 'lyla',
      person2: 'malika',
      person3: 'mohamed',
      person4: 'wesam'
    };
    const nameKey = idMap[cleanKey];
    if (nameKey) {
      const avatar = PlaceHolderImages.find(img => img.id === `avatar-${nameKey}`);
      if (avatar) return avatar.imageUrl;
    }
  }

  // Fallback to name-based lookup
  const avatar = PlaceHolderImages.find(img => img.id === `avatar-${cleanKey}`);
  return avatar?.imageUrl || `https://picsum.photos/seed/${cleanKey}/100/100`;
}

export function formatTime(time24h: string): string {
  try {
    if (!time24h) return '';
    const date = parse(time24h, 'HH:mm', new Date());
    return format(date, 'h:mm a');
  } catch (e) {
    return time24h;
  }
}

export function generateTimeSlots(start: string, end: string, interval: number = 30) {
  const slots: string[] = [];
  try {
    let current = parse(start, 'HH:mm', new Date());
    const stop = parse(end, 'HH:mm', new Date());

    while (current <= stop) {
      slots.push(format(current, 'HH:mm'));
      current = addMinutes(current, interval);
    }
  } catch (e) {
    console.error("Error generating time slots", e);
  }
  return slots;
}

export function getOccurrencesForDate(series: CalendarEventSeries[], date: Date, overrides: CalendarEventOccurrenceOverride[]) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayIdx = getDay(date);

  return series.filter(s => {
    if (s.exceptions.includes(dateStr)) return false;
    if (dateStr < s.startDate) return false;
    
    // Simple recurrence check
    const r = s.recurrence;
    if (r.frequency === 'NONE') {
      return s.startDate === dateStr;
    }
    
    if (r.untilDate && dateStr > r.untilDate) return false;

    if (r.frequency === 'DAILY') {
      // Check interval
      const start = new Date(s.startDate);
      const diffTime = Math.abs(date.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays % r.interval === 0;
    }

    if (r.frequency === 'WEEKLY') {
      return r.byWeekday?.includes(dayIdx);
    }

    if (r.frequency === 'MONTHLY') {
      const dayOfMonth = date.getDate();
      return r.byMonthDay === dayOfMonth;
    }

    return false;
  }).map(s => {
    const override = overrides.find(o => o.seriesId === s.id && o.date === dateStr);
    return {
      id: `${s.id}_${dateStr}`, // Unique ID for the specific occurrence
      seriesId: s.id,
      series: s,
      date: dateStr,
      override,
      title: override?.title || s.title,
      startTime: override?.startTime || s.startTime,
      endTime: override?.endTime || s.endTime,
      personId: override?.personId || s.personId,
      notes: override?.notes || s.notes,
      completed: !!override?.completed,
      isImportant: override?.isImportant ?? s.isImportant,
      isForAll: s.personId === 'all' || override?.personId === 'all',
      isForKids: s.personId === 'kids' || override?.personId === 'kids'
    };
  });
}

export function timeToMinutes(time: string) {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(mins: number): string {
  const cappedMins = Math.max(0, Math.min(mins, 1439)); // Cap between 00:00 and 23:59
  const h = Math.floor(cappedMins / 60);
  const m = cappedMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getGridPosition(startTime: string, endTime: string, dayStart: string, slotHeight15Min: number = 40) {
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  const dayStartMins = timeToMinutes(dayStart);

  const top = ((startMins - dayStartMins) / 15) * slotHeight15Min;
  const height = ((endMins - startMins) / 15) * slotHeight15Min;

  return { top, height };
}
