
"use client"

import React, { useState } from 'react';
import { AppLayout } from '@/components/ui/Layout';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { FixedEventTemplate } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Pencil, Trash2, Library } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TemplateDialog } from '@/components/templates/TemplateDialog';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function TemplatesPage() {
  const { settings, templates, deleteTemplate } = useStore();
  const t = getTranslation(settings.language);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FixedEventTemplate | null>(null);

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (tpl: FixedEventTemplate) => {
    setEditingTemplate(tpl);
    setIsDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-black tracking-tight">{t.fixedEvents}</h1>
          <Button onClick={handleCreate} className="rounded-full px-8 h-12 font-black shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            <Plus className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 stroke-[3px]" />
            {t.createTemplate}
          </Button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center space-y-6">
            <div className="w-64 h-64 rounded-full overflow-hidden opacity-40 grayscale shadow-2xl">
              <Image 
                src={PlaceHolderImages.find(img => img.id === 'empty-templates')?.imageUrl || 'https://picsum.photos/seed/library/600/600'} 
                alt="No templates" 
                width={300} 
                height={300}
                className="object-cover"
                data-ai-hint="library shelf"
              />
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground font-black text-xl">{t.searchTemplates}</p>
              <p className="text-muted-foreground/60 font-bold max-w-sm mx-auto">Create reusable templates for things you do often, like sports, groceries, or study time.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map(tpl => {
              return (
                <Card key={tpl.id} className="group overflow-hidden border-2 rounded-[2.5rem] transition-all hover:shadow-2xl hover:-translate-y-1 bg-white">
                  <CardHeader className="bg-muted/10 pb-4 border-b">
                    <CardTitle className="flex justify-between items-start gap-2">
                      <span className="truncate text-xl font-black">{tpl.name}</span>
                      <Library className="w-5 h-5 text-primary opacity-40" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-8 pb-4">
                    <div className="flex items-center gap-3 text-base font-black text-muted-foreground">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      {tpl.defaultDurationMinutes} {t.mins}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 justify-end border-t pt-4 bg-muted/5">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="hover:text-destructive transition-colors rounded-full h-10 w-10"
                      onClick={() => deleteTemplate(tpl.id)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="rounded-full h-10 w-10"
                      onClick={() => handleEdit(tpl)}
                    >
                      <Pencil className="w-5 h-5" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <TemplateDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        templateToEdit={editingTemplate}
      />
    </AppLayout>
  );
}
