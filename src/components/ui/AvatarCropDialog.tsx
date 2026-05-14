'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, ZoomIn, ZoomOut, Check, Camera } from 'lucide-react';

interface AvatarCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (dataUrl: string) => void;
  personName: string;
  personColor: string;
}

const CANVAS_SIZE = 300;
const OUTPUT_SIZE = 256;
const CIRCLE_R = 130; // crop circle radius within the display canvas

export function AvatarCropDialog({
  open,
  onOpenChange,
  onSave,
  personName,
  personColor,
}: AvatarCropDialogProps) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── draw ────────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    if (img) {
      ctx.save();
      ctx.translate(CANVAS_SIZE / 2 + offset.x, CANVAS_SIZE / 2 + offset.y);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    } else {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }

    // Dark overlay outside the circle (evenodd punch-out)
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.52)';
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CIRCLE_R, 0, Math.PI * 2, true); // CCW = hole
    ctx.fill('evenodd');
    ctx.restore();

    // Dashed circle guide border
    ctx.save();
    ctx.strokeStyle = personColor || '#6C5CE7';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([7, 4]);
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CIRCLE_R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // "Your face here" hint when no image
    if (!img) {
      ctx.save();
      ctx.font = 'bold 13px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'center';
      ctx.fillText('Position your face here', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 6);
      ctx.restore();
    }
  }, [img, scale, offset, personColor]);

  useEffect(() => { draw(); }, [draw]);

  // ── file pick ────────────────────────────────────────────────────────────────
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const image = new window.Image();
      image.onload = () => {
        // Auto-fit: scale so the shorter side fills the circle
        const shorter = Math.min(image.width, image.height);
        setScale((CIRCLE_R * 2) / shorter);
        setOffset({ x: 0, y: 0 });
        setImg(image);
      };
      image.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    // allow re-selecting same file
    e.target.value = '';
  };

  // ── drag (mouse + touch) ─────────────────────────────────────────────────────
  const startDrag = (x: number, y: number) => {
    if (!img) return;
    setDragging(true);
    setDragOrigin({ x: x - offset.x, y: y - offset.y });
  };
  const moveDrag = (x: number, y: number) => {
    if (!dragging) return;
    setOffset({ x: x - dragOrigin.x, y: y - dragOrigin.y });
  };
  const endDrag = () => setDragging(false);

  // ── save ─────────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!img) return;
    setSaving(true);

    const out = document.createElement('canvas');
    out.width = OUTPUT_SIZE;
    out.height = OUTPUT_SIZE;
    const ctx = out.getContext('2d')!;

    // Clip to circle
    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();

    // Map display-canvas crop region → output canvas
    // The crop region in display coords: top-left = (cx - CIRCLE_R, cy - CIRCLE_R), size = CIRCLE_R*2
    // Image top-left in display coords:
    const imgLeft = CANVAS_SIZE / 2 + offset.x - (img.width * scale) / 2;
    const imgTop  = CANVAS_SIZE / 2 + offset.y - (img.height * scale) / 2;

    // Source crop on the original image
    const cropLeft = CANVAS_SIZE / 2 - CIRCLE_R;
    const cropTop  = CANVAS_SIZE / 2 - CIRCLE_R;
    const cropSize = CIRCLE_R * 2;

    const sx = (cropLeft - imgLeft) / scale;
    const sy = (cropTop  - imgTop)  / scale;
    const sw = cropSize / scale;
    const sh = cropSize / scale;

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    const dataUrl = out.toDataURL('image/jpeg', 0.88);
    onSave(dataUrl);
    setSaving(false);
    reset();
  };

  const reset = () => {
    setImg(null);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setDragging(false);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[380px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="text-xl font-black">{personName}'s Photo</DialogTitle>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            {img ? 'Drag to position · zoom to fit your face in the circle' : 'Choose a photo to get started'}
          </p>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          {/* Canvas */}
          <div
            className="mx-auto overflow-hidden rounded-2xl select-none"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, maxWidth: '100%' }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="block w-full h-full"
              style={{ cursor: img ? (dragging ? 'grabbing' : 'grab') : 'default', touchAction: 'none' }}
              onMouseDown={e => startDrag(e.clientX, e.clientY)}
              onMouseMove={e => moveDrag(e.clientX, e.clientY)}
              onMouseUp={endDrag}
              onMouseLeave={endDrag}
              onTouchStart={e => { e.preventDefault(); startDrag(e.touches[0].clientX, e.touches[0].clientY); }}
              onTouchMove={e => { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY); }}
              onTouchEnd={endDrag}
            />
          </div>

          {/* Zoom slider */}
          {img && (
            <div className="flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="range"
                min={0.1}
                max={6}
                step={0.02}
                value={scale}
                onChange={e => setScale(Number(e.target.value))}
                className="flex-1 h-1.5 rounded-full accent-[--ring]"
                style={{ accentColor: personColor || '#6C5CE7' }}
              />
              <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          )}

          {/* Hidden file input */}
          <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFile} />

          {/* Action buttons */}
          {!img ? (
            <Button
              onClick={() => fileRef.current?.click()}
              className="w-full h-12 rounded-2xl font-bold text-white"
              style={{ backgroundColor: personColor || '#6C5CE7' }}
            >
              <Camera className="w-5 h-5 mr-2" /> Choose Photo
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-2xl font-bold"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-1.5" /> Change
              </Button>
              <Button
                className="flex-[2] h-12 rounded-2xl font-bold text-white shadow-lg"
                style={{ backgroundColor: personColor || '#6C5CE7' }}
                onClick={handleSave}
                disabled={saving}
              >
                <Check className="w-4 h-4 mr-1.5" /> Save Avatar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
