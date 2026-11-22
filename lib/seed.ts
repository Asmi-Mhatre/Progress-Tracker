import { Category, Exam, Goal } from "./types";
const g = (id: string, name: string, category: Category, weight: number): Goal => ({ id, name, category, weight, status: "active", notes: "" });
// Goals only: no scores, dates or progress are invented. Set your own targets in the app.
export const seedGoals = (): Goal[] => [
  g("ca", "CA Final", "Academics", 5), g("iitm", "IIT Madras BS", "Academics", 3), g("cat", "CAT 2026", "Academics", 5),
  g("cfa", "CFA", "Academics", 3), g("gmat", "GMAT", "Academics", 3), g("mba", "MBA / MSCS applications", "Academics", 2),
  g("career", "Career: IB, research, quant", "Career", 4), g("synth", "Synth", "Startup", 4),
  g("kathak", "Kathak", "Personal", 2), g("guitar", "Guitar", "Personal", 1), g("mandarin", "Mandarin", "Personal", 1),
  g("fitness", "Swimming and fitness", "Personal", 2), g("reading", "Reading and writing", "Personal", 1),
  g("wealth", "Financial independence", "Financial", 3),
];
// Exam names only: dates, targets and syllabus are yours to enter.
export const seedExams = (): Exam[] => [
  { id: "x-ca", name: "CA Final", goalId: "ca", format: "" }, { id: "x-cat", name: "CAT 2026", goalId: "cat", format: "" },
  { id: "x-cfa", name: "CFA", goalId: "cfa", format: "" }, { id: "x-gmat", name: "GMAT", goalId: "gmat", format: "" },
];
