import { useState } from "react";
import { formatNAD } from "../../utils/currency";

export default function CessionWorkflowPanel({
  title,
  subtitle,
  items,
  actionLabel,
  onAction,
  onRefresh,
  legendItems
}) {
  const [busyId, setBusyId] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleAction = async (cessionId) => {
    setBusyId(cessionId);
    setFeedback("");
    try {
      await onAction(cessionId);
      setFeedback(`Updated ${cessionId} successfully.`);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      setFeedback(err.response?.data?.message || "Unable to update cession status");
    } finally {
      setBusyId("");
    }
  };

  return (
    <section style={styles.panel}>
      <h3 style={styles.title}>{title}</h3>
      {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
      <div style={styles.legendRow}>
        {(legendItems || ["requested", "consented", "insurer_approved", "active"]).map((status) => (
          <span
            key={status}
            style={{
              ...styles.legendBadge,
              ...(styles.statusStyles[status] || styles.statusStyles.requested)
            }}
          >
            {status}
          </span>
        ))}
      </div>

      {!items.length ? (
        <p style={styles.empty}>No cessions pending this step.</p>
      ) : (
        <div style={styles.list}>
          {items.map((cession) => (
            <article key={cession.cessionId} style={styles.item}>
              <div style={styles.itemMeta}>
                <strong>{cession.cessionId}</strong>
                <span>Policy {cession.policyId}</span>
                <span>{formatNAD(cession.amount)}</span>
                <span style={styles.status}>{cession.status}</span>
              </div>
              <button
                type="button"
                style={styles.actionBtn}
                disabled={busyId === cession.cessionId}
                onClick={() => handleAction(cession.cessionId)}
              >
                {busyId === cession.cessionId ? "Working..." : actionLabel}
              </button>
            </article>
          ))}
        </div>
      )}

      {feedback && <p style={styles.feedback}>{feedback}</p>}
    </section>
  );
}

const styles = {
  panel: {
    gridColumn: "1 / -1",
    background: "#0b1220",
    borderRadius: "16px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    padding: "18px"
  },
  title: {
    margin: 0,
    color: "#e2e8f0"
  },
  subtitle: {
    marginTop: "8px",
    marginBottom: "10px",
    color: "#94a3b8",
    fontSize: "13px"
  },
  legendRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "14px"
  },
  legendBadge: {
    borderRadius: "999px",
    padding: "4px 9px",
    fontSize: "11px",
    textTransform: "lowercase",
    border: "1px solid transparent"
  },
  statusStyles: {
    requested: {
      background: "rgba(251, 191, 36, 0.16)",
      color: "#fde68a",
      borderColor: "rgba(251, 191, 36, 0.35)"
    },
    consented: {
      background: "rgba(56, 189, 248, 0.16)",
      color: "#bae6fd",
      borderColor: "rgba(56, 189, 248, 0.35)"
    },
    insurer_approved: {
      background: "rgba(167, 139, 250, 0.16)",
      color: "#ddd6fe",
      borderColor: "rgba(167, 139, 250, 0.35)"
    },
    active: {
      background: "rgba(34, 197, 94, 0.16)",
      color: "#bbf7d0",
      borderColor: "rgba(34, 197, 94, 0.35)"
    },
    release_requested: {
      background: "rgba(251, 146, 60, 0.16)",
      color: "#fed7aa",
      borderColor: "rgba(251, 146, 60, 0.35)"
    },
    lender_release_approved: {
      background: "rgba(59, 130, 246, 0.16)",
      color: "#bfdbfe",
      borderColor: "rgba(59, 130, 246, 0.35)"
    },
    released: {
      background: "rgba(16, 185, 129, 0.16)",
      color: "#a7f3d0",
      borderColor: "rgba(16, 185, 129, 0.35)"
    }
  },
  empty: {
    margin: 0,
    color: "#94a3b8"
  },
  list: {
    display: "grid",
    gap: "10px"
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid rgba(148, 163, 184, 0.22)",
    background: "rgba(15, 23, 42, 0.6)"
  },
  itemMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    color: "#cbd5e1",
    fontSize: "13px"
  },
  status: {
    textTransform: "capitalize",
    color: "#93c5fd"
  },
  actionBtn: {
    padding: "8px 12px",
    borderRadius: "999px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer"
  },
  feedback: {
    marginTop: "12px",
    marginBottom: 0,
    color: "#a7f3d0",
    fontSize: "13px"
  }
};
