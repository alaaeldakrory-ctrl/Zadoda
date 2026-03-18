
export type Language = 'en' | 'ar';

export interface Person {
  id: string; // "person1", "person2", "person3", "person4"
  name: string;
  color: string;
}

export interface Memo {
  id: string;
  personId: string;
  title: string;
  content: string;
  createdAt: number;
  completed?: boolean;
}

export interface Chore {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // personId or 'random'
  isActive: boolean;
}

export type RecurrenceFrequency = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval: number;
  byWeekday?: number[]; // 0-6 (Sun-Sat)
  byMonthDay?: number;
  untilDate?: string; // YYYY-MM-DD
  count?: number;
}

export interface CalendarEventSeries {
  id: string;
  personId: string;
  title: string;
  notes?: string;
  templateId?: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  startDate: string; // YYYY-MM-DD
  recurrence: RecurrenceRule;
  exceptions: string[]; // Dates (YYYY-MM-DD) that are excluded
  isImportant?: boolean;
}

export interface CalendarEventOccurrenceOverride {
  id: string; // seriesId + date
  seriesId: string;
  date: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  personId?: string;
  notes?: string;
  completed: boolean;
  completedAt?: number;
  isImportant?: boolean;
}

export interface FixedEventTemplate {
  id: string;
  name: string;
  defaultDurationMinutes: number; // Multiple of 30
  defaultTime?: string; // HH:mm
  defaultAssigneePersonId?: string;
  notes?: string;
  color?: string;
}

export interface AppSettings {
  id: string;
  dayStartTime: string; // HH:mm
  dayEndTime: string;   // HH:mm
  language: Language;
}
