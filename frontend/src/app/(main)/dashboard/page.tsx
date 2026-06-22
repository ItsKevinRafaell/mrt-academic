'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Zap,
  ChevronRight,
  Play,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/ui/page-container';
import { getActiveSchedules, getSchedules, type Schedule } from '@/lib/api/calendar';
import { getDashboardSummary, type DashboardSummary } from '@/lib/api/dashboard';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';
import { canManageCalendar } from '@/lib/rbac';

export default function DashboardPage() {
  const router = useRouter();
  const { role } = useAuthStore();
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);
  const [upcomingSchedules, setUpcomingSchedules] = useState<Schedule[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [activeData, allSchedules, dashboardData] = await Promise.all([
        getActiveSchedules(),
        getSchedules(),
        getDashboardSummary(),
      ]);

      setActiveSchedule(activeData[0] || null);

      // Get upcoming schedules (next 7 days)
      const upcoming = allSchedules
        .filter((s) => {
          // Simple filter for this week
          return true; // For now, show all schedules
        })
        .slice(0, 5);
      setUpcomingSchedules(upcoming);

      setDashboard(dashboardData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = () => {
    if (!dashboard) return 0;
    const total = dashboard.completed_tasks + dashboard.pending_tasks;
    if (total === 0) return 0;
    return Math.round((dashboard.completed_tasks / total) * 100);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="animate-pulse space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6">
      {/* Live Session Banner */}
      {activeSchedule && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <Badge variant="destructive" className="animate-pulse">
                      LIVE
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">Sedang Berlangsung</span>
                </div>
                <h2 className="text-2xl font-bold mb-1">
                  {activeSchedule.course_code} - {activeSchedule.course_name}
                </h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {activeSchedule.start_time} - {activeSchedule.end_time}
                    </span>
                  </div>
                  {activeSchedule.session_id && (
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>Session #{activeSchedule.session_id}</span>
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={() => {
                  if (activeSchedule.session_id && activeSchedule.course_id) {
                    router.push(`/akademik/${activeSchedule.course_id}/sesi/${activeSchedule.session_id}`);
                  }
                }}
                size="lg"
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Join Class
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Academic Progress - Large Card */}
        <Card className="lg:col-span-2 lg:row-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Academic Progress</h3>
            </div>
            <Link href="/ipk">
              <Button variant="ghost" size="sm">
                View Details
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="space-y-6">
            {/* Progress Circle */}
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 80}`}
                    strokeDashoffset={`${2 * Math.PI * 80 * (1 - getProgressPercentage() / 100)}`}
                    className="text-primary transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold">{getProgressPercentage()}%</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {dashboard?.completed_tasks || 0}
                </div>
                <div className="text-sm text-muted-foreground">Tasks Completed</div>
              </div>
              <div className="text-center p-4 bg-orange-500/5 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {dashboard?.pending_tasks || 0}
                </div>
                <div className="text-sm text-muted-foreground">Tasks Pending</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Upcoming Classes */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Upcoming Classes</h3>
            </div>
            <div className="flex items-center gap-2">
              {role && canManageCalendar(role) && (
                <Link href="/calendar?action=add">
                  <Button variant="default" size="sm">
                    + Add Event
                  </Button>
                </Link>
              )}
              <Link href="/calendar">
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            {upcomingSchedules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming classes</p>
              </div>
            ) : (
              upcomingSchedules.slice(0, 4).map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => {
                    if (schedule.course_id) {
                      router.push(`/akademik/${schedule.course_id}`);
                    }
                  }}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {schedule.course_code}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {schedule.course_name}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {schedule.start_time} - {schedule.end_time}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Quick Actions</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/akademik">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <BookOpen className="w-5 h-5" />
                <span className="text-xs">View Courses</span>
              </Button>
            </Link>
            <Link href="/calendar">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Calendar className="w-5 h-5" />
                <span className="text-xs">Calendar</span>
              </Button>
            </Link>
            <Link href="/ipk">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <TrendingUp className="w-5 h-5" />
                <span className="text-xs">IPK Calculator</span>
              </Button>
            </Link>
            <Button variant="outline" className="w-full h-20 flex-col gap-2">
              <FileText className="w-5 h-5" />
              <span className="text-xs">Upload Material</span>
            </Button>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
