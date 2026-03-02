"use client"

import React from 'react';
import { useStore } from '@/lib/store';
import { cn, getGridPosition, formatTime } from '@/lib/utils';
import { CheckCircle2, GripVertical } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';

interface EventBlockProps {
  occurrence: any;
  dayStart: string;
  color: string;
  onClick: () => void;
  isDragging?: boolean;
}

export const EventBlock: React.FC<EventBlockProps> = ({ occurrence, dayStart, color, onClick, isDragging }) => {
  const { toggleCompletion } = useStore();
  const { top, height } = getGridPosition(occurrence.startTime, occurrence.endTime, dayStart, 64);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: occurrence.id,
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleCompletion(occurrence.seriesId, occurrence.date);
  };

  const isShortEvent = height <= 64;
  const isCompleted = occurrence.completed;

  const style = !isDragging ? {
    top: `${top}px`,
    height: `${height}px`,
    backgroundColor: isCompleted ? '#f1f5f9' : `${color}15`,
    borderColor: isCompleted ? '#cbd5e1' : color,
    borderLeftWidth: '8px',
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  } : {
    height: `${height}px`,
    backgroundColor: `${color}15`,
    borderColor: color,
    borderLeftWidth: '8px',
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      onClick={onClick}
      className={cn(
        "absolute left-1 right-1 rounded-2xl border-2 text-xs shadow-md cursor-pointer transition-all overflow-hidden group/event hover:shadow-lg active:scale-95 z-10",
        isCompleted ? "opacity-60 grayscale shadow-sm" : "opacity-100",
        isShortEvent ? "p-1" : "p-3",
        isDragging && "z-50 ring-4 ring-primary ring-offset-2",
        !isDragging && "hover:scale-[1.02]"
      )}
      style={style}
    >
      <div className="flex items-start justify-between gap-2 h-full">
        {/* Grab Handle for Dragging */}
        <div 
          {...listeners}
          className={cn(
            "shrink-0 flex items-center justify-center transition-opacity cursor-grab active:cursor-grabbing p-0.5",
            isCompleted ? "opacity-20" : "opacity-0 group-hover/event:opacity-40"
          )}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center">
          <p className={cn(
            "font-black leading-tight truncate transition-all", 
            isCompleted ? "line-through text-slate-500 italic" : "text-foreground",
            isShortEvent ? "text-[13px]" : "text-base"
          )}>
            {occurrence.title}
          </p>
          {!isShortEvent && (
            <p className={cn(
              "text-[10px] font-black uppercase tracking-tight mt-1 transition-opacity",
              isCompleted ? "opacity-40" : "opacity-80"
            )}>
              {formatTime(occurrence.startTime)} - {formatTime(occurrence.endTime)}
            </p>
          )}
        </div>

        <button
          onClick={handleToggle}
          className={cn(
            "shrink-0 p-1 rounded-full transition-all transform group-hover/event:scale-110 active:scale-90",
            isCompleted ? "bg-slate-200" : "hover:bg-black/5"
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className={cn("text-slate-400 animate-pop shadow-sm rounded-full bg-white", isShortEvent ? "w-5 h-5" : "w-8 h-8")} />
          ) : (
            <div 
              className={cn(
                "rounded-full border-4 border-current opacity-30 group-hover/event:opacity-100 transition-all shadow-inner", 
                isShortEvent ? "w-5 h-5 border-[3px]" : "w-8 h-8"
              )} 
              style={{ color: color }} 
            />
          )}
        </button>
      </div>
      
      {!isCompleted && !isDragging && (
        <div 
          className="absolute inset-x-0 bottom-0 h-1.5 opacity-30"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />
      )}
    </div>
  );
};
