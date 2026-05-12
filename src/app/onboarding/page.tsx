"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Plus, Trash2, ChevronRight, Users, Home, CheckCircle } from 'lucide-react';
import { Person } from '@/lib/types';

const PRESET_COLORS = ['#F87171', '#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F472B6', '#FB923C', '#2DD4BF'];

type DraftPerson = { name: string; color: string; role: 'parent' | 'child' };

const defaultParent = (): DraftPerson => ({ name: '', color: '#34D399', role: 'parent' });
const defaultChild = (): DraftPerson => ({ name: '', color: '#F87171', role: 'child' });

export default function OnboardingPage() {
  const { updateSettings, addPerson, settings, persons, isLoading } = useStore();
  const router = useRouter();

  // Skip onboarding if family already has members (returning user)
  React.useEffect(() => {
    if (!isLoading && persons.length > 0) {
      router.replace('/');
    }
  }, [isLoading, persons.length, router]);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [familyName, setFamilyName] = useState('');
  const [parents, setParents] = useState<DraftPerson[]>([defaultParent()]);
  const [kids, setKids] = useState<DraftPerson[]>([defaultChild()]);
  const [saving, setSaving] = useState(false);

  const updateDraft = (
    list: DraftPerson[],
    setList: React.Dispatch<React.SetStateAction<DraftPerson[]>>,
    index: number,
    field: keyof DraftPerson,
    value: string
  ) => {
    setList(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const finish = async () => {
    setSaving(true);
    // Save family name
    updateSettings({ familyName: familyName.trim() || 'My Family' });
    // Add all persons
    [...parents, ...kids].filter(p => p.name.trim()).forEach(p => {
      addPerson({ name: p.name.trim(), color: p.color, role: p.role });
    });
    // Brief delay to let Firestore settle before navigating
    setTimeout(() => router.push('/'), 500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                s < step ? 'bg-primary text-primary-foreground' :
                s === step ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                'bg-muted text-muted-foreground'
              }`}>
                {s < step ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`h-px w-8 transition-all ${s < step ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Family name ── */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <div className="text-5xl mb-4">🏠</div>
              <h1 className="text-3xl font-black tracking-tight">What's your family called?</h1>
              <p className="text-muted-foreground font-medium">This is how the app will greet you.</p>
            </div>

            <input
              type="text"
              placeholder="e.g. The Smiths"
              value={familyName}
              onChange={e => setFamilyName(e.target.value)}
              autoFocus
              className="w-full h-14 px-6 rounded-2xl border-2 border-border bg-card font-bold text-lg focus:outline-none focus:border-primary transition-colors text-center"
            />

            <button
              onClick={() => setStep(2)}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black text-base hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              Continue <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ── Step 2: Parents ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
              <h1 className="text-3xl font-black tracking-tight">Who are the parents?</h1>
              <p className="text-muted-foreground font-medium">Add the grown-ups who manage the schedule.</p>
            </div>

            <div className="space-y-4">
              {parents.map((p, i) => (
                <PersonDraftRow
                  key={i}
                  draft={p}
                  onChangeName={v => updateDraft(parents, setParents, i, 'name', v)}
                  onChangeColor={v => updateDraft(parents, setParents, i, 'color', v)}
                  onRemove={parents.length > 1 ? () => setParents(prev => prev.filter((_, j) => j !== i)) : undefined}
                  placeholder="Parent name"
                />
              ))}
            </div>

            <button
              onClick={() => setParents(prev => [...prev, defaultParent()])}
              className="w-full h-12 rounded-2xl border-2 border-dashed border-border text-muted-foreground font-bold text-sm hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add another parent
            </button>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 h-14 rounded-2xl border-2 border-border bg-card font-bold hover:bg-muted/50 transition-all">
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!parents.some(p => p.name.trim())}
                className="flex-[2] h-14 rounded-2xl bg-primary text-primary-foreground font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Kids ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-5xl mb-4">🧒</div>
              <h1 className="text-3xl font-black tracking-tight">Now add the kids</h1>
              <p className="text-muted-foreground font-medium">Their schedules will appear in the calendar.</p>
            </div>

            <div className="space-y-4">
              {kids.map((p, i) => (
                <PersonDraftRow
                  key={i}
                  draft={p}
                  onChangeName={v => updateDraft(kids, setKids, i, 'name', v)}
                  onChangeColor={v => updateDraft(kids, setKids, i, 'color', v)}
                  onRemove={kids.length > 1 ? () => setKids(prev => prev.filter((_, j) => j !== i)) : undefined}
                  placeholder="Child's name"
                />
              ))}
            </div>

            <button
              onClick={() => setKids(prev => [...prev, defaultChild()])}
              className="w-full h-12 rounded-2xl border-2 border-dashed border-border text-muted-foreground font-bold text-sm hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add another child
            </button>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 h-14 rounded-2xl border-2 border-border bg-card font-bold hover:bg-muted/50 transition-all">
                Back
              </button>
              <button
                onClick={finish}
                disabled={saving || !kids.some(p => p.name.trim())}
                className="flex-[2] h-14 rounded-2xl bg-primary text-primary-foreground font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? 'Setting up…' : <>Let's go! 🎉</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PersonDraftRow({
  draft, onChangeName, onChangeColor, onRemove, placeholder,
}: {
  draft: DraftPerson;
  onChangeName: (v: string) => void;
  onChangeColor: (v: string) => void;
  onRemove?: () => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-card border rounded-2xl p-3">
      {/* Color swatch / picker */}
      <label className="cursor-pointer shrink-0">
        <div className="w-10 h-10 rounded-xl border-2 border-white shadow-sm" style={{ backgroundColor: draft.color }} />
        <input
          type="color"
          value={draft.color}
          onChange={e => onChangeColor(e.target.value)}
          className="sr-only"
        />
      </label>

      <input
        type="text"
        placeholder={placeholder}
        value={draft.name}
        onChange={e => onChangeName(e.target.value)}
        className="flex-1 h-10 px-3 rounded-xl bg-muted/30 border border-transparent font-bold text-base focus:outline-none focus:border-primary transition-colors"
      />

      {/* Color presets */}
      <div className="hidden sm:flex gap-1.5">
        {PRESET_COLORS.slice(0, 4).map(c => (
          <button
            key={c}
            onClick={() => onChangeColor(c)}
            className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
            style={{ backgroundColor: c, borderColor: draft.color === c ? 'currentColor' : 'transparent' }}
          />
        ))}
      </div>

      {onRemove && (
        <button onClick={onRemove} className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
