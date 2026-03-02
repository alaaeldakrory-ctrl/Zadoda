
"use client"

import React from 'react';
import { useStore } from '@/lib/store';
import { cn, getGridPosition, formatTime } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface EventBlockProps {
  occurrence: any;
  dayStart: string;
  color: string;
  onClick: () => void;
}

export const EventBlock: React.FC<EventBlockProps> = ({ occurrence, dayStart, color, onClick }) => {
  const { toggleCompletion } = useStore();
  const { top, height } = getGridPosition(occurrence.startTime, occurrence.endTime, dayStart, 64);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCompletion(occurrence.series.id, occurrence.date);
  };

  const isShortEvent = height <= 64;

  return (
    <div
      onClick={onClick}
      className={cn(
        "absolute left-1 right-1 rounded-2xl border-2 text-xs shadow-md cursor-pointer transition-all overflow-hidden group/event hover:scale-[1.02] active:scale-95 z-10",
        occurrence.completed ? "opacity-40 grayscale" : "opacity-100",
        isShortEvent ? "p-2" : "p-3"
      )}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: `${color}15`,
        borderColor: color,
        borderLeftWidth: '8px'
      }}
    >
      <div className="flex items-start justify-between gap-2 h-full">
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center">
          <p className={cn(
            "font-black leading-tight truncate", 
            occurrence.completed && "line-through opacity-70",
            isShortEvent ? "text-sm" : "text-base"
          )}>
            {occurrence.title}
          </p>
          <p className="text-[10px] font-black opacity-80 mt-1 uppercase tracking-tight">
            {formatTime(occurrence.startTime)} - {formatTime(occurrence.endTime)}
          </p>
        </div>
        <button
          onClick={handleToggle}
          className={cn(
            "shrink-0 p-1 rounded-full transition-all transform group-hover/event:scale-110 active:scale-90",
            occurrence.completed ? "bg-primary/20" : "hover:bg-black/5"
          )}
        >
          {occurrence.completed ? (
            <CheckCircle2 className={cn("text-primary animate-pop shadow-md rounded-full bg-white", isShortEvent ? "w-6 h-6" : "w-8 h-8")} />
          ) : (
            <div 
              className={cn(
                "rounded-full border-4 border-current opacity-30 group-hover/event:opacity-100 transition-all shadow-inner", 
                isShortEvent ? "w-6 h-6 border-[3px]" : "w-8 h-8"
              )} 
              style={{ color: color }} 
            />
          )}
        </button>
      </div>
      
      {!occurrence.completed && (
        <div 
          className="absolute inset-x-0 bottom-0 h-1.5 opacity-30"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />
      )}
    </div>
  );
};
