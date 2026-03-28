import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPolicy } from "../../api/policyApi";
import PolicyForm from "../../components/policy/PolicyForm";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuth from "../../hooks/useAuth";

export default function CreatePolicyPage() {
  const navigate = useNavigate();
  const { user, persona } = useAuth();
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const handleCreatePolicy = async (form) => {
    try {
      const created = await createPolicy({
        ...form,
        holderName: form.holderName || (persona === "insurer" ? "" : user?.name)
      });

      setFeedback({
        type: "success",
        message: `Policy ${created.policyId} created successfully.`
      });

      setTimeout(() => {
        navigate("/policyholder/policies");
      }, 400);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "Unable to create policy"
      });
    }
  };

  return (
    <DashboardLayout title="Create Policy">
      <div style={styles.wrapper}>
        <section style={styles.panel}>
          <p style={styles.kicker}>Policy onboarding</p>
          <h3 style={styles.title}>Register policy collateral for lending review.</h3>
          <p style={styles.copy}>
            A policyholder records the policy asset first. Later, selected value can
            be ceded to a lender while the remaining available balance stays visible
            across the portfolio.
          </p>

          {feedback.message && (
            <p style={feedback.type === "success" ? styles.success : styles.error}>
              {feedback.message}
            </p>
          )}
        </section>

        <PolicyForm
          onSubmit={handleCreatePolicy}
          defaultHolderName={persona === "insurer" ? "" : user?.name || ""}
        />
      </div>
    </DashboardLayout>
  );
}

const styles = {
  wrapper: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "24px",
    alignItems: "start"
  },
  panel: {
    background: "linear-gradient(160deg, rgba(14, 116, 144, 0.35), rgba(15, 23, 42, 0.95))",
    color: "#e5eef7",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 18px 45px rgba(2, 6, 23, 0.35)"
  },
  kicker: {
    margin: 0,
    color: "#7dd3fc",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: "12px"
  },
  title: {
    marginTop: "12px",
    marginBottom: "12px",
    fontSize: "28px",
    lineHeight: 1.2
  },
  copy: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.7
  },
  success: {
    marginTop: "18px",
    color: "#4ade80"
  },
  error: {
    marginTop: "18px",
    color: "#fca5a5"
  }
};
