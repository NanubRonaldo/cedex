import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { getWorkspaceRole } from "../../utils/roles";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "policyholder@cedex.local",
    password: "password123"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugLines, setDebugLines] = useState([]);

  const pushDebug = (line) => {
    const timestamp = new Date().toISOString().slice(11, 23);
    setDebugLines((prev) => [...prev.slice(-10), `${timestamp} ${line}`]);
  };

  useEffect(() => {
    const onError = (event) => {
      pushDebug(`window.error: ${event.message || "unknown error"}`);
    };
    const onUnhandled = (event) => {
      const reason = event.reason?.message || String(event.reason || "unknown rejection");
      pushDebug(`unhandledrejection: ${reason}`);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandled);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandled);
    };
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    pushDebug(`submit clicked for ${form.email}`);
    setLoading(true);
    setError("");

    try {
      pushDebug("calling login()");
      const res = await login(form.email, form.password);
      pushDebug(`login() returned success=${String(res?.success)}`);

      if (!res.success) {
        setError(res.message);
        pushDebug(`login failed: ${res.message || "unknown reason"}`);
        return;
      }

      const target =
        getWorkspaceRole(res.user) === "lender"
          ? "/lender/dashboard"
          : "/policyholder/dashboard";

      pushDebug(`navigate -> ${target}`);
      navigate(target, { replace: true });
    } catch (error) {
      const message = error?.message || "Login failed";
      setError(message);
      pushDebug(`catch: ${message}`);
    } finally {
      setLoading(false);
      pushDebug("submit finished");
    }
  };

  return (
    <div style={styles.container}>
      <div>
        <p style={styles.eyebrow}>Cedex workspace</p>
        <h2 style={styles.title}>Sign in to manage policy collateral.</h2>
        <p style={styles.copy}>
          Policyholders register policies and track cessions. Lenders review
          available collateral and funding exposure.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          style={styles.input}
        />

        {error && <div style={styles.error}>{error}</div>}

        <button
          type="submit"
          style={styles.button}
          disabled={loading}
          onClick={() => pushDebug("button click")}
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>

      <div style={styles.demoBox}>
        <strong>Demo accounts</strong>
        <button type="button" style={styles.demoBtn} onClick={() => setForm({ email: "lender@cedex.local", password: "password123" })}>Lender</button>
        <button type="button" style={styles.demoBtn} onClick={() => setForm({ email: "borrower@cedex.local", password: "password123" })}>Borrower</button>
        <button type="button" style={styles.demoBtn} onClick={() => setForm({ email: "insurer@cedex.local", password: "password123" })}>Insurer</button>
      </div>

      <div style={styles.debugBox}>
        <strong>Login debug trace</strong>
        {debugLines.length === 0 ? (
          <p style={styles.debugEmpty}>No events yet. Click Login.</p>
        ) : (
          debugLines.map((line, index) => (
            <p key={`${line}-${index}`} style={styles.debugLine}>
              {line}
            </p>
          ))
        )}
      </div>

      <p style={styles.footer}>
        Need a new account? <Link to="/register" style={styles.link}>Register</Link>
      </p>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },
  eyebrow: {
    margin: 0,
    color: "#7dd3fc",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: "12px"
  },
  title: {
    marginBottom: "10px"
  },
  copy: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.6
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  input: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "#020617",
    color: "#fff",
    outline: "none"
  },
  button: {
    padding: "12px",
    borderRadius: "999px",
    border: "none",
    background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold"
  },
  error: {
    color: "#f87171",
    fontSize: "13px",
    textAlign: "center"
  },
  demoBox: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    background: "rgba(15, 23, 42, 0.8)",
    border: "1px solid rgba(125, 211, 252, 0.18)",
    borderRadius: "12px",
    padding: "14px",
    color: "#dbeafe",
    fontSize: "13px"
  },
  demoBtn: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(125, 211, 252, 0.28)",
    background: "rgba(15, 23, 42, 0.95)",
    color: "#e2e8f0",
    cursor: "pointer",
    textAlign: "left"
  },
  debugBox: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    background: "#020617",
    border: "1px solid #1e293b",
    borderRadius: "10px",
    padding: "10px",
    color: "#cbd5e1",
    fontSize: "12px",
    maxHeight: "180px",
    overflowY: "auto"
  },
  debugEmpty: {
    margin: 0,
    color: "#94a3b8"
  },
  debugLine: {
    margin: 0,
    fontFamily: "Consolas, monospace",
    color: "#e2e8f0"
  },
  footer: {
    margin: 0,
    color: "#cbd5e1",
    textAlign: "center"
  },
  link: {
    color: "#7dd3fc"
  }
};
