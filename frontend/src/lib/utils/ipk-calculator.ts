import { GRADE_POINTS } from "@/lib/constants/grade-map";
import type { Grade, IPKEntry } from "@/types";

export function calculateIP(entries: IPKEntry[]): number {
  const filledEntries = entries.filter((e) => e.grade !== null);
  if (filledEntries.length === 0) return 0;

  const totalWeighted = filledEntries.reduce((sum, entry) => {
    const points = GRADE_POINTS[entry.grade as Grade];
    return sum + points * entry.sks;
  }, 0);

  const totalSKS = filledEntries.reduce((sum, entry) => sum + entry.sks, 0);
  if (totalSKS === 0) return 0;

  return Math.round((totalWeighted / totalSKS) * 100) / 100;
}

export function calculateIPK(
  allCawuEntries: { cawu: number; entries: IPKEntry[] }[]
): number {
  let totalWeighted = 0;
  let totalSKS = 0;

  for (const cawu of allCawuEntries) {
    for (const entry of cawu.entries) {
      if (entry.grade !== null) {
        const points = GRADE_POINTS[entry.grade as Grade];
        totalWeighted += points * entry.sks;
        totalSKS += entry.sks;
      }
    }
  }

  if (totalSKS === 0) return 0;
  return Math.round((totalWeighted / totalSKS) * 100) / 100;
}

export function getTotalSKS(entries: IPKEntry[]): number {
  return entries
    .filter((e) => e.grade !== null)
    .reduce((sum, entry) => sum + entry.sks, 0);
}
