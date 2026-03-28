import { useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import useFetch from "../../hooks/useFetch";
import {
  getAvailableCapacity,
  getPolicyById,
  getPolicyCollateralStatus
} from "../../api/policyApi";
import {
  getPriorityCessionsByPolicy,
  lenderApproveReleaseCession,
  requestReleaseCession,
  releaseCession
} from "../../api/cessionApi";
import CededValueBar from "../../components/policy/cededValueBar";
import CessionTable from "../../components/cession/CessionTable";
import useAuth from "../../hooks/useAuth";
import { formatNAD } from "../../utils/currency";

export default function PolicyDetails() {
  const { id } = useParams();
  const { persona, workspaceRole } = useAuth();
  const [message, setMessage] = useState("");
  const { data: policy, refetch: refetchPolicy } = useFetch(() => getPolicyById(id));
  const { data: collateralStatus, refetch: refetchCollateralStatus } = useFetch(
    () => getPolicyCollateralStatus(id)
  );
  const { data: capacity, refetch: refetchCapacity } = useFetch(
    () => getAvailableCapacity(id)
  );
  const { data: rawCessions = [], refetch: refetchCessions } = useFetch(
    () => getPriorityCessionsByPolicy(id)
  );
  const cessions = Array.isArray(rawCessions) ? rawCessions : [];

  const handleRelease = async (cession) => {
    try {
      if (persona === "borrower" && cession.status === "active") {
        await requestReleaseCession(cession.cessionId);
        setMessage(`Release request submitted for ${cession.cessionId}.`);
      } else if (workspaceRole === "lender" && cession.status === "release_requested") {
        await lenderApproveReleaseCession(cession.cessionId);
        setMessage(`Lender approved ${cession.cessionId} and insurer notified.`);
      } else if (persona === "insurer" && cession.status === "lender_release_approved") {
        await releaseCession(cession.cessionId);
        setMessage(`Cession ${cession.cessionId} released.`);
      } else {
        setMessage("No release action available for your role at this stage.");
        return;
      }
      refetchPolicy();
      refetchCollateralStatus();
      refetchCapacity();
      refetchCessions();
    } catch (err) {
      setMessage(err.response?.data?.message || "Unable to complete release transition");
    }
  };

  if (!policy) return <p style={styles.loading}>Loading...</p>;

  const cededValue = policy.totalValue - policy.availableValue;
  const releaseRelevantStatuses = ["active", "release_requested", "lender_release_approved"];
  const latestCession = cessions.find((cession) => releaseRelevantStatuses.includes(cession.status));
  const canActOnLatest =
    latestCession &&
    ((persona === "borrower" && latestCession.status === "active") ||
      (workspaceRole === "lender" && latestCession.status === "release_requested") ||
      (persona === "insurer" && latestCession.status === "lender_release_approved"));
  const releaseActionLabel =
    persona === "borrower"
      ? "Request Release"
      : workspaceRole === "lender"
      ? "Approve & Notify Insurer"
      : "Finalize Release";

  return (
    <DashboardLayout title={`Policy ${policy.policyId}`}>
      <section style={styles.summaryCard}>
        <div>
          <p style={styles.kicker}>Policy summary</p>
          <h3 style={styles.heading}>{policy.insurer}</h3>
          <p style={styles.copy}>
            Holder: {policy.holderName} | Product: {policy.productType}
          </p>
        </div>

        <div style={styles.metrics}>
          <div style={styles.metric}>
            <span>Total Value</span>
            <strong>{formatNAD(policy.totalValue)}</strong>
          </div>
          <div style={styles.metric}>
            <span>Available Balance</span>
            <strong>{formatNAD(policy.availableValue)}</strong>
          </div>
          <div style={styles.metric}>
            <span>Ceded Value</span>
            <strong>{formatNAD(cededValue)}</strong>
          </div>
        </div>

        <CededValueBar
          totalValue={policy.totalValue}
          cededValue={cededValue}
        />
      </section>

      <section style={styles.statusGrid}>
        <StatusCard
          label="Utilization"
          value={`${Number(collateralStatus?.utilizationPercentage || 0).toLocaleString()}%`}
          copy="Share of policy value already programmed into active credit collateral."
        />
        <StatusCard
          label="Remaining Lending Capacity"
          value={formatNAD(Number(capacity?.potentialLoanAmount || 0))}
          copy="Estimated loan amount still supportable under the 48.3% credit-life ratio."
        />
        <StatusCard
          label="Active Tokenized Cessions"
          value={String(Number(collateralStatus?.activeCessions || 0))}
          copy="Live cessions currently holding a ranked claim over this policy."
        />
      </section>

      <section style={styles.coverageCard}>
        <div>
          <p style={styles.kicker}>Coverage stack</p>
          <h3 style={styles.coverageTitle}>Collateral composition behind the policy</h3>
        </div>
        <div style={styles.coverageGrid}>
          <CoverageMetric label="Death Cover" value={policy.deathCover} />
          <CoverageMetric label="Disability Cover" value={policy.disabilityCover} />
          <CoverageMetric label="Critical Illness" value={policy.criticalIllnessCover} />
          <CoverageMetric label="Retrenchment Cover" value={policy.retrenchmentCover} />
        </div>
      </section>

      {latestCession && (
        <section style={styles.actionCard}>
          <h3 style={styles.actionTitle}>Active cession control</h3>
          <p style={styles.copy}>
            Highest-priority active cession: {latestCession.cessionId} for {formatNAD(latestCession.amount)}.
            {" "}Loan amount {formatNAD(Number(latestCession.loanAmount || 0))} with
            {" "}{formatNAD(Number(latestCession.lifeCoverPortion || 0))} backed by
            the existing policy and {formatNAD(Number(latestCession.retrenchmentPortion || 0))}
            {" "}reserved for the retrenchment top-up.
          </p>
          <div style={styles.actionRow}>
            <button
              style={styles.releaseBtn}
              disabled={!canActOnLatest}
              onClick={() => handleRelease(latestCession)}
            >
              {releaseActionLabel}
            </button>
            <span style={styles.helperText}>
              {persona === "borrower"
                ? "Step 1: borrower requests release."
                : workspaceRole === "lender"
                ? "Step 2: lender approves request and notifies insurer."
                : "Step 3: insurer finalizes release on-chain."}
            </span>
          </div>
          {message && <p style={styles.message}>{message}</p>}
        </section>
      )}

      <div style={styles.tableWrap}>
        <CessionTable
          cessions={cessions}
          onSelect={handleRelease}
          actionLabel={releaseActionLabel}
          title="Priority Queue"
          isActionDisabled={(cession) =>
            !(
              (persona === "borrower" && cession.status === "active") ||
              (workspaceRole === "lender" && cession.status === "release_requested") ||
              (persona === "insurer" && cession.status === "lender_release_approved")
            )
          }
        />
      </div>
    </DashboardLayout>
  );
}

function StatusCard({ label, value, copy }) {
  return (
    <article style={styles.statusCard}>
      <span style={styles.statusLabel}>{label}</span>
      <strong style={styles.statusValue}>{value}</strong>
      <p style={styles.statusCopy}>{copy}</p>
    </article>
  );
}

function CoverageMetric({ label, value }) {
  return (
    <div style={styles.coverageMetric}>
      <span style={styles.coverageLabel}>{label}</span>
      <strong style={styles.coverageValue}>{formatNAD(Number(value || 0))}</strong>
    </div>
  );
}

const styles = {
  summaryCard: {
    gridColumn: "1 / -1",
    background: "linear-gradient(150deg, rgba(14, 116, 144, 0.22), rgba(15, 23, 42, 0.96))",
    borderRadius: "20px",
    padding: "24px",
    color: "#e5eef7",
    boxShadow: "0 22px 48px rgba(15, 23, 42, 0.2)"
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
    marginBottom: "8px"
  },
  copy: {
    color: "#cbd5e1",
    margin: 0,
    lineHeight: 1.6
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    margin: "20px 0"
  },
  metric: {
    background: "rgba(15, 23, 42, 0.55)",
    borderRadius: "14px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  actionCard: {
    gridColumn: "1 / -1",
    background: "#fff",
    borderRadius: "20px",
    padding: "22px",
    boxShadow: "0 22px 48px rgba(15, 23, 42, 0.18)"
  },
  actionTitle: {
    marginTop: 0,
    color: "#0f172a"
  },
  actionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    alignItems: "center",
    marginTop: "16px"
  },
  releaseBtn: {
    padding: "10px 16px",
    borderRadius: "999px",
    border: "none",
    background: "#dc2626",
    color: "#fff",
    cursor: "pointer"
  },
  helperText: {
    color: "#475569",
    fontSize: "13px"
  },
  message: {
    marginTop: "14px",
    color: "#0284c7"
  },
  tableWrap: {
    gridColumn: "1 / -1"
  },
  statusGrid: {
    gridColumn: "1 / -1",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px"
  },
  statusCard: {
    background: "#fff",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 22px 48px rgba(15, 23, 42, 0.18)",
    display: "grid",
    gap: "8px"
  },
  statusLabel: {
    color: "#64748b",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: "700"
  },
  statusValue: {
    color: "#0f172a",
    fontSize: "24px"
  },
  statusCopy: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.6,
    fontSize: "13px"
  },
  coverageCard: {
    gridColumn: "1 / -1",
    background: "#fff",
    borderRadius: "20px",
    padding: "22px",
    boxShadow: "0 22px 48px rgba(15, 23, 42, 0.18)",
    display: "grid",
    gap: "16px"
  },
  coverageTitle: {
    margin: "8px 0 0",
    color: "#0f172a"
  },
  coverageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px"
  },
  coverageMetric: {
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    padding: "14px",
    display: "grid",
    gap: "6px"
  },
  coverageLabel: {
    color: "#64748b",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.06em"
  },
  coverageValue: {
    color: "#0f172a",
    fontSize: "20px"
  },
  loading: {
    color: "#fff",
    textAlign: "center",
    marginTop: "50px"
  }
};
