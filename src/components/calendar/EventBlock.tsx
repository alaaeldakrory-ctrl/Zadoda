
"use client"

import React from 'react';
import { useStore } from '@/lib/store';
import { cn, getGridPosition, formatTime } from '@/lib/utils';
import { CheckCircle2, GripVertical, AlertCircle } from 'lucide-react';
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

  const isCompleted = occurrence.completed;
  const isImportant = occurrence.isImportant;
  
  // Dynamic styling based on event duration
  const isShort = height <= 64; // 30 minutes or less

  const style = !isDragging ? {
    top: `${top}px`,
    height: `${height}px`,
    backgroundColor: isCompleted ? '#f0fdf4' : `${color}15`,
    borderColor: isCompleted ? '#22c55e' : color,
    borderLeftWidth: isImportant ? '8px' : '6px',
    boxShadow: isImportant && !isCompleted ? `0 0 15px ${color}30` : 'none',
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  } : {
    height: `${height}px`,
    backgroundColor: `${color}15`,
    borderColor: color,
    borderLeftWidth: isImportant ? '8px' : '6px',
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      onClick={onClick}
      className={cn(
        "absolute left-1 right-1 rounded-xl border-2 shadow-sm cursor-pointer transition-all overflow-hidden group/event active:scale-95 z-10",
        isImportant && !isCompleted && "border-opacity-100 ring-1 ring-primary/20",
        isCompleted ? "opacity-100" : "opacity-100",
        isShort ? "p-1.5" : "p-3",
        isDragging && "z-50 ring-4 ring-primary ring-offset-2 opacity-90",
        !isDragging && "hover:shadow-md hover:translate-y-[-1px]"
      )}
      style={style}
    >
      <div className="flex items-center gap-2 h-full w-full relative">
        {/* Important Icon */}
        {isImportant && !isCompleted && (
          <div className="absolute top-0 right-0 opacity-80 animate-pulse">
            <AlertCircle className={cn("text-destructive", isShort ? "w-3 h-3" : "w-4 h-4")} />
          </div>
        )}

        {/* Drag Handle */}
        {!isCompleted && (
          <div 
            {...listeners}
            className="shrink-0 flex items-center justify-center opacity-0 group-hover/event:opacity-40 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <GripVertical className={isShort ? "w-4 h-4" : "w-5 h-5"} />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className={cn(
            "font-black leading-tight truncate transition-all", 
            isCompleted ? "line-through text-green-700/60 italic" : "text-foreground",
            isImportant && !isCompleted && "text-destructive font-black uppercase",
            isShort ? "text-sm" : "text-lg"
          )}>
            {occurrence.title}
          </p>
          <p className={cn(
            "font-black uppercase tracking-tight transition-opacity",
            isCompleted ? "text-green-600/40" : "opacity-60",
            isShort ? "text-[10px]" : "text-xs mt-0.5"
          )}>
            {formatTime(occurrence.startTime)} - {formatTime(occurrence.endTime)}
          </p>
        </div>

        {/* Completion Toggle */}
        <div className="shrink-0 flex items-center justify-center">
          <button
            onClick={handleToggle}
            className={cn(
              "rounded-full transition-all transform group-hover/event:scale-110 active:scale-90 bg-white/50",
              isShort ? "p-0.5" : "p-1"
            )}
          >
            {isCompleted ? (
              <CheckCircle2 className={cn("text-green-600 animate-pop", isShort ? "w-5 h-5" : "w-7 h-7")} />
            ) : (
              <div 
                className={cn(
                  "rounded-full border-2 border-current opacity-20 group-hover/event:opacity-100 transition-all",
                  isShort ? "w-5 h-5" : "w-7 h-7"
                )}
                style={{ color: color }} 
              />
            )}
          </button>
        </div>
      </div>
      
      {!isCompleted && !isDragging && (
        <div 
          className="absolute inset-x-0 bottom-0 h-1 opacity-20"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />
      )}
    </div>
  );
};
