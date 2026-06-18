"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { getSchedules } from "@/lib/api/schedules";
import type { Schedule } from "@/types";
import { format, startOfWeek, addWeeks, subWeeks, getDay } from "date-fns";
import { id } from "date-fns/locale";

export default function KalenderPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadSchedules();
  }, []);

  async function loadSchedules() {
    try {
      const data = await getSchedules();
      setSchedules(data || []);
    } catch (error) {
      console.error("Failed to load schedules:", error);
    } finally {
      setLoading(false);
    }
  }

  const handlePrevWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

  const days = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const getDaySchedules = (dayIndex: number) => {
    return schedules.filter((s) => s.day_of_week === dayIndex);
  };

  const getCourseColor = (courseId: number) => {
    const colors = [
      "bg-primary/10 border-primary text-primary",
      "bg-green-100 border-green-500 text-green-900",
      "bg-purple-100 border-purple-500 text-purple-900",
      "bg-orange-100 border-orange-500 text-orange-900",
      "bg-pink-100 border-pink-500 text-pink-900",
      "bg-yellow-100 border-yellow-500 text-yellow-900",
    ];
    return colors[courseId % colors.length];
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Kalender Akademik</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button
            onClick={handlePrevWeek}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold">
            {format(weekStart, "d MMMM yyyy", { locale: id })}
          </h2>
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-6 gap-0">
          {days.map((date, idx) => {
            const dayIndex = getDay(date) === 0 ? 6 : getDay(date) - 1;
            const daySchedules = getDaySchedules(dayIndex);
            const isToday =
              format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

            return (
              <div
                key={idx}
                className={`border-r border-border last:border-r-0 ${
                  isToday ? "bg-primary/5" : ""
                }`}
              >
                <div
                  className={`p-3 text-center border-b border-border ${
                    isToday ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <div className="font-semibold">
                    {format(date, "EEEE", { locale: id }).slice(0, 3)}
                  </div>
                  <div className="text-sm opacity-75">
                    {format(date, "d MMM")}
                  </div>
                </div>

                <div className="p-2 space-y-2 min-h-[300px]">
                  {daySchedules.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-4">
                      Tidak ada kelas
                    </div>
                  ) : (
                    daySchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className={`p-3 rounded-md border-l-4 ${getCourseColor(
                          schedule.course_id
                        )}`}
                      >
                        <div className="font-semibold text-sm mb-1">
                          {schedule.course_name}
                        </div>
                        <div className="text-xs opacity-75 mb-1">
                          {schedule.course_code}
                        </div>
                        <div className="text-xs font-medium">
                          {schedule.start_time} - {schedule.end_time}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {schedules.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Belum ada jadwal yang tersedia</p>
          <p className="text-sm mt-2">
            Hubungi administrator untuk menambahkan jadwal
          </p>
        </div>
      )}
    </div>
  );
}
