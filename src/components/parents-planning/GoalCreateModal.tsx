"use client"

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { getPersonName, getAvatarUrl } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, Flame } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const STREAK_OPTIONS = [7, 14, 21, 30];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function GoalCreateModal({ open, onClose }: Props) {
  const { persons, settings, addGoal } = useStore();
  const kids = persons.filter(p => p.role === 'child');

  const [title, setTitle] = useState('');
  const [childId, setChildId] = useState('');
  const [targetDays, setTargetDays] = useState(21);

  // persons load async — pick first kid once available
  useEffect(() => {
    if (!childId && kids.length > 0) setChildId(kids[0].id);
  }, [kids, childId]);

  const handleSave = () => {
    if (!title.trim() || !childId) return;
    addGoal({
      childId,
      title: title.trim(),
      successCriteria: { type: 'streak', targetDays },
      status: 'active',
    });
    setTitle('');
    setTargetDays(21);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="rounded-3xl sm:max-w-[480px] border-2">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2 text-blue-600">
            <Target className="w-6 h-6" />
            Create a Streak Goal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-2">
            <Label className="font-black text-sm">Goal Title</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Brush teeth every night"
              className="rounded-xl border-2 font-bold h-12"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="font-black text-sm">For which child?</Label>
            <div className="flex gap-3">
              {kids.map(kid => (
                <button
                  key={kid.id}
                  onClick={() => setChildId(kid.id)}
                  className={cn(
                    'flex-1 rounded-2xl p-3 border-2 transition-all flex flex-col items-center gap-2',
                    childId === kid.id ? 'ring-2 ring-primary/30' : 'border-muted/40 hover:border-muted'
                  )}
                  style={childId === kid.id ? { borderColor: kid.color } : {}}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2" style={{ borderColor: kid.color }}>
                    <Image src={getAvatarUrl(kid.id, kid.avatarUrl)} alt={kid.name} width={48} height={48} className="object-cover w-full h-full" />
                  </div>
                  <span className="font-black text-xs" style={{ color: kid.color }}>
                    {getPersonName(kid, settings.language)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-black text-sm flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              Streak Target
            </Label>
            <div className="flex gap-2">
              {STREAK_OPTIONS.map(days => (
                <button
                  key={days}
                  onClick={() => setTargetDays(days)}
                  className={cn(
                    'flex-1 rounded-2xl py-3 border-2 font-black text-sm transition-all',
                    targetDays === days
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-muted hover:border-orange-300 hover:text-orange-600'
                  )}
                >
                  {days}d
                </button>
              ))}
            </div>
            <p className="text-xs font-medium text-muted-foreground opacity-60">
              Complete the routine for {targetDays} consecutive days to achieve this goal.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" className="rounded-full font-bold" onClick={onClose}>Cancel</Button>
          <Button
            className="rounded-full font-black px-8 bg-blue-600 hover:bg-blue-700"
            onClick={handleSave}
            disabled={!title.trim() || !childId}
          >
            Create Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
