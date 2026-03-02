
"use client"

import React, { createContext, useContext, useEffect } from 'react';
import { Person, CalendarEventSeries, CalendarEventOccurrenceOverride, FixedEventTemplate, AppSettings, Language } from './types';
import { timeToMinutes, minutesToTime } from './utils';
import { 
  useCollection, 
  useDoc, 
  useUser, 
  useFirestore, 
  useAuth,
  useMemoFirebase,
  setDocumentNonBlocking,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  initiateAnonymousSignIn
} from '@/firebase';
import { collection, doc, query, where, DocumentReference, CollectionReference } from 'firebase/firestore';

interface StoreContextValue {
  persons: Person[];
  series: CalendarEventSeries[];
  overrides: CalendarEventOccurrenceOverride[];
  templates: FixedEventTemplate[];
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
  toggleCompletion: (seriesId: string, date: string) => void;
  updateOccurrence: (seriesId: string, date: string, updates: Partial<CalendarEventOccurrenceOverride>) => void;
  moveEvent: (seriesId: string, date: string, newStartTime: string, newPersonId: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const DEFAULT_SETTINGS: AppSettings = {
  dayStartTime: '05:00',
  dayEndTime: '22:00',
  language: 'en',
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  // Handle anonymous sign-in if no user
  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  // Firestore Data Subscriptions
  const settingsRef = useMemoFirebase(() => doc(db, 'appSettings', 'global'), [db]);
  const { data: settingsData, isLoading: settingsLoading } = useDoc<AppSettings>(settingsRef);

  const peopleRef = useMemoFirebase(() => collection(db, 'people'), [db]);
  const { data: personsData, isLoading: personsLoading } = useCollection<Person>(peopleRef);

  const templatesRef = useMemoFirebase(() => collection(db, 'fixedEventTemplates'), [db]);
  const { data: templatesData, isLoading: templatesLoading } = useCollection<FixedEventTemplate>(templatesRef);

  const seriesRef = useMemoFirebase(() => collection(db, 'calendarEventSeries'), [db]);
  const { data: seriesData, isLoading: seriesLoading } = useCollection<CalendarEventSeries>(seriesRef);

  // Note: For a true MVP, we fetch all overrides. In a larger app, we'd scope this by date or series.
  // Since they are subcollections in the schema, we'd typically fetch them per series.
  // For simplicity here, we'll assume overrides are handled specifically when needed or 
  // we use the local state pattern for non-essential UI feedback if necessary.
  // However, the schema defines them as subcollections: /calendarEventSeries/{seriesId}/eventOccurrenceOverrides/{overrideId}
  // To keep it performant, we'll collect them from the series we have.
  // In this simplified StoreProvider, we'll focus on the primary entities.

  const settings = settingsData || DEFAULT_SETTINGS;
  const persons = personsData || [];
  const templates = templatesData || [];
  const series = seriesData || [];
  const overrides: CalendarEventOccurrenceOverride[] = []; // Simplified for now

  const isLoading = isUserLoading || settingsLoading || personsLoading || templatesLoading || seriesLoading;

  const setLanguage = (language: Language) => {
    setDocumentNonBlocking(settingsRef, { ...settings, language }, { merge: true });
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setDocumentNonBlocking(settingsRef, { ...settings, ...updates }, { merge: true });
  };

  const updatePerson = (id: string, updates: Partial<Person>) => {
    const personRef = doc(db, 'people', id);
    setDocumentNonBlocking(personRef, updates, { merge: true });
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

  const toggleCompletion = (seriesId: string, date: string) => {
    const overrideId = `${seriesId}_${date}`;
    const overrideRef = doc(db, 'calendarEventSeries', seriesId, 'eventOccurrenceOverrides', overrideId);
    // This is a simplified toggle logic for the demo
    setDocumentNonBlocking(overrideRef, { 
      id: overrideId, 
      seriesId, 
      date, 
      completed: true, 
      completedAt: new Date().toISOString() 
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
