"use client"

import React from 'react';
import { useStore } from '@/lib/store';
import { cn, getGridPosition, formatTime, getEmojiForEvent } from '@/lib/utils';
import { CheckCircle2, GripVertical, AlertCircle, Users } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';

interface EventBlockProps {
  occurrence: any;
  dayStart: string;
  color: string;
  onClick: () => void;
  isDragging?: boolean;
  isFullWidth?: boolean;
  slotHeight15Min?: number;
}

export const EventBlock: React.FC<EventBlockProps> = ({ 
  occurrence, 
  dayStart, 
  color, 
  onClick, 
  isDragging, 
  isFullWidth,
  slotHeight15Min = 48
}) => {
  const { toggleCompletion } = useStore();
  const { top, height } = getGridPosition(occurrence.startTime, occurrence.endTime, dayStart, slotHeight15Min);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: occurrence.id,
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompletion(occurrence.seriesId, occurrence.date);
  };

  const isCompleted = occurrence.completed;
  const isImportant = occurrence.isImportant;
  const isForAll = occurrence.personId === 'all';
  const isForKids = occurrence.personId === 'kids';
  const isShared = isForAll || isForKids;
  const emoji = getEmojiForEvent(occurrence.title);

  const isShort = height <= (slotHeight15Min * 1.1);

  const style = !isDragging ? {
    top: `${top}px`,
    height: `${height}px`,
    backgroundColor: isCompleted ? '#f0fdf4' : isShared ? 'rgba(255, 251, 240, 0.9)' : `${color}10`,
    borderColor: isCompleted ? '#22c55e' : color,
    borderLeftWidth: isImportant ? '5px' : '3px',
    borderTopLeftRadius: '12px',
    borderBottomLeftRadius: '12px',
    boxShadow: isImportant && !isCompleted ? `0 4px 12px ${color}25` : `0 1px 3px rgba(0,0,0,0.06)`,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  } : {
    height: `${height}px`,
    backgroundColor: `${color}15`,
    borderColor: color,
    borderLeftWidth: '3px',
    borderTopLeftRadius: '12px',
    borderBottomLeftRadius: '12px',
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      onClick={onClick}
      className={cn(
        "absolute rounded-2xl border shadow-sm cursor-pointer transition-all overflow-hidden group/event active:scale-[0.98] z-30",
        isFullWidth ? "left-1 right-1 backdrop-blur-md" : "left-1.5 right-1.5",
        isImportant && !isCompleted && "ring-1 ring-primary/20",
        isShort ? "p-1" : "p-2.5",
        isDragging && "z-[100] ring-4 ring-primary ring-offset-2 opacity-90",
        !isDragging && "hover:shadow-md hover:translate-y-[-1px]",
        isShared && !isCompleted && "bg-gradient-to-r from-amber-50/40 via-transparent to-amber-50/40"
      )}
      style={style}
    >
      <div className="flex items-center gap-2 h-full w-full relative">
        {isImportant && !isCompleted && (
          <div className="absolute top-0 right-0 opacity-80 animate-pulse">
            <AlertCircle className={cn("text-destructive", isShort ? "w-3 h-3" : "w-4 h-4")} />
          </div>
        )}

        {!isCompleted && !isFullWidth && (
          <div 
            {...listeners}
            className="shrink-0 flex items-center justify-center opacity-0 group-hover/event:opacity-40 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <GripVertical className={isShort ? "w-3 h-3" : "w-5 h-5"} />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1">
            {isShared && !isCompleted && <Users className={cn("text-muted-foreground shrink-0", isShort ? "w-3 h-3" : "w-3.5 h-3.5")} />}
            <span className={cn("shrink-0 leading-none", isShort ? "text-[10px]" : "text-sm")}>{emoji}</span>
            <p className={cn(
              "font-bold leading-tight truncate transition-all",
              isCompleted ? "line-through text-green-700/60 italic" : "text-foreground",
              isImportant && !isCompleted && "text-destructive font-black uppercase",
              isShort ? "text-[10px]" : "text-[12px]"
            )}>
              {occurrence.title}
            </p>
          </div>
          <p className={cn(
            "font-black uppercase tracking-tight transition-opacity shrink-0",
            isCompleted ? "text-green-600/40" : "opacity-60",
            isShort ? "text-[8px]" : "text-[9px] mt-0.5"
          )}>
            {formatTime(occurrence.startTime)} - {formatTime(occurrence.endTime)}
          </p>
        </div>

        <div className="shrink-0 flex items-center justify-center relative z-40">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleToggle}
            className={cn(
              "rounded-full transition-all transform hover:scale-110 active:scale-90 bg-white/80 shadow-sm border",
              isShort ? "p-0" : "p-0.5"
            )}
          >
            {isCompleted ? (
              <CheckCircle2 className={cn("text-green-600 animate-pop", isShort ? "w-5 h-5" : "w-7 h-7")} />
            ) : (
              <div 
                className={cn(
                  "rounded-full border-2 border-current opacity-30 hover:opacity-100 transition-all",
                  isShort ? "w-4 h-4" : "w-6 h-6"
                )}
                style={{ color: isShared ? (isForAll ? '#454545' : '#FBBF24') : color }} 
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
