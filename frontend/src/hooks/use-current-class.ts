import { useState, useEffect, useRef } from 'react';
import { getCurrentSchedule, type CurrentSchedule } from '@/lib/api/schedules';

interface UseCurrentClassReturn {
  currentClass: CurrentSchedule | null;
  isLive: boolean;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useCurrentClass(): UseCurrentClassReturn {
  const [currentClass, setCurrentClass] = useState<CurrentSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = async () => {
    try {
      const schedules = await getCurrentSchedule();
      setCurrentClass(schedules.length > 0 ? schedules[0] : null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch current schedule'));
      setCurrentClass(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch();

    // Poll every 60 seconds
    intervalRef.current = setInterval(fetch, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const isLive = currentClass !== null && currentClass.time_left_minutes > 0;

  return { currentClass, isLive, isLoading, error, refresh: fetch };
}
