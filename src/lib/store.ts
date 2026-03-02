
"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Person, CalendarEventSeries, CalendarEventOccurrenceOverride, FixedEventTemplate, AppSettings, Language, Memo } from './types';
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
import { collection, doc } from 'firebase/firestore';

interface StoreContextValue {
  persons: Person[];
  series: CalendarEventSeries[];
  overrides: CalendarEventOccurrenceOverride[];
  templates: FixedEventTemplate[];
  memos: Memo[];
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
  { id: 'person1', name: 'Lyla', color: '#6366f1' },
  { id: 'person2', name: 'Malika', color: '#f59e0b' },
  { id: 'person3', name: 'Mohamed', color: '#10b981' },
  { id: 'person4', name: 'Wesam', color: '#ec4899' },
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

  const settingsRef = useMemoFirebase(() => doc(db, 'appSettings', 'global'), [db]);
  const { data: settingsData, isLoading: settingsLoading } = useDoc<AppSettings>(settingsRef);

  const peopleRef = useMemoFirebase(() => collection(db, 'people'), [db]);
  const { data: personsData, isLoading: personsLoading } = useCollection<Person>(peopleRef);

  const templatesRef = useMemoFirebase(() => collection(db, 'fixedEventTemplates'), [db]);
  const { data: templatesData, isLoading: templatesLoading } = useCollection<FixedEventTemplate>(templatesRef);

  const seriesRef = useMemoFirebase(() => collection(db, 'calendarEventSeries'), [db]);
  const { data: seriesData, isLoading: seriesLoading } = useCollection<CalendarEventSeries>(seriesRef);

  const memosRef = useMemoFirebase(() => collection(db, 'memos'), [db]);
  const { data: memosData, isLoading: memosLoading } = useCollection<Memo>(memosRef);

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
  const overrides: CalendarEventOccurrenceOverride[] = []; 

  const isLoading = isUserLoading || settingsLoading || (personsLoading && !personsData) || memosLoading;

  const setLanguage = (language: Language) => {
    setDocumentNonBlocking(settingsRef, { ...settings, language, id: 'global' }, { merge: true });
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
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

  const toggleCompletion = (seriesId: string, date: string) => {
    const overrideId = `${seriesId}_${date}`;
    const overrideRef = doc(db, 'calendarEventSeries', seriesId, 'eventOccurrenceOverrides', overrideId);
    setDocumentNonBlocking(overrideRef, { 
      id: overrideId, 
      seriesId, 
      date, 
      completed: true, 
      completedAt: new Date().getTime() 
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
