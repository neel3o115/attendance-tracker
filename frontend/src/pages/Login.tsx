import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/auth";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg("");

    try {
      setLoading(true);
      const data = await login(email, password);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard");
    } catch (err: unknown) {
        const message =
            err instanceof Error ? err.message : "login failed";

        // axios error message (safe way)
        const axiosMsg =
            (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message;

        setErrMsg(axiosMsg || message);
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <h1 className="text-5xl font-bold tracking-tight">attendly</h1>
        <p className="text-gray-500 mt-2">track your attendance like a pro</p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-4">
          <input
            className="w-full border rounded-xl px-4 h-12"
            placeholder="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full border rounded-xl px-4 h-12"
            placeholder="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errMsg && <p className="text-red-500 text-sm">{errMsg}</p>}

          <button
            disabled={loading}
            className="w-full h-12 rounded-xl bg-black text-white font-medium disabled:opacity-60"
          >
            {loading ? "signing in..." : "sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-gray-600">
          don't have an account?{" "}
          <Link to="/register" className="underline">
            create one
          </Link>
        </p>
      </div>
    </div>
  );
}
