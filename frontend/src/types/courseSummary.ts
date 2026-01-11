export type CourseSummaryResponse = {
  course: {
    id: string;
    name: string;
    minAttendance: number;
  };
  overall: {
    total: number;
    attended: number;
    missed: number;
    attendancePercent: number;
    classesNeededToReach: number;
    leavesAvailable: number;
  };
  subjects: {
    subjectId: string;
    name: string;
    minAttendance: number;
    total: number;
    attended: number;
    missed: number;
    attendancePercent: number;
    classesNeededToReach: number;
    leavesAvailable: number;
  }[];
};
