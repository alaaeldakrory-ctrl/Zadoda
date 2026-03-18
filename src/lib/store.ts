
"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Person, CalendarEventSeries, CalendarEventOccurrenceOverride, FixedEventTemplate, AppSettings, Language, Memo, Chore, ChoreOverride } from './types';
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
  initiateAnonymousSignIn
} from '@/firebase';
import { collection, doc, collectionGroup, query } from 'firebase/firestore';

interface StoreContextValue {
  persons: Person[];
  series: CalendarEventSeries[];
  overrides: CalendarEventOccurrenceOverride[];
  templates: FixedEventTemplate[];
  memos: Memo[];
  chores: Chore[];
  choreOverrides: ChoreOverride[];
  settings: AppSettings;
  isLoading: boolean;
  setLanguage: (lang: Language) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
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
  toggleCompletion: (seriesId: string, date: string) => void;
  updateOccurrence: (seriesId: string, date: string, updates: Partial<CalendarEventOccurrenceOverride>) => void;
  moveEvent: (seriesId: string, date: string, newStartTime: string, newPersonId: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const DEFAULT_SETTINGS: AppSettings = {
  id: 'global',
  dayStartTime: '05:00',
  dayEndTime: '22:00',
  language: 'en',
};

const INITIAL_PEOPLE: Person[] = [
  { id: 'person1', name: 'Lyla', color: '#F87171' }, 
  { id: 'person4', name: 'Wesam', color: '#FBBF24' },
  { id: 'person2', name: 'Malika', color: '#60A5FA' }, 
  { id: 'person3', name: 'Mohamed', color: '#34D399' }, 
];

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  const settingsRef = useMemoFirebase(() => user ? doc(db, 'appSettings', 'global') : null, [db, user]);
  const { data: settingsData, isLoading: settingsLoading } = useDoc<AppSettings>(settingsRef);

  const peopleRef = useMemoFirebase(() => user ? collection(db, 'people') : null, [db, user]);
  const { data: personsData, isLoading: personsLoading } = useCollection<Person>(peopleRef);

  const templatesRef = useMemoFirebase(() => user ? collection(db, 'fixedEventTemplates') : null, [db, user]);
  const { data: templatesData, isLoading: templatesLoading } = useCollection<FixedEventTemplate>(templatesRef);

  const seriesRef = useMemoFirebase(() => user ? collection(db, 'calendarEventSeries') : null, [db, user]);
  const { data: seriesData, isLoading: seriesLoading } = useCollection<CalendarEventSeries>(seriesRef);

  const overridesRef = useMemoFirebase(() => user ? query(collectionGroup(db, 'eventOccurrenceOverrides')) : null, [db, user]);
  const { data: overridesData, isLoading: overridesLoading } = useCollection<CalendarEventOccurrenceOverride>(overridesRef);

  const memosRef = useMemoFirebase(() => user ? collection(db, 'memos') : null, [db, user]);
  const { data: memosData, isLoading: memosLoading } = useCollection<Memo>(memosRef);

  const choresRef = useMemoFirebase(() => user ? collection(db, 'chores') : null, [db, user]);
  const { data: choresData, isLoading: choresLoading } = useCollection<Chore>(choresRef);

  const choreOverridesRef = useMemoFirebase(() => user ? query(collectionGroup(db, 'overrides')) : null, [db, user]);
  const { data: choreOverridesData, isLoading: choreOverridesLoading } = useCollection<ChoreOverride>(choreOverridesRef);

  const [hasSeeded, setHasSeeded] = useState(false);

  useEffect(() => {
    if (!personsLoading && personsData && db && !hasSeeded) {
      if (personsData.length === 0) {
        INITIAL_PEOPLE.forEach(p => {
          const pRef = doc(db, 'people', p.id);
          setDocumentNonBlocking(pRef, p, { merge: true });
        });
        setHasSeeded(true);
      }
    }
  }, [personsLoading, personsData, db, hasSeeded]);

  const settings = settingsData || DEFAULT_SETTINGS;
  const persons = (personsData && personsData.length > 0) ? personsData : INITIAL_PEOPLE;
  const templates = templatesData || [];
  const series = seriesData || [];
  const memos = memosData || [];
  const chores = choresData || [];
  const choreOverrides = choreOverridesData || [];
  const overrides = overridesData || []; 

  const isLoading = isUserLoading || settingsLoading || (personsLoading && !personsData) || memosLoading || overridesLoading || choresLoading || choreOverridesLoading;

  const setLanguage = (language: Language) => {
    if (!settingsRef) return;
    setDocumentNonBlocking(settingsRef, { ...settings, language, id: 'global' }, { merge: true });
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    if (!settingsRef) return;
    setDocumentNonBlocking(settingsRef, { ...settings, ...updates, id: 'global' }, { merge: true });
  };

  const updatePerson = (id: string, updates: Partial<Person>) => {
    const personRef = doc(db, 'people', id);
    setDocumentNonBlocking(personRef, { ...updates, id }, { merge: true });
  };

  const addSeries = (s: CalendarEventSeries) => {
    const docRef = doc(db, 'calendarEventSeries', s.id);
    setDocumentNonBlocking(docRef, s, { merge: true });
  };

  const updateSeries = (id: string, updates: Partial<CalendarEventSeries>) => {
    const docRef = doc(db, 'calendarEventSeries', id);
    updateDocumentNonBlocking(docRef, updates);
  };

  const deleteSeries = (id: string) => {
    const docRef = doc(db, 'calendarEventSeries', id);
    deleteDocumentNonBlocking(docRef);
  };

  const addTemplate = (t: FixedEventTemplate) => {
    const docRef = doc(db, 'fixedEventTemplates', t.id);
    setDocumentNonBlocking(docRef, t, { merge: true });
  };

  const updateTemplate = (id: string, updates: Partial<FixedEventTemplate>) => {
    const docRef = doc(db, 'fixedEventTemplates', id);
    updateDocumentNonBlocking(docRef, updates);
  };

  const deleteTemplate = (id: string) => {
    const docRef = doc(db, 'fixedEventTemplates', id);
    deleteDocumentNonBlocking(docRef);
  };

  const addMemo = (m: Memo) => {
    const docRef = doc(db, 'memos', m.id);
    setDocumentNonBlocking(docRef, m, { merge: true });
  };

  const updateMemo = (id: string, updates: Partial<Memo>) => {
    const docRef = doc(db, 'memos', id);
    const { id: _, ...cleanUpdates } = updates as any;
    updateDocumentNonBlocking(docRef, cleanUpdates);
  };

  const deleteMemo = (id: string) => {
    const docRef = doc(db, 'memos', id);
    deleteDocumentNonBlocking(docRef);
  };

  const toggleMemoCompletion = (id: string) => {
    const memo = memos.find(m => m.id === id);
    if (!memo) return;
    const docRef = doc(db, 'memos', id);
    updateDocumentNonBlocking(docRef, { completed: !memo.completed });
  };

  const addChore = (c: Chore) => {
    const docRef = doc(db, 'chores', c.id);
    setDocumentNonBlocking(docRef, c, { merge: true });
  };

  const updateChore = (id: string, updates: Partial<Chore>) => {
    const docRef = doc(db, 'chores', id);
    updateDocumentNonBlocking(docRef, updates);
  };

  const deleteChore = (id: string) => {
    const docRef = doc(db, 'chores', id);
    deleteDocumentNonBlocking(docRef);
  };

  const updateChoreOverride = (choreId: string, date: string, updates: Partial<ChoreOverride>) => {
    const overrideId = `${choreId}_${date}`;
    const overrideRef = doc(db, 'chores', choreId, 'overrides', overrideId);
    setDocumentNonBlocking(overrideRef, { ...updates, choreId, date, id: overrideId }, { merge: true });
  };

  const toggleCompletion = (seriesId: string, date: string) => {
    const overrideId = `${seriesId}_${date}`;
    const existing = overrides.find(o => o.id === overrideId);
    const overrideRef = doc(db, 'calendarEventSeries', seriesId, 'eventOccurrenceOverrides', overrideId);
    
    setDocumentNonBlocking(overrideRef, { 
      id: overrideId, 
      seriesId, 
      date, 
      completed: !existing?.completed, 
      completedAt: !existing?.completed ? new Date().getTime() : null
    }, { merge: true });
  };

  const updateOccurrence = (seriesId: string, date: string, updates: Partial<CalendarEventOccurrenceOverride>) => {
    const overrideId = `${seriesId}_${date}`;
    const overrideRef = doc(db, 'calendarEventSeries', seriesId, 'eventOccurrenceOverrides', overrideId);
    setDocumentNonBlocking(overrideRef, { ...updates, seriesId, date, id: overrideId }, { merge: true });
  };

  const moveEvent = (seriesId: string, date: string, newStartTime: string, newPersonId: string) => {
    const targetSeries = series.find(s => s.id === seriesId);
    if (!targetSeries) return;

    const durationMins = timeToMinutes(targetSeries.endTime) - timeToMinutes(targetSeries.startTime);
    const newStartMins = timeToMinutes(newStartTime);
    const newEndTime = minutesToTime(newStartMins + durationMins);

    const docRef = doc(db, 'calendarEventSeries', seriesId);
    updateDocumentNonBlocking(docRef, { 
      startTime: newStartTime, 
      endTime: newEndTime, 
      personId: newPersonId, 
      startDate: date 
    });
  };

  const value: StoreContextValue = {
    persons,
    series,
    overrides,
    templates,
    memos,
    chores,
    choreOverrides,
    settings,
    isLoading,
    setLanguage,
    updateSettings,
    updatePerson,
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
    toggleCompletion,
    updateOccurrence,
    moveEvent
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
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};
