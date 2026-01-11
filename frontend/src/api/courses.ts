import { api } from "./client";
import type { Course } from "../types/course";

export async function getCourses() {
  const res = await api.get<{ courses: Course[] }>("/courses");
  return res.data.courses;
}

export async function createCourse(name: string, minAttendance = 75) {
  const res = await api.post<{ course: Course }>("/courses", {
    name,
    minAttendance,
  });
  return res.data.course;
}

export async function deleteCourse(courseId: string) {
  const res = await api.delete(`/courses/${courseId}`);
  return res.data;
}
