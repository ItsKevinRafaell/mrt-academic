'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, Clock, BookOpen } from 'lucide-react';
import { getActiveSchedules, type Schedule } from '@/lib/api/calendar';

export function LiveSessionBanner() {
  const [activeSession, setActiveSession] = useState<Schedule | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const sessions = await getActiveSchedules();
        if (sessions && sessions.length > 0) {
          setActiveSession(sessions[0]);
        } else {
          setActiveSession(null);
        }
      } catch (error) {
        console.error('Failed to check active session:', error);
      }
    };

    // Check immediately
    checkActiveSession();

    // Check every 30 seconds
    const interval = setInterval(checkActiveSession, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeSession) return;

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(activeSession.end_time);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setActiveSession(null);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  if (!activeSession) return null;

  const handleGoToSession = () => {
    if (!activeSession.course_id) return;

    if (activeSession.session_id) {
      router.push(`/akademik/${activeSession.course_id}/sesi/${activeSession.session_id}`);
    } else {
      router.push(`/akademik/${activeSession.course_id}`);
    }
  };

  return (
    <Card className="mb-6 border-2 border-primary/20 bg-primary/5 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Radio className="w-6 h-6 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive animate-pulse" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="destructive" className="animate-pulse">
                LIVE
              </Badge>
              <span className="text-sm text-muted-foreground">Sedang Berlangsung</span>
            </div>

            <h3 className="font-semibold text-lg mb-1 truncate">
              {activeSession.course_name || activeSession.course_code}
            </h3>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              {activeSession.course_name && (
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span className="truncate">{activeSession.course_name}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{timeLeft} tersisa</span>
              </div>
            </div>

            <Button onClick={handleGoToSession} size="sm" disabled={!activeSession.course_id}>
              Masuk ke Sesi
            </Button>
          </div>
        </div>
      </div>

      <div className="h-1 bg-primary/20">
        <div
          className="h-full bg-primary transition-all duration-1000"
          style={{
            width: `${Math.max(0, Math.min(100, ((new Date(activeSession.end_time).getTime() - Date.now()) / (new Date(activeSession.end_time).getTime() - new Date(activeSession.start_time).getTime())) * 100))}%`
          }}
        />
      </div>
    </Card>
  );
}
