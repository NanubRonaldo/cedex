import { useState } from "react";

export default function PolicyForm({ onSubmit, defaultHolderName = "" }) {
  const [form, setForm] = useState({
    holderName: defaultHolderName,
    insurer: "",
    productType: "",
    totalValue: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.holderName || !form.insurer || !form.productType || !form.totalValue) {
      alert("Please fill all fields");
      return;
    }

    onSubmit({
      ...form,
      totalValue: Number(form.totalValue)
    });
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h3 style={styles.title}>Create Policy</h3>

        <input
          name="holderName"
          placeholder="Policy Holder Name"
          onChange={handleChange}
          value={form.holderName}
          style={styles.input}
        />

        <input
          name="insurer"
          placeholder="Insurer"
          onChange={handleChange}
          value={form.insurer}
          style={styles.input}
        />

        <select
          name="productType"
          onChange={handleChange}
          value={form.productType}
          style={styles.input}
        >
          <option value="">Select Product Type</option>
          <option value="Whole Life">Whole Life</option>
          <option value="Disability">Disability</option>
          <option value="Education Plan">Education Plan</option>
          <option value="Retirement Plan">Retirement Plan</option>
        </select>

        <input
          name="totalValue"
          type="number"
          placeholder="Total Policy Value"
          onChange={handleChange}
          value={form.totalValue}
          style={styles.input}
        />

        <button type="submit" style={styles.button}>
          Create Policy
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center"
  },
  form: {
    width: "100%",
    maxWidth: "420px",
    padding: "24px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.96)",
    boxShadow: "0 22px 55px rgba(15, 23, 42, 0.18)",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  title: {
    textAlign: "center",
    marginBottom: "8px",
    color: "#0f172a"
  },
  input: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    background: "#f8fafc"
  },
  button: {
    padding: "12px",
    borderRadius: "999px",
    border: "none",
    background: "linear-gradient(135deg, #0891b2, #2563eb)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700"
  }
};
