import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as authApi from "../../api/authApi";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "policyholder"
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await authApi.register(form);
      setMessage("Registration successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 700);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div>
        <p style={styles.eyebrow}>Create account</p>
        <h2 style={styles.title}>Join the collateral marketplace.</h2>
        <p style={styles.copy}>
          Choose whether you are onboarding as a policyholder listing policy
          assets or as a lender reviewing available collateral.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
          style={styles.input}
        />

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

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="policyholder">Policyholder</option>
          <option value="lender">Lender</option>
        </select>

        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      <p style={styles.footer}>
        Already have access? <Link to="/login" style={styles.link}>Login</Link>
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
  success: {
    color: "#4ade80",
    fontSize: "13px",
    textAlign: "center"
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
