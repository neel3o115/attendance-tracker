import { api } from "./client";
import type { CourseSummaryResponse } from "../types/courseSummary";

export async function getCourseSummary(courseId: string) {
  const res = await api.get<CourseSummaryResponse>(`/courses/${courseId}/summary`);
  return res.data;
}
