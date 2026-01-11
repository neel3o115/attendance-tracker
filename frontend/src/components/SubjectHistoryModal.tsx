import { useEffect, useMemo, useState } from "react";
import { getSubjectHistory } from "../api/attendance";

type Props = {
  open: boolean;
  subjectId: string | null;
  subjectName?: string;
  onClose: () => void;
};

type Entry = {
  _id: string;
  date: string;
  status: "attended" | "missed";
};

function ymd(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function SubjectHistoryModal({
  open,
  subjectId,
  subjectName,
  onClose,
}: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  // current month state
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const monthLabel = useMemo(() => {
    return cursor.toLocaleString(undefined, { month: "long", year: "numeric" });
  }, [cursor]);

  const map = useMemo(() => {
    const m = new Map<string, Entry>();
    for (const e of entries) {
      const key = ymd(new Date(e.date));
      // if multiple entries on same day, keep latest
      m.set(key, e);
    }
    return m;
  }, [entries]);

  useEffect(() => {
    if (!open || !subjectId) return;

    (async () => {
      try {
        setLoading(true);
        const data = await getSubjectHistory(subjectId);
        setEntries(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, subjectId]);

  const days = useMemo(() => {
    const start = new Date(cursor);
    const year = start.getFullYear();
    const month = start.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 0=Sun .. 6=Sat
    const leading = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const cells: { date: Date | null; key: string }[] = [];

    // leading blanks
    for (let i = 0; i < leading; i++) cells.push({ date: null, key: `b${i}` });

    // month days
    for (let d = 1; d <= totalDays; d++) {
      const dt = new Date(year, month, d);
      cells.push({ date: dt, key: ymd(dt) });
    }

    return cells;
  }, [cursor]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      {/* modal */}
      <div className="absolute left-1/2 top-1/2 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">history</p>
            <h2 className="text-xl font-semibold">{subjectName || "subject"}</h2>
          </div>

          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl border text-sm hover:bg-gray-50"
          >
            close
          </button>
        </div>

        {/* month nav */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => {
              const d = new Date(cursor);
              d.setMonth(d.getMonth() - 1);
              setCursor(d);
            }}
            className="h-10 px-4 rounded-xl border text-sm hover:bg-gray-50"
          >
            ←
          </button>

          <p className="text-sm font-medium">{monthLabel}</p>

          <button
            onClick={() => {
              const d = new Date(cursor);
              d.setMonth(d.getMonth() + 1);
              setCursor(d);
            }}
            className="h-10 px-4 rounded-xl border text-sm hover:bg-gray-50"
          >
            →
          </button>
        </div>

        {/* legend */}
        <div className="mt-4 flex gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            attended
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            missed
          </div>
          <div className="flex items-center gap-2 opacity-40">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            holiday (later)
          </div>
        </div>

        {/* calendar */}
        <div className="mt-5">
          <div className="grid grid-cols-7 gap-2 text-xs text-gray-400 mb-2">
            {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((d) => (
              <div key={d} className="text-center">{d}</div>
            ))}
          </div>

          {loading ? (
            <p className="text-sm text-gray-500 mt-4">loading...</p>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {days.map((cell) => {
                if (!cell.date) {
                  return <div key={cell.key} className="h-12" />;
                }

                const key = ymd(cell.date);
                const entry = map.get(key);

                let bg = "bg-white";
                let border = "border";
                let text = "text-gray-900";

                if (entry?.status === "attended") {
                  bg = "bg-green-100";
                  border = "border-green-200";
                  text = "text-green-900";
                }
                if (entry?.status === "missed") {
                  bg = "bg-red-100";
                  border = "border-red-200";
                  text = "text-red-900";
                }

                return (
                  <div
                    key={cell.key}
                    className={`h-12 rounded-2xl ${bg} ${border} flex items-center justify-center text-sm font-medium ${text}`}
                    title={entry ? `${entry.status} (${key})` : key}
                  >
                    {cell.date.getDate()}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
