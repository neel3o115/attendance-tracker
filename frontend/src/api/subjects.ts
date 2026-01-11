import { api } from "./client";

export async function createSubject(
  courseId: string,
  name: string,
  minAttendance = 75
) {
  const res = await api.post("/subjects", {
    courseId,
    name,
    minAttendance,
  });

  return res.data;
}

export async function deleteSubject(subjectId: string) {
  const res = await api.delete(`/subjects/${subjectId}`);
  return res.data;
}
