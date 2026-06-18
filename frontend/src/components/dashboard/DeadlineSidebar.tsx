'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Calendar, Clock } from 'lucide-react';

interface DeadlineSidebarProps {
  tasks: number;
}

export function DeadlineSidebar({ tasks }: DeadlineSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Mock data - nanti bisa diganti dengan API call
  const deadlines = [
    { id: 1, title: 'Tugas Pemrograman Web', deadline: '2024-01-15', daysLeft: 0 },
    { id: 2, title: 'Quiz Basis Data', deadline: '2024-01-16', daysLeft: 1 },
    { id: 3, title: 'Project Jaringan Komputer', deadline: '2024-01-18', daysLeft: 3 },
  ];

  if (!isOpen) {
    return (
      <div className="border-l border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="m-2"
        >
          <Calendar className="h-4 w-4 mr-2" />
          <span className="relative">
            Deadlines
            {tasks > 0 && (
              <span className="absolute -top-2 -right-4 bg-destructive text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {tasks}
              </span>
            )}
          </span>
          <ChevronLeft className="h-4 w-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Deadline Mendatang
          {tasks > 0 && (
            <Badge variant="destructive" className="ml-2">
              {tasks}
            </Badge>
          )}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto space-y-3">
        {deadlines.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Tidak ada deadline
          </p>
        ) : (
          deadlines.map((deadline) => (
            <Card key={deadline.id} className="border-l-4 border-primary/60">
              <CardContent className="pt-4">
                <h4 className="font-medium text-sm mb-2">{deadline.title}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {deadline.daysLeft === 0
                      ? 'Hari ini'
                      : deadline.daysLeft === 1
                      ? 'Besok'
                      : `${deadline.daysLeft} hari lagi`}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </div>
  );
}
