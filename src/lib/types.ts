
export type Language = 'en' | 'ar';

export interface Person {
  id: string;
  name: string;
  color: string;
  role: 'parent' | 'child';
  avatarUrl?: string;
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
  defaultAssignedTo: string; // personId or 'random'
  isActive: boolean;
}

export interface ChoreOverride {
  id: string; // choreId + date
  choreId: string;
  date: string; // YYYY-MM-DD
  assignedTo?: string; // personId
  completed?: boolean;
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
  defaultDurationMinutes: number; // Multiple of 15
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
  familyName?: string;
  pin?: string;
}

export interface TaskExecutionLog {
  id: string;
  childId: string;
  taskId: string;
  routineId?: string; // Optional if it's a standalone task
  type: 'calendar' | 'chore' | 'checklist' | 'memo';
  date: string; // ISO_date YYYY-MM-DD
  completed: boolean;
  completionTimeSeconds: number; // For now, can be estimated or calculated from delay
  expectedTimeSeconds: number;
}

export interface Goal {
  id: string;
  childId: string;
  title: string;
  linkedRoutineId?: string;
  linkedTaskIds?: string[];
  successCriteria: {
    type: 'streak';
    targetDays: number;
  };
  status: 'active' | 'completed' | 'paused';
  createdAt: string; // ISO_date
}

export interface RewardRule {
  id: string;
  title: string;
  pointsRequired: number;
  type: 'reward' | 'penalty';
}

export interface ParentLog {
  id: string;
  childId: string;
  date: string; // ISO_date YYYY-MM-DD
  overallMood: 'good' | 'neutral' | 'bad';
  goodItems: string[]; 
  badItems: string[];
  note?: string;
}

export type ChecklistScoringMode =
  | 'always'     // counted every day (default for most routines)
  | 'never'      // never counted (reference-only checklist)
  | 'on-demand'; // only counted on days a parent explicitly activates it

export interface Checklist {
  id: string;
  title: string;
  items: string[];
  assignedTo: string; // personId | 'all' | 'kids'
  createdAt: number;
  countForScoring?: boolean;    // legacy field — superseded by scoringMode
  scoringMode?: ChecklistScoringMode;
  deletedAt?: number;           // set on soft-delete; permanent removal after 30 days
}

export interface ChecklistDayActivation {
  id: string;   // `${checklistId}_${date}`
  checklistId: string;
  date: string; // YYYY-MM-DD
  active: boolean;
}

export interface FamilyMembership {
  uid: string;
  familyId: string; // the owner's uid whose family this member joined
  joinedAt: number;
}

export interface FamilyInvitation {
  code: string;
  familyId: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

export interface ChecklistCompletion {
  id: string; // `${date}_${personId}_${checklistId}_${itemIndex}`
  checklistId: string;
  personId: string;
  date: string; // YYYY-MM-DD
  itemIndex: number;
  completed: boolean;
}

// ── Parent self-reflection journal (Mohamed & Wesam reflect on their own parenting) ──
export interface ParentSelfLog {
  id: string;
  parentId: string; // 'person3' = Mohamed, 'person4' = Wesam
  date: string;     // YYYY-MM-DD
  overallFeeling: 'good' | 'neutral' | 'needs_work';
  goodThings: string[];    // up to 5 — things they did well as a parent
  improveThings: string[]; // up to 5 — things to work on
  reflection?: string;     // free-form note about parenting Lyla & Malika
}

