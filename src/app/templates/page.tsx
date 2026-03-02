
"use client"

import React, { useState } from 'react';
import { AppLayout } from '@/components/ui/Layout';
import { useStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Clock, User, Pencil, Trash2, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TemplatesPage() {
  const { settings, templates, deleteTemplate, persons } = useStore();
  const t = getTranslation(settings.language);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black">{t.fixedEvents}</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t.createTemplate}
          </Button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border-2 border-dashed">
            <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground">{t.searchTemplates}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(tpl => {
              const assignee = persons.find(p => p.id === tpl.defaultAssigneePersonId);
              return (
                <Card key={tpl.id} className="group overflow-hidden border-t-4" style={{ borderTopColor: tpl.color || '#ddd' }}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start gap-2">
                      {tpl.name}
                      <Badge variant="secondary" className="font-mono">{tpl.defaultDurationMinutes}{t.mins}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {tpl.defaultTime || t.none}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      {assignee?.name || t.none}
                    </div>
                    {tpl.notes && <p className="text-sm text-muted-foreground line-clamp-2 italic">{tpl.notes}</p>}
                  </CardContent>
                  <CardFooter className="flex gap-2 justify-end border-t pt-4 bg-muted/10">
                    <Button variant="ghost" size="icon" className="hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" onClick={() => deleteTemplate(tpl.id)} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="secondary" size="sm">
                      <Calendar className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                      {t.schedule}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function Layers(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <path d="m2.6 12.08 8.58 3.9a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83l-8.58 3.9a2 2 0 0 0-1.66 0l-8.58-3.9a1 1 0 0 0 0 1.83Z" />
      <path d="m2.6 17.08 8.58 3.9a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83l-8.58 3.9a2 2 0 0 0-1.66 0l-8.58-3.9a1 1 0 0 0 0 1.83Z" />
    </svg>
  );
}
