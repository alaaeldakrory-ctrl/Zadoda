
"use client"

import React from 'react';
import { useStore } from '@/lib/store';
import { cn, getGridPosition } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

interface EventBlockProps {
  occurrence: any;
  dayStart: string;
  color: string;
  onClick: () => void;
}

export const EventBlock: React.FC<EventBlockProps> = ({ occurrence, dayStart, color, onClick }) => {
  const { toggleCompletion } = useStore();
  const { top, height } = getGridPosition(occurrence.startTime, occurrence.endTime, dayStart, 48); // Match the 48px height from CalendarView

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCompletion(occurrence.series.id, occurrence.date);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "absolute left-1 right-1 rounded-xl border-2 p-2 text-xs shadow-md cursor-pointer transition-all overflow-hidden group/event hover:scale-[1.02] active:scale-95 z-10",
        occurrence.completed ? "opacity-40 grayscale" : "opacity-100"
      )}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: `${color}15`,
        borderColor: color,
        borderLeftWidth: '6px'
      }}
    >
      <div className="flex items-start justify-between gap-1 h-full">
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center">
          <p className={cn("font-black leading-tight truncate", occurrence.completed && "line-through opacity-70")}>
            {occurrence.title}
          </p>
          <p className="text-[10px] font-bold opacity-80 mt-0.5">
            {occurrence.startTime} - {occurrence.endTime}
          </p>
        </div>
        <button
          onClick={handleToggle}
          className="shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
        >
          {occurrence.completed ? (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-current opacity-40 group-hover/event:opacity-100 transition-opacity" style={{ color: color }} />
          )}
        </button>
      </div>
      
      {/* Decorative gradient flare */}
      {!occurrence.completed && (
        <div 
          className="absolute inset-x-0 bottom-0 h-1 opacity-20"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />
      )}
    </div>
  );
};
