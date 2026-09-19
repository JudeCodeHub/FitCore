export const weeklyTimetableStyles = {
  header: "mb-4 flex flex-wrap items-center justify-between gap-2",
  title: "font-heading text-2xl font-semibold tracking-tight",
  nav: "flex items-center gap-2",
  rangeLabel: "text-sm text-muted-foreground",
  grid: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7",
  dayTitle: "text-sm font-medium",
  emptyDay: "text-xs text-muted-foreground",
  classCard: "rounded-md border p-2 text-xs",
  className: "font-medium",
  classMeta: "text-muted-foreground",
  seats: "font-mono tabular-nums text-muted-foreground",
} as const;
