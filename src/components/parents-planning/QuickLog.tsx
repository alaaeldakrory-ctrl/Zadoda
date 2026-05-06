"use client"

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getPersonName, getAvatarUrl } from '@/lib/utils';
import { MessageSquare, Plus } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

export function QuickLog() {
  const { persons, settings, parentLogs } = useStore();
  const db = useFirestore();
  const kids = persons.filter(p => p.id === 'person1' || p.id === 'person2');

  const [selectedKid, setSelectedKid] = useState(kids[0]?.id || '');
  const [mood, setMood] = useState<'good' | 'neutral' | 'bad'>('neutral');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedKid) return;

    const ref = doc(collection(db, 'parentLogs'));
    setDocumentNonBlocking(ref, {
      id: ref.id,
      childId: selectedKid,
      date: format(new Date(), 'yyyy-MM-dd'),
      mood,
      issueTags: [],
      note
    });

    setNote('');
    setMood('neutral');
  };

  return (
    <Card className="rounded-[2.5rem] border-2 shadow-xl bg-white overflow-hidden">
      <CardHeader className="bg-purple-50/50 pb-4 border-b border-purple-100">
        <CardTitle className="text-2xl font-black flex items-center gap-2 text-purple-600">
          <MessageSquare className="w-6 h-6" />
          Parent Logs
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-4">
            {kids.map(kid => (
              <button
                key={kid.id}
                type="button"
                onClick={() => setSelectedKid(kid.id)}
                className={`flex-1 rounded-2xl p-4 border-2 transition-all flex flex-col items-center gap-2 ${selectedKid === kid.id ? 'border-primary bg-primary/5 ring-4 ring-primary/10' : 'border-transparent bg-muted/20 hover:bg-muted/40'}`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  <Image src={getAvatarUrl(kid.id)} alt={kid.name} width={48} height={48} className="object-cover w-full h-full" />
                </div>
                <span className="font-bold text-sm">{getPersonName(kid, settings.language)}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {['good', 'neutral', 'bad'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m as any)}
                className={`py-3 rounded-2xl border-2 font-black uppercase tracking-widest text-xs transition-all ${mood === m ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-muted/30 text-muted-foreground hover:bg-muted/10'}`}
              >
                {m}
              </button>
            ))}
          </div>

          <textarea 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add an observation..."
            className="w-full h-24 rounded-2xl border-2 p-4 font-medium resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          />

          <Button type="submit" className="w-full rounded-2xl h-14 font-black text-lg bg-purple-600 hover:bg-purple-700">
            <Plus className="w-5 h-5 mr-2" />
            Save Log
          </Button>
        </form>

        <div className="mt-8 pt-8 border-t border-dashed">
          <h4 className="font-black text-muted-foreground uppercase tracking-widest text-xs mb-4">Recent Logs</h4>
          <div className="space-y-4">
            {parentLogs.slice(0, 3).map(log => {
              const kid = persons.find(p => p.id === log.childId);
              return (
                <div key={log.id} className="bg-muted/10 p-4 rounded-2xl border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm" style={{ color: kid?.color }}>{kid?.name}</span>
                    <span className="text-xs font-black uppercase tracking-widest px-2 py-1 bg-white rounded-md shadow-sm border text-muted-foreground">{log.mood}</span>
                  </div>
                  {log.note && <p className="text-sm font-medium">{log.note}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
