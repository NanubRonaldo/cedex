import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import useFetch from "../../hooks/useFetch";
import { createTokenizedCession } from "../../api/cessionApi";
import {
  calculateCollateral,
  getAvailableCapacity,
  getAvailablePolicies
} from "../../api/policyApi";
import PolicyCard from "../../components/policy/PolicyCard";
import PolicyTable from "../../components/policy/PolicyTable";
import useAuth from "../../hooks/useAuth";
import { formatNAD } from "../../utils/currency";
import PolicyModal from "../../components/policy/PolicyModal";

export default function AvailablePolicies() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: rawPolicies = [], loading, error, refetch } = useFetch(getAvailablePolicies);
  const policies = Array.isArray(rawPolicies) ? rawPolicies : [];
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [previewPolicy, setPreviewPolicy] = useState(null);
  const [loanAmount, setLoanAmount] = useState("");
  const [calculation, setCalculation] = useState(null);
  const [capacity, setCapacity] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleSelect = (policy) => {
    setSelectedPolicy(policy);
    setLoanAmount("");
    setCalculation(null);
    setCapacity(null);
    setFeedback("");
  };

  useEffect(() => {
    if (!selectedPolicy) return undefined;

    let cancelled = false;

    getAvailableCapacity(selectedPolicy.policyId)
      .then((result) => {
        if (!cancelled) {
          setCapacity(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCapacity(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedPolicy]);

  useEffect(() => {
    if (!selectedPolicy || Number(loanAmount) <= 0) {
      setCalculation(null);
      return undefined;
    }

    let cancelled = false;
    setIsCalculating(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const result = await calculateCollateral(selectedPolicy.policyId, Number(loanAmount));
        if (!cancelled) {
          setCalculation(result);
        }
      } catch (err) {
        if (!cancelled) {
          setCalculation(null);
          setFeedback(err.response?.data?.message || "Unable to calculate collateral");
        }
      } finally {
        if (!cancelled) {
          setIsCalculating(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [loanAmount, selectedPolicy]);

  const handleCreateCession = async (e) => {
    e.preventDefault();

    if (!selectedPolicy) return;

    try {
      const response = await createTokenizedCession({
        policyId: selectedPolicy.policyId,
        lenderId: user?.id,
        cessionary: user?.name || user?.email || "Lender",
        loanAmount: Number(loanAmount)
      });

      setFeedback(response.message || `Tokenized cession created for ${selectedPolicy.policyId}.`);
      setSelectedPolicy(null);
      setLoanAmount("");
      setCalculation(null);
      setCapacity(null);
      refetch();
    } catch (err) {
      setFeedback(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Unable to create tokenized cession"
      );
    }
  };

  if (loading) return <p style={styles.loading}>Loading policies...</p>;

  return (
    <DashboardLayout title="Available Policies">
      <section style={styles.hero}>
        <h3 style={styles.heroTitle}>Review collateral available for lender funding.</h3>
        <p style={styles.heroCopy}>
          Policies below still have programmable collateral. Select one to model the
          80/20 split, confirm savings, and mint a tokenized cession against the policy.
        </p>
      </section>

      {error && (
        <div style={styles.errorBox}>
          <p style={styles.errorText}>Available policies: {error}</p>
        </div>
      )}

      {selectedPolicy && (
        <form style={styles.fundingCard} onSubmit={handleCreateCession}>
          <div>
            <h3 style={styles.fundingTitle}>Create tokenized cession for {selectedPolicy.policyId}</h3>
            <p style={styles.fundingCopy}>
              Available collateral: {formatNAD(selectedPolicy.availableValue)}
            </p>
          </div>

          <div style={styles.inputGrid}>
            <label style={styles.inputGroup}>
              <span style={styles.label}>Loan Amount</span>
              <input
                type="number"
                min="1"
                value={loanAmount}
                onChange={(e) => {
                  setLoanAmount(e.target.value);
                  setFeedback("");
                }}
                style={styles.input}
                placeholder="60000"
              />
            </label>

            <div style={styles.capacityCard}>
              <span style={styles.label}>Estimated Capacity</span>
              <strong style={styles.capacityValue}>
                {formatNAD(Number(capacity?.potentialLoanAmount || 0))}
              </strong>
              <span style={styles.capacityHint}>
                Max loan supported by current programmable collateral
              </span>
            </div>
          </div>

          <div style={styles.logicPanel}>
            <div style={styles.logicHeader}>
              <div>
                <p style={styles.logicEyebrow}>80/20 Smart Cession Logic</p>
                <h4 style={styles.logicTitle}>Programmable credit-life split</h4>
              </div>
              {isCalculating && <span style={styles.logicBadge}>Calculating...</span>}
            </div>

            {calculation ? (
              calculation.eligible ? (
                <div style={styles.logicGrid}>
                  <Metric label="Credit Life Required" value={calculation.creditLifeRequired} />
                  <Metric label="80% Existing Life Cover" value={calculation.lifeCoverPortion} accent="#0f766e" />
                  <Metric label="20% Retrenchment Top-Up" value={calculation.retrenchmentPortion} accent="#d97706" />
                  <Metric label="Borrower Savings" value={calculation.savings} accent="#2563eb" />
                </div>
              ) : (
                <p style={styles.logicError}>{calculation.message}</p>
              )
            ) : (
              <p style={styles.logicCopy}>
                Enter a loan amount to calculate the credit-life requirement, the policy-backed
                80% portion, and the 20% micro-premium gap.
              </p>
            )}
          </div>

          <div style={styles.actionRow}>
            <button
              type="submit"
              style={styles.primaryBtn}
              disabled={!calculation?.eligible}
            >
              Mint Tokenized Cession
            </button>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => setSelectedPolicy(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => navigate(`/policy/${selectedPolicy.policyId}`)}
            >
              Open Details
            </button>
          </div>

          {feedback && <p style={styles.feedback}>{feedback}</p>}
        </form>
      )}

      <div style={styles.grid}>
        {policies.map((p) => (
          <PolicyCard
            key={p.policyId}
            policy={p}
            onClick={setPreviewPolicy}
            actionLabel="Select for Funding"
          />
        ))}
      </div>

      <div style={styles.tableWrap}>
        <PolicyTable
          policies={policies}
          onSelect={handleSelect}
          actionLabel="Select"
          title="Funding Pipeline"
        />
      </div>

      <PolicyModal
        open={Boolean(previewPolicy)}
        policy={previewPolicy}
        onClose={() => setPreviewPolicy(null)}
        primaryLabel="Select for Funding"
        onPrimaryAction={() => {
          if (!previewPolicy) return;
          handleSelect(previewPolicy);
          setPreviewPolicy(null);
        }}
      />
    </DashboardLayout>
  );
}

function Metric({ label, value, accent = "#0f172a" }) {
  return (
    <div style={styles.metric}>
      <span style={styles.metricLabel}>{label}</span>
      <strong style={{ ...styles.metricValue, color: accent }}>
        {formatNAD(Number(value || 0))}
      </strong>
    </div>
  );
}

const styles = {
  hero: {
    gridColumn: "1 / -1",
    background: "linear-gradient(150deg, rgba(37, 99, 235, 0.24), rgba(15, 23, 42, 0.96))",
    borderRadius: "20px",
    padding: "24px",
    color: "#e5eef7"
  },
  heroTitle: {
    marginTop: 0,
    marginBottom: "10px"
  },
  heroCopy: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.6
  },
  fundingCard: {
    gridColumn: "1 / -1",
    background: "#fff",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 22px 48px rgba(15, 23, 42, 0.18)",
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  fundingTitle: {
    margin: 0,
    color: "#0f172a"
  },
  fundingCopy: {
    color: "#475569",
    marginBottom: 0
  },
  inputGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    alignItems: "stretch"
  },
  inputGroup: {
    display: "grid",
    gap: "8px"
  },
  label: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#64748b",
    fontWeight: "700"
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "14px"
  },
  capacityCard: {
    borderRadius: "16px",
    background: "linear-gradient(135deg, #eff6ff, #ecfeff)",
    border: "1px solid #c7d2fe",
    padding: "16px",
    display: "grid",
    gap: "6px"
  },
  capacityValue: {
    color: "#0f172a",
    fontSize: "24px"
  },
  capacityHint: {
    color: "#475569",
    fontSize: "13px",
    lineHeight: 1.5
  },
  logicPanel: {
    borderRadius: "18px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    padding: "18px",
    display: "grid",
    gap: "16px"
  },
  logicHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start"
  },
  logicEyebrow: {
    margin: 0,
    color: "#0f766e",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontWeight: "700"
  },
  logicTitle: {
    margin: "6px 0 0",
    color: "#0f172a"
  },
  logicBadge: {
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: "700"
  },
  logicCopy: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.6
  },
  logicError: {
    margin: 0,
    color: "#b91c1c",
    fontWeight: "600"
  },
  logicGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px"
  },
  metric: {
    borderRadius: "14px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    padding: "14px",
    display: "grid",
    gap: "6px"
  },
  metricLabel: {
    color: "#64748b",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.06em"
  },
  metricValue: {
    fontSize: "22px"
  },
  actionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px"
  },
  primaryBtn: {
    padding: "10px 16px",
    borderRadius: "999px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer"
  },
  secondaryBtn: {
    padding: "10px 16px",
    borderRadius: "999px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    cursor: "pointer"
  },
  feedback: {
    margin: 0,
    color: "#0284c7"
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
