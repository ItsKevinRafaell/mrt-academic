'use client';

import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, ClipboardList, CheckCircle2, Calendar } from 'lucide-react';

interface Activity {
  id: number;
  type: string;
  title: string;
  course_name: string;
  timestamp: string;
}

interface RecentActivitiesProps {
  activities: Activity[];
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="h-4 w-4 text-primary" />;
      case 'task':
        return <ClipboardList className="h-4 w-4 text-primary/80" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-primary/60" />;
      default:
        return <Calendar className="h-4 w-4 text-primary/40" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Baru saja';
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
  };

  if (!activities || activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Belum ada aktivitas
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {activities.slice(0, 5).map((activity) => (
        <Card key={activity.id} className="border-l-4 border-primary/60">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{activity.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.course_name} • {formatTime(activity.timestamp)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
