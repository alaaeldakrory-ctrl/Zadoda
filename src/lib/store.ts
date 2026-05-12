
"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Person, CalendarEventSeries, CalendarEventOccurrenceOverride, FixedEventTemplate, AppSettings, Language, Memo, Chore, ChoreOverride, TaskExecutionLog, Goal, RewardRule, ParentLog, ParentSelfLog, Checklist, ChecklistCompletion } from './types';
import { timeToMinutes, minutesToTime } from './utils';
import {
  useCollection,
  useDoc,
  useUser,
  useFirestore,
  useAuth,
  useMemoFirebase,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  signOutUser,
} from '@/firebase';
import { collection, doc, query } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface StoreContextValue {
  persons: Person[];
  series: CalendarEventSeries[];
  overrides: CalendarEventOccurrenceOverride[];
  templates: FixedEventTemplate[];
  memos: Memo[];
  chores: Chore[];
  choreOverrides: ChoreOverride[];
  executionLogs: TaskExecutionLog[];
  goals: Goal[];
  rewardRules: RewardRule[];
  parentLogs: ParentLog[];
  parentSelfLogs: ParentSelfLog[];
  checklists: Checklist[];
  checklistCompletions: ChecklistCompletion[];
  settings: AppSettings;
  isLoading: boolean;
  isParentUnlocked: boolean;
  currentUser: User | null;
  isAuthLoading: boolean;
  unlockParent: (pin: string) => boolean;
  lockParent: () => void;
  signOut: () => Promise<void>;
  setLanguage: (lang: Language) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  addPerson: (person: Omit<Person, 'id'>) => void;
  deletePerson: (id: string) => void;
  addSeries: (s: CalendarEventSeries) => void;
  updateSeries: (id: string, updates: Partial<CalendarEventSeries>) => void;
  deleteSeries: (id: string) => void;
  addTemplate: (t: FixedEventTemplate) => void;
  updateTemplate: (id: string, updates: Partial<FixedEventTemplate>) => void;
  deleteTemplate: (id: string) => void;
  addMemo: (m: Memo) => void;
  updateMemo: (id: string, updates: Partial<Memo>) => void;
  deleteMemo: (id: string) => void;
  toggleMemoCompletion: (id: string) => void;
  addChore: (c: Chore) => void;
  updateChore: (id: string, updates: Partial<Chore>) => void;
  deleteChore: (id: string) => void;
  updateChoreOverride: (choreId: string, date: string, updates: Partial<ChoreOverride>) => void;
  deleteChoreOverride: (choreId: string, date: string) => void;
  toggleCompletion: (seriesId: string, date: string) => void;
  updateOccurrence: (seriesId: string, date: string, updates: Partial<CalendarEventOccurrenceOverride>) => void;
  moveEvent: (seriesId: string, date: string, newStartTime: string, newPersonId: string) => void;
  addTaskExecutionLog: (log: Omit<TaskExecutionLog, 'id'>) => void;
  addParentLog: (log: Omit<ParentLog, 'id'>) => void;
  updateParentLog: (id: string, updates: Partial<ParentLog>) => void;
  deleteParentLog: (id: string) => void;
  addParentSelfLog: (log: Omit<ParentSelfLog, 'id'>) => void;
  updateParentSelfLog: (id: string, updates: Partial<ParentSelfLog>) => void;
  deleteParentSelfLog: (id: string) => void;
  addChecklist: (c: Omit<Checklist, 'id' | 'createdAt'>) => void;
  updateChecklist: (id: string, updates: Partial<Checklist>) => void;
  deleteChecklist: (id: string) => void;
  setChecklistItemDone: (checklistId: string, personId: string, date: string, itemIndex: number, done: boolean) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const DEFAULT_SETTINGS: AppSettings = {
  id: 'global',
  dayStartTime: '05:00',
  dayEndTime: '22:00',
  language: 'en',
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  // Only load family data for authenticated, non-anonymous users
  const familyId = (user && !user.isAnonymous) ? user.uid : null;

  const settingsRef = useMemoFirebase(() => familyId ? doc(db, 'families', familyId, 'settings', 'global') : null, [db, familyId]);
  const { data: settingsData, isLoading: settingsLoading } = useDoc<AppSettings>(settingsRef);

  const peopleRef = useMemoFirebase(() => familyId ? collection(db, 'families', familyId, 'people') : null, [db, familyId]);
  const { data: personsData, isLoading: personsLoading } = useCollection<Person>(peopleRef);

  const templatesRef = useMemoFirebase(() => familyId ? collection(db, 'families', familyId, 'fixedEventTemplates') : null, [db, familyId]);
  const { data: templatesData, isLoading: templatesLoading } = useCollection<FixedEventTemplate>(templatesRef);

  const seriesRef = useMemoFirebase(() => familyId ? collection(db, 'families', familyId, 'calendarEventSeries') : null, [db, familyId]);
  const { data: seriesData, isLoading: seriesLoading } = useCollection<CalendarEventSeries>(seriesRef);

  const overridesRef = useMemoFirebase(() => familyId ? collection(db, 'families', familyId, 'eventOccurrenceOverrides') : null, [db, familyId]);
  const { data: overridesData, isLoading: overridesLoading } = useCollection<CalendarEventOccurrenceOverride>(overridesRef);

  const memosRef = useMemoFirebase(() => familyId ? collection(db, 'families', familyId, 'memos') : null, [db, familyId]);
  const { data: memosData, isLoading: memosLoading } = useCollection<Memo>(memosRef);

  const choresRef = useMemoFirebase(() => familyId ? collection(db, 'families', familyId, 'chores') : null, [db, familyId]);
  const { data: choresData, isLoading: choresLoading } = useCollection<Chore>(choresRef);

  const choreOverridesRef = useMemoFirebase(() => familyId ? collection(db, 'families', familyId, 'choreOverrides') : null, [db, familyId]);
  const { data: choreOverridesData, isLoading: choreOverridesLoading } = useCollection<ChoreOverride>(choreOverridesRef);

  const executionLogsRef = useMemoFirebase(() => familyId ? collection(db, 'families', familyId, 'executionLogs') : null, [db, familyId]);
  const { data: executionLogsData, isLoading: executionLogsLoading } = useCollection<TaskExecutionLog>(executionLogsRef);

  const goalsRef = useMemoFirebase(() => familyId ? collection(db, 'families', familyId, 'goals') : null, [db, familyId]);
  const { data: goalsData, isLoading: goalsLoading } = useCollection<Goal>(goalsRef);

  const rewardRulesRef = useMemoFirebase(() => familyId ? collection(db, 'families', familyId, 'rewardRules') : null, [db, familyId]);
  const { data: rewardRulesData, isLoading: rewardRulesLoading } = useCollection<RewardRule>(rewardRulesRef);

  const parentLogsRef = useMemoFirebase(() => familyId ? collection(db, 'families', familyId, 'parentLogs') : null, [db, familyId]);
  const { data: parentLogsData, isLoading: parentLogsLoading } = useCollection<ParentLog>(parentLogsRef);

  const parentSelfLogsRef = useMemoFirebase(() => familyId ? collection(db, 'families', familyId, 'parentSelfLogs') : null, [db, familyId]);
  const { data: parentSelfLogsData, isLoading: parentSelfLogsLoading } = useCollection<ParentSelfLog>(parentSelfLogsRef);

  const checklistsRef = useMemoFirebase(() => familyId ? collection(db, 'families', familyId, 'checklists') : null, [db, familyId]);
  const { data: checklistsData } = useCollection<Checklist>(checklistsRef);

  const checklistCompletionsRef = useMemoFirebase(() => familyId ? collection(db, 'families', familyId, 'checklistCompletions') : null, [db, familyId]);
  const { data: checklistCompletionsData } = useCollection<ChecklistCompletion>(checklistCompletionsRef);

  const [isParentUnlocked, setIsParentUnlocked] = useState(false);

  // Lock parent section when user changes
  useEffect(() => {
    setIsParentUnlocked(false);
  }, [familyId]);

  const settings = settingsData || DEFAULT_SETTINGS;
  const persons = personsData || [];
  const templates = templatesData || [];
  const series = seriesData || [];
  const memos = memosData || [];
  const chores = choresData || [];
  const choreOverrides = choreOverridesData || [];
  const overrides = overridesData || [];
  const executionLogs = executionLogsData || [];
  const goals = goalsData || [];
  const rewardRules = rewardRulesData || [];
  const parentLogs = parentLogsData || [];
  const parentSelfLogs = parentSelfLogsData || [];
  const checklists = checklistsData || [];
  const checklistCompletions = checklistCompletionsData || [];

  const isLoading = isUserLoading || (!!familyId && (
    settingsLoading ||
    (personsLoading && !personsData) ||
    memosLoading ||
    overridesLoading ||
    choresLoading ||
    choreOverridesLoading ||
    executionLogsLoading ||
    goalsLoading ||
    rewardRulesLoading ||
    parentLogsLoading ||
    parentSelfLogsLoading
  ));

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const fCol = (path: string) => {
    if (!familyId) throw new Error('No authenticated family');
    return collection(db, 'families', familyId, path);
  };

  const fDoc = (path: string, id: string) => {
    if (!familyId) throw new Error('No authenticated family');
    return doc(db, 'families', familyId, path, id);
  };

  // ─── Auth ────────────────────────────────────────────────────────────────────

  const unlockParent = (pin: string) => {
    const correctPin = settings.pin || '1234';
    if (pin === correctPin) {
      setIsParentUnlocked(true);
      return true;
    }
    return false;
  };

  const lockParent = () => setIsParentUnlocked(false);

  const signOut = async () => {
    setIsParentUnlocked(false);
    await signOutUser(auth);
  };

  // ─── Settings ────────────────────────────────────────────────────────────────

  const setLanguage = (language: Language) => {
    if (!settingsRef) return;
    setDocumentNonBlocking(settingsRef, { ...settings, language, id: 'global' }, { merge: true });
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    if (!settingsRef) return;
    setDocumentNonBlocking(settingsRef, { ...settings, ...updates, id: 'global' }, { merge: true });
  };

  // ─── Persons ─────────────────────────────────────────────────────────────────

  const updatePerson = (id: string, updates: Partial<Person>) => {
    const personRef = fDoc('people', id);
    setDocumentNonBlocking(personRef, { ...updates, id }, { merge: true });
  };

  const addPerson = (person: Omit<Person, 'id'>) => {
    const id = `person_${Date.now()}`;
    const personRef = fDoc('people', id);
    setDocumentNonBlocking(personRef, { ...person, id }, { merge: true });
  };

  const deletePerson = (id: string) => {
    deleteDocumentNonBlocking(fDoc('people', id));
  };

  // ─── Series ──────────────────────────────────────────────────────────────────

  const addSeries = (s: CalendarEventSeries) => {
    setDocumentNonBlocking(fDoc('calendarEventSeries', s.id), s, { merge: true });
  };

  const updateSeries = (id: string, updates: Partial<CalendarEventSeries>) => {
    updateDocumentNonBlocking(fDoc('calendarEventSeries', id), updates);
  };

  const deleteSeries = (id: string) => {
    deleteDocumentNonBlocking(fDoc('calendarEventSeries', id));
  };

  // ─── Templates ───────────────────────────────────────────────────────────────

  const addTemplate = (t: FixedEventTemplate) => {
    setDocumentNonBlocking(fDoc('fixedEventTemplates', t.id), t, { merge: true });
  };

  const updateTemplate = (id: string, updates: Partial<FixedEventTemplate>) => {
    updateDocumentNonBlocking(fDoc('fixedEventTemplates', id), updates);
  };

  const deleteTemplate = (id: string) => {
    deleteDocumentNonBlocking(fDoc('fixedEventTemplates', id));
  };

  // ─── Memos ───────────────────────────────────────────────────────────────────

  const addMemo = (m: Memo) => {
    setDocumentNonBlocking(fDoc('memos', m.id), m, { merge: true });
  };

  const updateMemo = (id: string, updates: Partial<Memo>) => {
    const { id: _, ...cleanUpdates } = updates as any;
    updateDocumentNonBlocking(fDoc('memos', id), cleanUpdates);
  };

  const deleteMemo = (id: string) => {
    deleteDocumentNonBlocking(fDoc('memos', id));
  };

  const toggleMemoCompletion = (id: string) => {
    const memo = memos.find(m => m.id === id);
    if (!memo) return;
    updateDocumentNonBlocking(fDoc('memos', id), { completed: !memo.completed });
  };

  // ─── Chores ──────────────────────────────────────────────────────────────────

  const addChore = (c: Chore) => {
    setDocumentNonBlocking(fDoc('chores', c.id), c, { merge: true });
  };

  const updateChore = (id: string, updates: Partial<Chore>) => {
    updateDocumentNonBlocking(fDoc('chores', id), updates);
  };

  const deleteChore = (id: string) => {
    deleteDocumentNonBlocking(fDoc('chores', id));
  };

  const updateChoreOverride = (choreId: string, date: string, updates: Partial<ChoreOverride>) => {
    const overrideId = `${choreId}_${date}`;
    const cleanUpdates = { ...updates };
    if (cleanUpdates.assignedTo === undefined) delete cleanUpdates.assignedTo;

    setDocumentNonBlocking(
      fDoc('choreOverrides', overrideId),
      { ...cleanUpdates, choreId, date, id: overrideId },
      { merge: true }
    );

    if (updates.completed === true) {
      const chore = chores.find(c => c.id === choreId);
      const existingOverride = choreOverrides.find(o => o.id === overrideId);
      const assignee = cleanUpdates.assignedTo || existingOverride?.assignedTo || chore?.defaultAssignedTo || 'unknown';
      addTaskExecutionLog({
        childId: assignee,
        taskId: choreId,
        type: 'chore',
        date,
        completed: true,
        completionTimeSeconds: 60,
        expectedTimeSeconds: 300,
      });
    }
  };

  const deleteChoreOverride = (choreId: string, date: string) => {
    deleteDocumentNonBlocking(fDoc('choreOverrides', `${choreId}_${date}`));
  };

  // ─── Calendar overrides ──────────────────────────────────────────────────────

  const toggleCompletion = (seriesId: string, date: string) => {
    const overrideId = `${seriesId}_${date}`;
    const existing = overrides.find(o => o.id === overrideId);
    const isNowCompleted = !existing?.completed;

    setDocumentNonBlocking(
      fDoc('eventOccurrenceOverrides', overrideId),
      { id: overrideId, seriesId, date, completed: isNowCompleted, completedAt: isNowCompleted ? Date.now() : null },
      { merge: true }
    );

    if (isNowCompleted) {
      const s = series.find(s => s.id === seriesId);
      if (s) {
        const expectedSeconds = (timeToMinutes(s.endTime) - timeToMinutes(s.startTime)) * 60;
        addTaskExecutionLog({
          childId: s.personId,
          taskId: seriesId,
          type: 'calendar',
          date,
          completed: true,
          completionTimeSeconds: expectedSeconds,
          expectedTimeSeconds: expectedSeconds,
        });
      }
    }
  };

  const updateOccurrence = (seriesId: string, date: string, updates: Partial<CalendarEventOccurrenceOverride>) => {
    const overrideId = `${seriesId}_${date}`;
    setDocumentNonBlocking(
      fDoc('eventOccurrenceOverrides', overrideId),
      { ...updates, seriesId, date, id: overrideId },
      { merge: true }
    );
  };

  const moveEvent = (seriesId: string, date: string, newStartTime: string, newPersonId: string) => {
    const targetSeries = series.find(s => s.id === seriesId);
    if (!targetSeries) return;
    const durationMins = timeToMinutes(targetSeries.endTime) - timeToMinutes(targetSeries.startTime);
    const newEndTime = minutesToTime(timeToMinutes(newStartTime) + durationMins);
    updateDocumentNonBlocking(fDoc('calendarEventSeries', seriesId), {
      startTime: newStartTime,
      endTime: newEndTime,
      personId: newPersonId,
      startDate: date,
    });
  };

  // ─── Execution logs ──────────────────────────────────────────────────────────

  const addTaskExecutionLog = (log: Omit<TaskExecutionLog, 'id'>) => {
    if (!familyId) return;
    const ref = doc(fCol('executionLogs'));
    setDocumentNonBlocking(ref, { ...log, id: ref.id });
  };

  // ─── Parent logs ─────────────────────────────────────────────────────────────

  const addParentLog = (log: Omit<ParentLog, 'id'>) => {
    if (!familyId) return;
    const ref = doc(fCol('parentLogs'));
    setDocumentNonBlocking(ref, { ...log, id: ref.id });
  };

  const updateParentLog = (id: string, updates: Partial<ParentLog>) => {
    if (!familyId) return;
    updateDocumentNonBlocking(fDoc('parentLogs', id), updates);
  };

  const deleteParentLog = (id: string) => {
    if (!familyId) return;
    deleteDocumentNonBlocking(fDoc('parentLogs', id));
  };

  // ─── Checklists ──────────────────────────────────────────────────────────────

  const addChecklist = (c: Omit<Checklist, 'id' | 'createdAt'>) => {
    const id = `checklist_${Date.now()}`;
    setDocumentNonBlocking(fDoc('checklists', id), { ...c, id, createdAt: Date.now() }, { merge: true });
  };

  const updateChecklist = (id: string, updates: Partial<Checklist>) => {
    updateDocumentNonBlocking(fDoc('checklists', id), updates);
  };

  const deleteChecklist = (id: string) => {
    deleteDocumentNonBlocking(fDoc('checklists', id));
  };

  const setChecklistItemDone = (checklistId: string, personId: string, date: string, itemIndex: number, done: boolean) => {
    const completionId = `${date}_${personId}_${checklistId}_${itemIndex}`;
    setDocumentNonBlocking(fDoc('checklistCompletions', completionId), {
      id: completionId, checklistId, personId, date, itemIndex, completed: done,
    }, { merge: true });
    if (done) {
      addTaskExecutionLog({
        childId: personId,
        taskId: `${checklistId}-${itemIndex}`,
        routineId: checklistId,
        type: 'checklist',
        date,
        completed: true,
        completionTimeSeconds: 30,
        expectedTimeSeconds: 60,
      });
    }
  };

  // ─── Parent self logs ─────────────────────────────────────────────────────────

  const addParentSelfLog = (log: Omit<ParentSelfLog, 'id'>) => {
    if (!familyId) return;
    const ref = doc(fCol('parentSelfLogs'));
    setDocumentNonBlocking(ref, { ...log, id: ref.id });
  };

  const updateParentSelfLog = (id: string, updates: Partial<ParentSelfLog>) => {
    if (!familyId) return;
    updateDocumentNonBlocking(fDoc('parentSelfLogs', id), updates);
  };

  const deleteParentSelfLog = (id: string) => {
    if (!familyId) return;
    deleteDocumentNonBlocking(fDoc('parentSelfLogs', id));
  };

  const value: StoreContextValue = {
    persons,
    series,
    overrides,
    templates,
    memos,
    chores,
    choreOverrides,
    executionLogs,
    goals,
    rewardRules,
    parentLogs,
    parentSelfLogs,
    checklists,
    checklistCompletions,
    settings,
    isLoading,
    isParentUnlocked,
    currentUser: user,
    isAuthLoading: isUserLoading,
    unlockParent,
    lockParent,
    signOut,
    setLanguage,
    updateSettings,
    updatePerson,
    addPerson,
    deletePerson,
    addSeries,
    updateSeries,
    deleteSeries,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    addMemo,
    updateMemo,
    deleteMemo,
    toggleMemoCompletion,
    addChore,
    updateChore,
    deleteChore,
    updateChoreOverride,
    deleteChoreOverride,
    toggleCompletion,
    updateOccurrence,
    moveEvent,
    addTaskExecutionLog,
    addParentLog,
    updateParentLog,
    deleteParentLog,
    addParentSelfLog,
    updateParentSelfLog,
    deleteParentSelfLog,
    addChecklist,
    updateChecklist,
    deleteChecklist,
    setChecklistItemDone,
  };

  return React.createElement(
    StoreContext.Provider,
    { value },
    React.createElement(
      'div',
      { dir: settings.language === 'ar' ? 'rtl' : 'ltr' },
      children
    )
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
