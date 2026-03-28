import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import useFetch from "../../hooks/useFetch";
import { getPolicies } from "../../api/policyApi";
import PolicyCard from "../../components/policy/PolicyCard";
import PolicyTable from "../../components/policy/PolicyTable";
import PolicyModal from "../../components/policy/PolicyModal";
import { useState } from "react";

export default function MyPolicies() {
  const navigate = useNavigate();
  const [previewPolicy, setPreviewPolicy] = useState(null);
  const { data: rawPolicies = [], loading, error } = useFetch(getPolicies);
  const policies = Array.isArray(rawPolicies) ? rawPolicies : [];

  const openPolicy = (policy) => setPreviewPolicy(policy);
  const openDetails = (policy) => navigate(`/policy/${policy.policyId}`);

  if (loading) return <p style={styles.loading}>Loading policies...</p>;

  return (
    <DashboardLayout title="My Policies">
      <div style={styles.headerCard}>
        <h3 style={styles.headerTitle}>Collateral portfolio</h3>
        <p style={styles.headerCopy}>
          Review policy balances, inspect existing cessions, and drill into policy
          priority structure before creating new lending arrangements.
        </p>
      </div>

      <div style={styles.grid}>
        {policies.map((p) => (
          <PolicyCard key={p.policyId} policy={p} onClick={openPolicy} />
        ))}
      </div>

      {error && (
        <div style={styles.errorBox}>
          <p style={styles.errorText}>Policies: {error}</p>
        </div>
      )}

      <div style={styles.tableWrap}>
        <PolicyTable
          policies={policies}
          onSelect={openDetails}
          actionLabel="Details"
          title="Policy Register"
        />
      </div>

      <PolicyModal
        open={Boolean(previewPolicy)}
        policy={previewPolicy}
        onClose={() => setPreviewPolicy(null)}
        primaryLabel="Open Full Policy"
        onPrimaryAction={() => {
          if (!previewPolicy) return;
          openDetails(previewPolicy);
        }}
      />
    </DashboardLayout>
  );
}

const styles = {
  headerCard: {
    gridColumn: "1 / -1",
    background: "linear-gradient(150deg, rgba(8, 145, 178, 0.22), rgba(15, 23, 42, 0.96))",
    borderRadius: "20px",
    padding: "24px",
    color: "#e5eef7"
  },
  headerTitle: {
    marginTop: 0,
    marginBottom: "10px"
  },
  headerCopy: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.6
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    gridColumn: "1 / -1"
  },
  tableWrap: {
    gridColumn: "1 / -1"
  },
  errorBox: {
    gridColumn: "1 / -1",
    background: "rgba(127, 29, 29, 0.35)",
    border: "1px solid rgba(248, 113, 113, 0.45)",
    borderRadius: "12px",
    padding: "12px 14px"
  },
  errorText: {
    margin: 0,
    color: "#fecaca",
    fontSize: "13px"
  },
  loading: {
    color: "#fff",
    textAlign: "center",
    marginTop: "50px"
  }
};
