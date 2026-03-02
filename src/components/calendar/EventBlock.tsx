
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
  const { top, height } = getGridPosition(occurrence.startTime, occurrence.endTime, dayStart);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCompletion(occurrence.series.id, occurrence.date);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "absolute left-1 right-1 rounded-md border p-1 text-xs shadow-sm cursor-pointer transition-all overflow-hidden",
        occurrence.completed ? "opacity-50 grayscale" : "opacity-100"
      )}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: `${color}20`, // Add transparency
        borderColor: color,
        borderLeftWidth: '4px'
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <p className={cn("font-bold truncate", occurrence.completed && "line-through")}>
            {occurrence.title}
          </p>
          <p className="text-[10px] opacity-70">
            {occurrence.startTime} - {occurrence.endTime}
          </p>
        </div>
        <button
          onClick={handleToggle}
          className="shrink-0 hover:scale-110 transition-transform"
        >
          {occurrence.completed ? (
            <CheckCircle2 className="w-4 h-4 text-primary" />
          ) : (
            <Circle className="w-4 h-4 opacity-50" />
          )}
        </button>
      </div>
    </div>
  );
};
