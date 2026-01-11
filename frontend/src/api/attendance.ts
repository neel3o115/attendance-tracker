import { api } from "./client";

export async function markAttendance(
  subjectId: string,
  status: "attended" | "missed",
  date?: string
) {
  const res = await api.post("/attendance/mark", { subjectId, status, date });
  return res.data;
}

export async function undoLast(subjectId: string) {
  const res = await api.delete(`/attendance/undo/${subjectId}`);
  return res.data;
}

export async function getSubjectHistory(subjectId: string) {
  const res = await api.get(`/attendance/subject/${subjectId}`);
  return res.data.entries;
}

