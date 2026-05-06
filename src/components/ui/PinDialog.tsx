import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Input } from './input';
import { Button } from './button';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Lock } from 'lucide-react';

interface PinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PinDialog({ open, onOpenChange, onSuccess }: PinDialogProps) {
  const { settings, unlockParent } = useStore();
  const t = getTranslation(settings.language);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockParent(pin)) {
      setPin('');
      setError(false);
      onSuccess();
      onOpenChange(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        setPin('');
        setError(false);
      }
    }}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-black">
            <Lock className="w-6 h-6 text-primary" />
            {t.enterPin}
          </DialogTitle>
          <DialogDescription>
            {t.lockedMsg}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 py-4">
          <div className="flex flex-col gap-2">
            <Input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              className={`text-center text-3xl tracking-[0.5em] font-black h-16 rounded-2xl border-2 ${error ? 'border-destructive/50 focus-visible:ring-destructive' : ''}`}
              placeholder="••••"
              autoFocus
            />
            {error && <span className="text-destructive text-sm font-bold text-center">{t.pinIncorrect}</span>}
          </div>
          
          <Button type="submit" className="w-full h-12 rounded-full font-black text-lg">
            {t.unlock}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
