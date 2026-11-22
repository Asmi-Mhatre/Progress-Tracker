export type Category = "Academics" | "Career" | "Startup" | "Personal" | "Financial";
export type GoalStatus = "active" | "paused" | "done";
export interface Goal { id: string; name: string; category: Category; weight: number; status: GoalStatus; targetDate?: string; notes: string; parentId?: string }
export interface Task { id: string; title: string; goalId?: string; priority: 1 | 2 | 3; due?: string; estMin: number; done: boolean; createdAt: string }
export interface Block { id: string; title: string; goalId?: string; start: string; durMin: number; kind: "once" | "weekly" | "monthly"; date?: string; days: number[]; monthDay?: number; fixed: boolean; productive: boolean }
export interface Log { id: string; blockId: string; date: string; status: "done" | "partial" | "skipped" | "rescheduled"; actualMin: number; notes: string }
export interface Session { id: string; goalId?: string; taskId?: string; date: string; plannedMin: number; actualMin: number; distractions: number; completed: boolean; notes: string }
export interface Mvd { id: string; title: string; goalId?: string; min: number }
export interface Settings { sleepStart: string; sleepEnd: string; mvd?: Mvd[] }
export interface DayReview { date: string; accomplished: string; failed: string; why: string; learned: string; improve: string; rating: number }
export interface Leak { id: string; date: string; minutes: number; category: string; note: string }
export interface Achievement { id: string; date: string; title: string; note: string }
export interface Exam { id: string; name: string; goalId?: string; format: string; regOpen?: string; regDeadline?: string; admitDate?: string; examDate?: string; resultDate?: string; weeklyHours?: number; targetScore?: number; targetPercentile?: number }
export interface Topic { id: string; examId: string; parentId?: string; name: string; done: boolean; doneAt?: string; rev1: boolean; rev2: boolean; rev3: boolean; estH?: number }
export interface Mock { id: string; examId: string; name: string; date: string; score?: number; maxScore?: number; percentile?: number; accuracy?: number; attempted?: number; correct?: number; incorrect?: number; unattempted?: number; timeMin?: number; sections: { name: string; score?: number; percentile?: number }[]; weak: string; lessons: string }
export const CAUSES = ["Conceptual gap", "Calculation error", "Misinterpretation", "Time pressure", "Poor question selection", "Silly mistake"] as const;
export interface Mistake { id: string; examId: string; mockId?: string; topic: string; cause: (typeof CAUSES)[number]; note: string; date: string }
export interface Reminder { id: string; title: string; description: string; goalId?: string; dueAt: string; priority: 1 | 2 | 3; offsets: number[]; recur: "none" | "weekly" | "monthly" | "yearly"; done: boolean; notes: string; url: string; docs: string; fired: string[] }
export const OPP_TYPES = ["Job", "Internship", "Scholarship", "Accelerator", "Competition", "Admission", "Other"] as const;
export const OPP_STATUS = ["Idea", "Applied", "Interview", "Offer", "Accepted", "Rejected", "Withdrawn"] as const;
export interface Opportunity { id: string; type: (typeof OPP_TYPES)[number]; title: string; org: string; status: (typeof OPP_STATUS)[number]; deadline?: string; interviewAt?: string; followUp?: string; contact: string; url: string; notes: string }
export const AREAS = ["Product", "Customer discovery", "Market research", "Competitors", "Outreach", "Cofounder", "Accelerator", "Pitch deck", "Launch", "Other"] as const;
export const STAGES = ["Lead", "Contacted", "Call done", "Pilot", "Customer", "Lost"] as const;
export interface Project { id: string; name: string; description: string; goalId?: string }
export interface Milestone { id: string; projectId: string; title: string; area: (typeof AREAS)[number]; due?: string; done: boolean }
export interface Lead { id: string; projectId: string; name: string; org: string; stage: (typeof STAGES)[number]; nextStep: string; date?: string }
export interface DB { goals: Goal[]; tasks: Task[]; blocks: Block[]; logs: Log[]; sessions: Session[]; settings: Settings; exams: Exam[]; topics: Topic[]; mocks: Mock[]; mistakes: Mistake[]; reminders: Reminder[]; opps: Opportunity[]; reviews: DayReview[]; leaks: Leak[]; achievements: Achievement[]; projects: Project[]; milestones: Milestone[]; leads: Lead[] }
export const CATEGORIES: Category[] = ["Academics", "Career", "Startup", "Personal", "Financial"];
