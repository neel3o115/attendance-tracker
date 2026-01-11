import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCourse, deleteCourse, getCourses } from "../api/courses";
import type { Course } from "../types/course";

export default function Dashboard() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [minAttendance, setMinAttendance] = useState(75);

  const [errMsg, setErrMsg] = useState("");

  const fetchCourses = async () => {
    try {
      setErrMsg("");
      setLoading(true);
      const data = await getCourses();
      setCourses(data);
    } catch {
      setErrMsg("failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      setErrMsg("");
      await createCourse(name.trim(), minAttendance);
      setName("");
      setMinAttendance(75);
      await fetchCourses();
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setErrMsg(axiosMsg || "failed to create course");
    }
  };

  const handleDelete = async (courseId: string) => {
    const ok = confirm("delete this course?");
    if (!ok) return;

    try {
      setErrMsg("");
      await deleteCourse(courseId);
      await fetchCourses();
    } catch {
      setErrMsg("failed to delete course");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const user = localStorage.getItem("user");
  const parsedUser = user ? JSON.parse(user) : null;

  return (
    <div className="min-h-screen px-6 py-8 max-w-5xl mx-auto">
      {/* top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            hey {parsedUser?.name || "pookie"}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="h-10 px-4 rounded-xl border text-sm hover:bg-gray-50"
        >
          logout
        </button>
      </div>

      {/* create course */}
      <div className="mt-10 rounded-2xl border p-5">
        <h2 className="font-medium">create course</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="course name (eg semester 4)"
            className="h-12 px-4 rounded-xl border sm:col-span-2"
          />

          <input
            value={minAttendance}
            onChange={(e) => setMinAttendance(Number(e.target.value))}
            type="number"
            min={0}
            max={100}
            className="h-12 px-4 rounded-xl border"
            placeholder="min %"
          />
        </div>

        <button
          onClick={handleCreate}
          className="mt-4 h-12 px-5 rounded-xl bg-black text-white"
        >
          add course
        </button>

        {errMsg && <p className="text-red-500 text-sm mt-3">{errMsg}</p>}
      </div>

      {/* courses */}
      <div className="mt-10">
        <h2 className="font-medium">your courses</h2>

        {loading ? (
          <p className="text-gray-500 text-sm mt-4">loading...</p>
        ) : courses.length === 0 ? (
          <p className="text-gray-500 text-sm mt-4">no courses yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {courses.map((c) => (
              <div
                key={c._id}
                className="rounded-2xl border p-5 flex items-center justify-between"
              >
                <div>
                  <p className="text-lg font-semibold">{c.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    min attendance: {c.minAttendance}%
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/course/${c._id}`)}
                    className="h-10 px-4 rounded-xl bg-black text-white text-sm"
                  >
                    open
                  </button>

                  <button
                    onClick={() => handleDelete(c._id)}
                    className="h-10 px-4 rounded-xl border text-sm hover:bg-gray-50"
                  >
                    delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}