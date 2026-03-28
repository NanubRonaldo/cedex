import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import useFetch from "../../hooks/useFetch";
import { getPolicies } from "../../api/policyApi";
import {
  approveCession,
  consentCession,
  getCessions,
  releaseCession,
  requestReleaseCession
} from "../../api/cessionApi";
import useAuth from "../../hooks/useAuth";
import { formatNAD } from "../../utils/currency";
import CessionWorkflowPanel from "../../components/cession/CessionWorkflowPanel";

export default function Dashboard() {
  const { persona } = useAuth();
  const { data: rawPolicies = [], error: policiesError } = useFetch(getPolicies);
  const {
    data: rawCessions = [],
    error: cessionsError,
    refetch: refetchCessions
  } = useFetch(getCessions);
  const policies = Array.isArray(rawPolicies) ? rawPolicies : [];
  const cessions = Array.isArray(rawCessions) ? rawCessions : [];

  const totalValue = policies.reduce((sum, p) => sum + p.totalValue, 0);
  const availableValue = policies.reduce((sum, p) => sum + p.availableValue, 0);
  const cededValue = totalValue - availableValue;
  const activeCessions = cessions.filter((cession) => cession.status === "active");
  const borrowerConsentQueue = cessions.filter(
    (cession) => cession.status === "requested" && !cession.borrowerConsented
  );
  const insurerApprovalQueue = cessions.filter(
    (cession) => cession.status === "consented" && cession.borrowerConsented && !cession.insurerApproved
  );
  const borrowerReleaseQueue = cessions.filter((cession) => cession.status === "active");
  const insurerReleaseQueue = cessions.filter((cession) => cession.status === "lender_release_approved");
  const dashboardTitle = persona === "insurer" ? "Insurer Dashboard" : "Borrower Dashboard";
  const uniqueFunctions =
    persona === "insurer"
      ? [
          "RegisterPolicy",
          "StorePolicyholderPrivateData",
          "StoreMedicalUnderwritingData",
          "StorePremiumPaymentData",
          "StoreRegulatoryReport",
          "StoreDisputeData",
          "ReleaseCession"
        ]
      : [
          "RegisterPolicy",
          "CalculateAvailableCollateral",
          "CreateCessionWithLenderType",
          "GetCessionsByPriority",
          "RequestReleaseFromBorrower"
        ];

  return (
    <DashboardLayout title={dashboardTitle}>
      <section style={styles.hero}>
        <p style={styles.kicker}>Portfolio oversight</p>
        <h3 style={styles.heading}>Track insurable value and what portion is already pledged.</h3>
        <p style={styles.copy}>
          Use Cedex to register policy assets, preserve a live view of available collateral,
          and monitor how much has already been ceded to lenders.
        </p>
        <div style={styles.heroActions}>
          <Link to="/policyholder/create-policy" style={styles.primaryLink}>Create Policy</Link>
          <Link to="/policyholder/policies" style={styles.secondaryLink}>Open Portfolio</Link>
        </div>
      </section>

      {(policiesError || cessionsError) && (
        <div style={styles.errorBox}>
          {policiesError && <p style={styles.errorText}>Policies: {policiesError}</p>}
          {cessionsError && <p style={styles.errorText}>Cessions: {cessionsError}</p>}
        </div>
      )}

      <MetricCard label="Total Policy Value" value={totalValue} accent="#38bdf8" />
      <MetricCard label="Available Collateral" value={availableValue} accent="#22c55e" />
      <MetricCard label="Ceded Value" value={cededValue} accent="#3b82f6" />
      <MetricCard label="Active Cessions" value={activeCessions.length} accent="#f59e0b" integer />

      <section style={styles.functionPanel}>
        <h3 style={styles.functionTitle}>Unique On-Chain Functions ({persona || "policyholder"})</h3>
        <div style={styles.functionGrid}>
          {uniqueFunctions.map((name) => (
            <span key={name} style={styles.functionChip}>{name}</span>
          ))}
        </div>
      </section>

      {persona === "insurer" ? (
        <>
          <CessionWorkflowPanel
            title="Insurer Approval Queue"
            subtitle="Approve consented cessions after validating policy death/retrenchment coverage."
            items={insurerApprovalQueue}
            actionLabel="Approve"
            onAction={approveCession}
            onRefresh={refetchCessions}
          />
          <CessionWorkflowPanel
            title="Release Pipeline - Insurer Step"
            subtitle="Step 3 of 3: finalize release after lender approval and insurer notification."
            items={insurerReleaseQueue}
            actionLabel="Finalize Release"
            onAction={releaseCession}
            onRefresh={refetchCessions}
            legendItems={["active", "release_requested", "lender_release_approved", "released"]}
          />
        </>
      ) : (
        <>
          <CessionWorkflowPanel
            title="Borrower Consent Queue"
            subtitle="Consent requested cessions before insurer approval can proceed."
            items={borrowerConsentQueue}
            actionLabel="Consent"
            onAction={consentCession}
            onRefresh={refetchCessions}
          />
          <CessionWorkflowPanel
            title="Release Pipeline - Borrower Step"
            subtitle="Step 1 of 3: request release for active cessions once repayment is complete."
            items={borrowerReleaseQueue}
            actionLabel="Request Release"
            onAction={requestReleaseCession}
            onRefresh={refetchCessions}
            legendItems={["active", "release_requested", "lender_release_approved", "released"]}
          />
        </>
      )}
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
    background: "linear-gradient(150deg, rgba(14, 165, 233, 0.24), rgba(15, 23, 42, 0.96))",
    borderRadius: "20px",
    padding: "24px",
    color: "#e5eef7"
  },
  kicker: {
    margin: 0,
    color: "#7dd3fc",
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
  heroActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "18px"
  },
  primaryLink: {
    background: "#fff",
    color: "#0f172a",
    textDecoration: "none",
    padding: "10px 16px",
    borderRadius: "999px",
    fontWeight: "700"
  },
  secondaryLink: {
    border: "1px solid rgba(255,255,255,0.28)",
    color: "#fff",
    textDecoration: "none",
    padding: "10px 16px",
    borderRadius: "999px"
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
    background: "rgba(56, 189, 248, 0.14)",
    border: "1px solid rgba(56, 189, 248, 0.32)",
    color: "#bae6fd",
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
