
"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Person, CalendarEventSeries, CalendarEventOccurrenceOverride, FixedEventTemplate, AppSettings, Language } from './types';
import { addMinutes, format, parse } from 'date-fns';
import { timeToMinutes, minutesToTime } from './utils';

interface StoreState {
  persons: Person[];
  series: CalendarEventSeries[];
  overrides: CalendarEventOccurrenceOverride[];
  templates: FixedEventTemplate[];
  settings: AppSettings;
  version: number;
}

interface StoreContextValue extends StoreState {
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

const DEFAULT_PERSONS: Person[] = [
  { id: '1', name: 'Lyla', color: '#fb7185' },
  { id: '2', name: 'Malika', color: '#2dd4bf' },
  { id: '3', name: 'Mohamed', color: '#fbbf24' },
  { id: '4', name: 'Wesam', color: '#818cf8' },
];

const DEFAULT_SETTINGS: AppSettings = {
  dayStartTime: '05:00',
  dayEndTime: '22:00',
  language: 'en',
};

const CURRENT_VERSION = 6;

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<StoreState>({
    persons: DEFAULT_PERSONS,
    series: [],
    overrides: [],
    templates: [],
    settings: DEFAULT_SETTINGS,
    version: CURRENT_VERSION,
  });

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('familiaflow_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.version || parsed.version < CURRENT_VERSION) {
          parsed.persons = DEFAULT_PERSONS;
          parsed.version = CURRENT_VERSION;
        }
        setState(parsed);
      } catch (e) {
        console.error('Failed to load storage', e);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('familiaflow_data', JSON.stringify(state));
    }
  }, [state, hydrated]);

  const setLanguage = (language: Language) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, language } }));
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...updates } }));
  };

  const updatePerson = (id: string, updates: Partial<Person>) => {
    setState(prev => ({
      ...prev,
      persons: prev.persons.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const addSeries = (s: CalendarEventSeries) => {
    setState(prev => ({ ...prev, series: [...prev.series, s] }));
  };

  const updateSeries = (id: string, updates: Partial<CalendarEventSeries>) => {
    setState(prev => ({
      ...prev,
      series: prev.series.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  };

  const deleteSeries = (id: string) => {
    setState(prev => ({
      ...prev,
      series: prev.series.filter(s => s.id !== id),
      overrides: prev.overrides.filter(o => o.seriesId !== id)
    }));
  };

  const addTemplate = (t: FixedEventTemplate) => {
    setState(prev => ({ ...prev, templates: [...prev.templates, t] }));
  };

  const updateTemplate = (id: string, updates: Partial<FixedEventTemplate>) => {
    setState(prev => ({
      ...prev,
      templates: prev.templates.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const deleteTemplate = (id: string) => {
    setState(prev => ({ ...prev, templates: prev.templates.filter(t => t.id !== id) }));
  };

  const toggleCompletion = (seriesId: string, date: string) => {
    const overrideId = `${seriesId}_${date}`;
    setState(prev => {
      const existing = prev.overrides.find(o => o.id === overrideId);
      if (existing) {
        return {
          ...prev,
          overrides: prev.overrides.map(o => o.id === overrideId ? { ...o, completed: !o.completed, completedAt: !o.completed ? Date.now() : undefined } : o)
        };
      } else {
        return {
          ...prev,
          overrides: [...prev.overrides, { id: overrideId, seriesId, date, completed: true, completedAt: Date.now() }]
        };
      }
    });
  };

  const updateOccurrence = (seriesId: string, date: string, updates: Partial<CalendarEventOccurrenceOverride>) => {
    const overrideId = `${seriesId}_${date}`;
    setState(prev => {
      const existing = prev.overrides.find(o => o.id === overrideId);
      if (existing) {
        return {
          ...prev,
          overrides: prev.overrides.map(o => o.id === overrideId ? { ...o, ...updates } : o)
        };
      } else {
        return {
          ...prev,
          overrides: [...prev.overrides, { id: overrideId, seriesId, date, completed: false, ...updates }]
        };
      }
    });
  };

  const moveEvent = (seriesId: string, date: string, newStartTime: string, newPersonId: string) => {
    setState(prev => {
      const targetSeries = prev.series.find(s => s.id === seriesId);
      if (!targetSeries) return prev;

      const durationMins = timeToMinutes(targetSeries.endTime) - timeToMinutes(targetSeries.startTime);
      const newStartMins = timeToMinutes(newStartTime);
      const newEndTime = minutesToTime(newStartMins + durationMins);

      // 1. Create shallow copy of events for calculations
      let updatedSeries = [...prev.series];
      
      // 2. Update the dragged event's core properties
      updatedSeries = updatedSeries.map(s => {
        if (s.id === seriesId) {
          return { ...s, startTime: newStartTime, endTime: newEndTime, personId: newPersonId, startDate: date };
        }
        return s;
      });

      // 3. Perform collision resolution (shifting subsequent events)
      // Only care about events for the same person on the same date
      const columnEvents = updatedSeries
        .filter(s => s.personId === newPersonId && s.startDate === date)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

      // Iteratively push events down if they overlap
      let changed = true;
      let iterations = 0;
      while (changed && iterations < 100) { // Safety cap
        changed = false;
        iterations++;
        for (let i = 0; i < columnEvents.length - 1; i++) {
          const first = columnEvents[i];
          const second = columnEvents[i+1];
          
          const firstEndMins = timeToMinutes(first.endTime);
          const secondStartMins = timeToMinutes(second.startTime);
          
          if (secondStartMins < firstEndMins) {
            const secondDuration = timeToMinutes(second.endTime) - secondStartMins;
            const shiftedStart = firstEndMins;
            const shiftedEnd = shiftedStart + secondDuration;
            
            second.startTime = minutesToTime(shiftedStart);
            second.endTime = minutesToTime(shiftedEnd);
            changed = true;
          }
        }
      }

      // 4. Sync the calculated changes back to the main list
      const finalSeries = updatedSeries.map(s => {
        const found = columnEvents.find(c => c.id === s.id);
        return found ? { ...found } : s;
      });

      return { ...prev, series: finalSeries };
    });
  };

  if (!hydrated) return null;

  return React.createElement(
    StoreContext.Provider,
    {
      value: {
        ...state,
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
      }
    },
    React.createElement(
      'div',
      { dir: state.settings.language === 'ar' ? 'rtl' : 'ltr' },
      children
    )
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};
