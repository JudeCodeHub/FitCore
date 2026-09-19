"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { classesService } from "@/modules/classes/services/classes.service";
import type { IClass } from "@/modules/classes/types/class";
import { weeklyTimetableStyles as styles } from "./weekly-timetable.styles";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Read-only weekly class schedule. Pass `trainerId` to show only one
 * trainer's classes (used on the trainer's own dashboard). */
export function WeeklyTimetable({ trainerId }: { trainerId?: string }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [classes, setClasses] = useState<IClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        return date;
      }),
    [weekStart],
  );

  useEffect(() => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    setIsLoading(true);
    classesService
      .list({ from: weekStart.toISOString(), to: weekEnd.toISOString() })
      .then(setClasses)
      .finally(() => setIsLoading(false));
  }, [weekStart]);

  const visible = trainerId
    ? classes.filter((c) => c.trainerId === trainerId)
    : classes;

  function classesForDay(date: Date) {
    return visible
      .filter(
        (c) => new Date(c.startTime).toDateString() === date.toDateString(),
      )
      .sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
  }

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {trainerId ? "My Classes" : "Weekly Timetable"}
        </h1>
        <div className={styles.nav}>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setWeekStart((d) => {
                const next = new Date(d);
                next.setDate(next.getDate() - 7);
                return next;
              })
            }
          >
            ← Prev
          </Button>
          <span className={styles.rangeLabel}>
            {formatShortDate(days[0])} – {formatShortDate(days[6])}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setWeekStart((d) => {
                const next = new Date(d);
                next.setDate(next.getDate() + 7);
                return next;
              })
            }
          >
            Next →
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className={styles.grid}>
          {days.map((date, i) => (
            <Card key={date.toISOString()}>
              <CardHeader className="pb-2">
                <CardTitle className={styles.dayTitle}>
                  {DAY_LABELS[i]} {date.getDate()}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {classesForDay(date).length === 0 ? (
                  <p className={styles.emptyDay}>No classes</p>
                ) : (
                  classesForDay(date).map((c) => (
                    <div key={c.id} className={styles.classCard}>
                      <div className={styles.className}>{c.name}</div>
                      <div className={styles.classMeta}>
                        {formatTime(c.startTime)}–{formatTime(c.endTime)}
                      </div>
                      <div className={styles.classMeta}>{c.trainer.name}</div>
                      <div className={styles.seats}>
                        {c.availableSeats}/{c.capacity} open
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
