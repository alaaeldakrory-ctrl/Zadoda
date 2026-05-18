
"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Person, CalendarEventSeries, CalendarEventOccurrenceOverride, FixedEventTemplate, AppSettings, Language, Memo, Chore, ChoreOverride, TaskExecutionLog, Goal, RewardRule, ParentLog, ParentSelfLog, Checklist, ChecklistCompletion, ChecklistDayActivation, FamilyMembership, FamilyInvitation } from './types';
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
import { collection, doc, query, getDoc, setDoc } from 'firebase/firestore';
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
  checklistDayActivations: ChecklistDayActivation[];
  settings: AppSettings;
  isLoading: boolean;
  isParentUnlocked: boolean;
  currentUser: User | null;
  isAuthLoading: boolean;
  familyId: string | null;
  isFamilyOwner: boolean;
  isMembershipLoading: boolean;
  unlockParent: (pin: string) => boolean;
  lockParent: () => void;
  signOut: () => Promise<void>;
  generateInviteCode: () => Promise<string>;
  joinFamily: (code: string) => Promise<{ success: boolean; error?: string }>;
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
  addGoal: (g: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addParentLog: (log: Omit<ParentLog, 'id'>) => void;
  updateParentLog: (id: string, updates: Partial<ParentLog>) => void;
  deleteParentLog: (id: string) => void;
  addParentSelfLog: (log: Omit<ParentSelfLog, 'id'>) => void;
  updateParentSelfLog: (id: string, updates: Partial<ParentSelfLog>) => void;
  deleteParentSelfLog: (id: string) => void;
  addChecklist: (c: Omit<Checklist, 'id' | 'createdAt'>) => void;
  updateChecklist: (id: string, updates: Partial<Checklist>) => void;
  deleteChecklist: (id: string) => void;
  restoreChecklist: (id: string) => void;
  permanentlyDeleteChecklist: (id: string) => void;
  setChecklistItemDone: (checklistId: string, personId: string, date: string, itemIndex: number, done: boolean) => void;
  setChecklistDayActivation: (checklistId: string, date: string, active: boolean) => void;
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

  // ── Family membership resolution ─────────────────────────────────────────────
  // Look up whether this user joined another family via an invite code.
  const membershipRef = useMemoFirebase(
    () => (user && !user.isAnonymous) ? doc(db, 'familyMemberships', user.uid) : null,
    [db, user]
  );
  const { data: membershipData, isLoading: membershipLoading } = useDoc<FamilyMembership>(membershipRef);

  // While membership is loading, familyId is null so no subcollections fire yet.
  // Once resolved: members use the owner's uid; owners use their own uid.
  const familyId = (user && !user.isAnonymous)
    ? (membershipLoading ? null : (membershipData?.familyId ?? user.uid))
    : null;

  const isFamilyOwner = !!(user && familyId === user.uid);
  const isMembershipLoading = isUserLoading || membershipLoading;

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

  const checklistDayActivationsRef = useMemoFirebase(() => familyId ? collection(db, 'families', familyId, 'checklistDayActivations') : null, [db, familyId]);
  const { data: checklistDayActivationsData } = useCollection<ChecklistDayActivation>(checklistDayActivationsRef);

  const isParentUnlocked = true;
  const [localLanguage, setLocalLanguage] = useState<Language>('en');

  // Merge: Firestore language wins when authenticated, local override used otherwise
  const settings = settingsData
    ? settingsData
    : { ...DEFAULT_SETTINGS, language: localLanguage };
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
  const checklistDayActivations = checklistDayActivationsData || [];

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

  const unlockParent = (_pin: string) => true;
  const lockParent = () => {};

  const signOut = async () => {
    await signOutUser(auth);
  };

  const generateInviteCode = async (): Promise<string> => {
    if (!familyId) throw new Error('Not authenticated');
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const invRef = doc(db, 'invitations', code);
    await setDoc(invRef, {
      code,
      familyId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 48 * 60 * 60 * 1000,
      used: false,
    } satisfies FamilyInvitation);
    return code;
  };

  const joinFamily = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not signed in' };
    try {
      const invRef = doc(db, 'invitations', code.trim().toUpperCase());
      const invSnap = await getDoc(invRef);
      if (!invSnap.exists()) return { success: false, error: 'Code not found. Check the code and try again.' };
      const inv = invSnap.data() as FamilyInvitation;
      if (inv.used) return { success: false, error: 'This code has already been used.' };
      if (Date.now() > inv.expiresAt) return { success: false, error: 'This code has expired. Ask for a new one.' };

      // Create membership — store resolves familyId to inv.familyId on next render
      const memRef = doc(db, 'familyMemberships', user.uid);
      await setDoc(memRef, { uid: user.uid, familyId: inv.familyId, joinedAt: Date.now() } satisfies FamilyMembership);

      // Mark invite as used
      await setDoc(invRef, { ...inv, used: true });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message ?? 'Something went wrong.' };
    }
  };

  // ─── Settings ────────────────────────────────────────────────────────────────

  const setLanguage = (language: Language) => {
    setLocalLanguage(language);
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

  // ─── Goals ───────────────────────────────────────────────────────────────────

  const addGoal = (g: Omit<Goal, 'id' | 'createdAt'>) => {
    if (!familyId) return;
    const ref = doc(fCol('goals'));
    setDocumentNonBlocking(ref, { ...g, id: ref.id, createdAt: format(new Date(), 'yyyy-MM-dd') });
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    if (!familyId) return;
    updateDocumentNonBlocking(fDoc('goals', id), updates);
  };

  const deleteGoal = (id: string) => {
    if (!familyId) return;
    deleteDocumentNonBlocking(fDoc('goals', id));
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
    updateDocumentNonBlocking(fDoc('checklists', id), { deletedAt: Date.now() });
  };

  const restoreChecklist = (id: string) => {
    updateDocumentNonBlocking(fDoc('checklists', id), { deletedAt: 0 });
  };

  const permanentlyDeleteChecklist = (id: string) => {
    deleteDocumentNonBlocking(fDoc('checklists', id));
  };

  const setChecklistDayActivation = (checklistId: string, date: string, active: boolean) => {
    const id = `${checklistId}_${date}`;
    setDocumentNonBlocking(fDoc('checklistDayActivations', id), { id, checklistId, date, active }, { merge: true });
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
    checklistDayActivations,
    settings,
    isLoading,
    isParentUnlocked,
    currentUser: user,
    isAuthLoading: isUserLoading,
    familyId,
    isFamilyOwner,
    isMembershipLoading,
    unlockParent,
    lockParent,
    signOut,
    generateInviteCode,
    joinFamily,
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
    addGoal,
    updateGoal,
    deleteGoal,
    addParentLog,
    updateParentLog,
    deleteParentLog,
    addParentSelfLog,
    updateParentSelfLog,
    deleteParentSelfLog,
    addChecklist,
    updateChecklist,
    deleteChecklist,
    restoreChecklist,
    permanentlyDeleteChecklist,
    setChecklistItemDone,
    setChecklistDayActivation,
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
