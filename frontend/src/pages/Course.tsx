import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCourseSummary } from "../api/courseSummary";
import { createSubject, deleteSubject } from "../api/subjects";
import { markAttendance, undoLast } from "../api/attendance";
import SubjectHistoryModal from "../components/SubjectHistoryModal";
import type { CourseSummaryResponse } from "../types/courseSummary";

export default function CoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<CourseSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    // yyyy-mm-dd for <input type="date" />
    return new Date().toISOString().slice(0, 10);
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySubjectId, setHistorySubjectId] = useState<string | null>(null);
  const [historySubjectName, setHistorySubjectName] = useState<string>("");

  // add subject
  const [newName, setNewName] = useState("");
  const [newMin, setNewMin] = useState(75);

  const load = async () => {
    try {
      setErrMsg("");
      setLoading(true);

      if (!courseId) return;

      const res = await getCourseSummary(courseId);
      setData(res);
      console.log("course summary subjects:", res.subjects);
    } catch {
      setErrMsg("failed to load course summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [courseId]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleCreateSubject = async () => {
    if (!courseId) return;
    if (!newName.trim()) return;

    try {
      setErrMsg("");
      await createSubject(courseId, newName.trim(), newMin);
      setNewName("");
      setNewMin(75);
      await load();
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;

      setErrMsg(axiosMsg || "failed to create subject");
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    const ok = confirm("delete subject? this will also delete its attendance.");
    if (!ok) return;

    try {
      setErrMsg("");
      await deleteSubject(subjectId);
      await load();
    } catch {
      setErrMsg("failed to delete subject");
    }
  };

  const handleMark = async (subjectId: string, status: "attended" | "missed") => {
    try {
      setErrMsg("");
      await markAttendance(subjectId, status, selectedDate);
      await load();
    } catch {
      setErrMsg("failed to mark attendance");
    }
  };

  const handleUndo = async (subjectId: string) => {
    try {
      setErrMsg("");
      await undoLast(subjectId);
      await load();
    } catch {
      setErrMsg("failed to undo");
    }
  };

  if (loading) return <div className="p-6 text-gray-500">loading...</div>;
  if (!data) return <div className="p-6 text-gray-500">no data</div>;

  return (
    <div className="min-h-screen px-6 py-8 max-w-5xl mx-auto">
      {/* top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/dashboard")}
          className="h-10 px-4 rounded-xl border text-sm hover:bg-gray-50"
        >
          ← back
        </button>

        <button
          onClick={logout}
          className="h-10 px-4 rounded-xl border text-sm hover:bg-gray-50"
        >
          logout
        </button>
      </div>

      {/* course header */}
      <div className="mt-8">
        <h1 className="text-3xl font-semibold tracking-tight">{data.course.name}</h1>
        <p className="text-sm text-gray-500 mt-2">
          overall: {data.overall.attended}/{data.overall.total} attended •{" "}
          {data.overall.attendancePercent}%
        </p>

        {data.overall.classesNeededToReach > 0 && (
          <p className="text-red-500 text-sm mt-2">
            attend {data.overall.classesNeededToReach} more classes to reach{" "}
            {data.course.minAttendance}%
          </p>
        )}

        {data.overall.leavesAvailable > 0 && (
          <p className="text-green-600 text-sm mt-2">
            leaves available: {data.overall.leavesAvailable}
          </p>
        )}
      </div>

      {/* add subject */}
      <div className="mt-10 rounded-2xl border p-5">
        <h2 className="font-medium">add subject</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="subject name (eg maths)"
            className="h-12 px-4 rounded-xl border sm:col-span-2"
          />

          <input
            value={newMin}
            onChange={(e) => setNewMin(Number(e.target.value))}
            type="number"
            min={0}
            max={100}
            className="h-12 px-4 rounded-xl border"
            placeholder="min %"
          />
        </div>

        <button
          onClick={handleCreateSubject}
          className="mt-4 h-12 px-5 rounded-xl bg-black text-white"
        >
          add subject
        </button>

        {errMsg && <p className="text-red-500 text-sm mt-3">{errMsg}</p>}
      </div>

      {/* subjects */}
      <div className="mt-10">
        <h2 className="font-medium">subjects</h2>

        {data.subjects.length === 0 ? (
          <p className="text-gray-500 text-sm mt-4">no subjects yet.</p>
        ) : (
          <div className="mt-4 grid gap-4">
            {data.subjects.map((s) => (
              <div key={s.subjectId} className="rounded-2xl border p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">{s.name}</p>
                    <p className="text-sm text-gray-500">min: {s.minAttendance}%</p>
                  </div>

                  <button
                    onClick={() => handleDeleteSubject(s.subjectId)}
                    className="h-10 px-4 rounded-xl border text-sm hover:bg-gray-50"
                  >
                    delete
                  </button>
                </div>

                <div className="text-sm text-gray-700">
                  <span className="font-medium">
                    {s.attended}/{s.total}
                  </span>{" "}
                  attended •{" "}
                  <span className="font-medium">{s.attendancePercent}%</span>

                  {s.classesNeededToReach > 0 && (
                    <span className="text-red-500">
                      {" "}
                      • attend {s.classesNeededToReach} more
                    </span>
                  )}

                  {s.leavesAvailable > 0 && (
                    <span className="text-green-600">
                      {" "}
                      • leaves: {s.leavesAvailable}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleMark(s.subjectId, "attended")}
                    className="h-10 px-4 rounded-xl bg-black text-white text-sm"
                  >
                    attended
                  </button>

                  <button
                    onClick={() => handleMark(s.subjectId, "missed")}
                    className="h-10 px-4 rounded-xl border text-sm hover:bg-gray-50"
                  >
                    missed
                  </button>

                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-500">date</label>

                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="h-10 px-4 rounded-xl border text-sm"
                    />
                  </div>

                  <button
                    onClick={() => handleUndo(s.subjectId)}
                    className="h-10 px-4 rounded-xl border text-sm hover:bg-gray-50"
                  >
                    undo last
                  </button>

                  <button
                    onClick={() => {
                      setHistorySubjectId(s.subjectId);
                      setHistorySubjectName(s.name);
                      setHistoryOpen(true);
                    }}
                    className="h-10 px-4 rounded-xl border text-sm hover:bg-gray-50"
                  >
                    history
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SubjectHistoryModal
        open={historyOpen}
        subjectId={historySubjectId}
        subjectName={historySubjectName}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
);
}

