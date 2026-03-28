import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import useFetch from "../../hooks/useFetch";
import { getPolicies } from "../../api/policyApi";
import { activateCession, getCessions, lenderApproveReleaseCession } from "../../api/cessionApi";
import { getBanks, getMicrolenders } from "../../api/lenderApi";
import { formatNAD } from "../../utils/currency";
import CessionWorkflowPanel from "../../components/cession/CessionWorkflowPanel";

export default function LenderDashboard() {
  const { data: rawPolicies = [], error: policiesError } = useFetch(getPolicies);
  const {
    data: rawCessions = [],
    error: cessionsError,
    refetch: refetchCessions
  } = useFetch(getCessions);
  const { data: rawBanks = [] } = useFetch(getBanks);
  const { data: rawMicrolenders = [] } = useFetch(getMicrolenders);
  const policies = Array.isArray(rawPolicies) ? rawPolicies : [];
  const cessions = Array.isArray(rawCessions) ? rawCessions : [];
  const banks = Array.isArray(rawBanks) ? rawBanks : [];
  const microlenders = Array.isArray(rawMicrolenders) ? rawMicrolenders : [];

  const availableDeals = policies.filter((p) => p.availableValue > 0);
  const totalExposure = cessions.reduce((sum, c) => {
    return c.status === "active" ? sum + c.amount : sum;
  }, 0);
  const lifeCoverBacked = cessions.reduce((sum, c) => {
    return c.status === "active" ? sum + Number(c.lifeCoverPortion || 0) : sum;
  }, 0);
  const retrenchmentGap = cessions.reduce((sum, c) => {
    return c.status === "active" ? sum + Number(c.retrenchmentPortion || 0) : sum;
  }, 0);
  const activationQueue = cessions.filter(
    (cession) => cession.status === "insurer_approved" && cession.insurerApproved
  );
  const releaseApprovalQueue = cessions.filter((cession) => cession.status === "release_requested");

  return (
    <DashboardLayout title="Lender Dashboard">
      <section style={styles.hero}>
        <p style={styles.kicker}>Funding command center</p>
        <h3 style={styles.heading}>Review available policy collateral before taking exposure.</h3>
        <p style={styles.copy}>
          Prioritize policies with open collateral, create cessions when funding is approved,
          and monitor rank-sensitive obligations across the lending book.
        </p>
        <Link to="/lender/policies" style={styles.link}>Review Available Policies</Link>
      </section>

      {(policiesError || cessionsError) && (
        <div style={styles.errorBox}>
          {policiesError && <p style={styles.errorText}>Policies: {policiesError}</p>}
          {cessionsError && <p style={styles.errorText}>Cessions: {cessionsError}</p>}
        </div>
      )}

      <MetricCard label="Available Policies" value={availableDeals.length} accent="#38bdf8" />
      <MetricCard
        label="Total Available Collateral"
        value={availableDeals.reduce((sum, p) => sum + p.availableValue, 0)}
        accent="#22c55e"
      />
      <MetricCard label="Active Exposure" value={totalExposure} accent="#f59e0b" />
      <MetricCard
        label="Active Cessions"
        value={cessions.filter((c) => c.status === "active").length}
        accent="#3b82f6"
        integer
      />
      <MetricCard label="Policy-Backed 80% Portion" value={lifeCoverBacked} accent="#14b8a6" />
      <MetricCard label="20% Top-Up Requirement" value={retrenchmentGap} accent="#f97316" />
      <MetricCard label="Registered Banks" value={banks.length} accent="#93c5fd" integer />
      <MetricCard label="Registered Microlenders" value={microlenders.length} accent="#a7f3d0" integer />

      <section style={styles.functionPanel}>
        <h3 style={styles.functionTitle}>Unique Lender Functions</h3>
        <div style={styles.functionGrid}>
          {[
            "RegisterLender",
            "GetLendersByType",
            "CreateCessionWithLenderType",
            "GetCessionsByPriority",
            "StoreLenderPortfolioData",
            "LenderApproveReleaseAndNotifyInsurer"
          ].map((fn) => (
            <span key={fn} style={styles.functionChip}>{fn}</span>
          ))}
        </div>
      </section>

      <CessionWorkflowPanel
        title="Activation Queue"
        subtitle="Final lender step: activate insurer-approved cessions and mint active tokenized collateral."
        items={activationQueue}
        actionLabel="Activate"
        onAction={activateCession}
        onRefresh={refetchCessions}
      />

      <CessionWorkflowPanel
        title="Release Pipeline - Lender Step"
        subtitle="Step 2 of 3: approve borrower release requests and notify insurer for final release."
        items={releaseApprovalQueue}
        actionLabel="Approve & Notify"
        onAction={lenderApproveReleaseCession}
        onRefresh={refetchCessions}
        legendItems={["active", "release_requested", "lender_release_approved", "released"]}
      />
    </DashboardLayout>
  );
}

function MetricCard({ label, value, accent, integer = false }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.cardLabel}>{label}</h3>
      <p style={{ ...styles.value, color: accent }}>
        {integer ? value : formatNAD(value)}
      </p>
    </div>
  );
}

const styles = {
  hero: {
    gridColumn: "1 / -1",
    background: "linear-gradient(150deg, rgba(37, 99, 235, 0.22), rgba(15, 23, 42, 0.96))",
    borderRadius: "20px",
    padding: "24px",
    color: "#e5eef7"
  },
  kicker: {
    margin: 0,
    color: "#93c5fd",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: "12px"
  },
  heading: {
    marginTop: "10px",
    marginBottom: "10px"
  },
  copy: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.6
  },
  link: {
    display: "inline-block",
    marginTop: "18px",
    background: "#fff",
    color: "#0f172a",
    textDecoration: "none",
    padding: "10px 16px",
    borderRadius: "999px",
    fontWeight: "700"
  },
  card: {
    background: "#111827",
    borderRadius: "18px",
    padding: "22px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.32)"
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
  functionPanel: {
    gridColumn: "1 / -1",
    background: "#0b1220",
    borderRadius: "16px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    padding: "18px"
  },
  functionTitle: {
    margin: 0,
    color: "#cbd5e1"
  },
  functionGrid: {
    marginTop: "12px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap"
  },
  functionChip: {
    borderRadius: "999px",
    padding: "7px 10px",
    background: "rgba(147, 197, 253, 0.14)",
    border: "1px solid rgba(147, 197, 253, 0.32)",
    color: "#bfdbfe",
    fontSize: "12px"
  },
  cardLabel: {
    color: "#cbd5e1",
    marginTop: 0
  },
  value: {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: 0
  }
};
