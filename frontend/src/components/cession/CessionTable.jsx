import { formatNAD } from "../../utils/currency";

export default function CessionTable({
  cessions,
  onSelect,
  actionLabel = "Inspect",
  title = "Cessions",
  isActionDisabled
}) {
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>{title}</h3>

      {!cessions.length ? (
        <p style={styles.empty}>No cessions have been recorded for this policy yet.</p>
      ) : (
        <>
          <table className="data-table data-table--desktop" style={styles.table}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Cession ID</th>
                <th>Policy</th>
                <th>Counterparties</th>
                <th>Loan / Secured</th>
                <th>80 / 20 Split</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {cessions.map((c) => {
                const disabled = isActionDisabled ? isActionDisabled(c) : false;

                return (
                  <tr key={c.cessionId} style={styles.row}>
                    <td style={styles.rankCell}>#{c.priorityRank}</td>
                    <td>{c.cessionId}</td>
                    <td>{c.policyId}</td>
                    <td>
                      <div style={styles.stackCell}>
                        <strong>{c.cessionary}</strong>
                        <span>{c.cedent}</span>
                      </div>
                    </td>
                    <td>
                      <div style={styles.stackCell}>
                        <strong>{formatNAD(Number(c.loanAmount || 0))}</strong>
                        <span>secured {formatNAD(Number(c.amount || 0))}</span>
                      </div>
                    </td>
                    <td>
                      <div style={styles.stackCell}>
                        <strong>{formatNAD(Number(c.lifeCoverPortion || 0))}</strong>
                        <span>top-up {formatNAD(Number(c.retrenchmentPortion || 0))}</span>
                      </div>
                    </td>
                    <td>{c.startDate}</td>
                    <td>{c.endDate || "Open"}</td>
                    <td>
                      <span style={getStatusStyle(c.status)}>{c.status}</span>
                    </td>
                    <td>
                      <button
                        style={{
                          ...styles.actionBtn,
                          ...(disabled ? styles.actionBtnDisabled : {})
                        }}
                        disabled={disabled}
                        onClick={() => !disabled && onSelect && onSelect(c)}
                      >
                        {disabled ? "Completed" : actionLabel}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="data-table-mobile" style={styles.mobileList}>
            {cessions.map((c) => {
              const disabled = isActionDisabled ? isActionDisabled(c) : false;

              return (
                <article key={`${c.cessionId}-mobile`} style={styles.mobileCard}>
                  <div style={styles.mobileHeader}>
                    <div>
                      <strong>{c.cessionId}</strong>
                      <p style={styles.mobileMuted}>Policy {c.policyId}</p>
                    </div>
                    <span style={getStatusStyle(c.status)}>{c.status}</span>
                  </div>

                  <div style={styles.mobileMeta}>
                    <span>Rank #{c.priorityRank}</span>
                    <span>Loan {formatNAD(Number(c.loanAmount || 0))}</span>
                  </div>

                  <div style={styles.mobileValues}>
                    <span>Cedent: {c.cedent}</span>
                    <span>Cessionary: {c.cessionary}</span>
                    <span>Secured: {formatNAD(Number(c.amount || 0))}</span>
                    <span>80% Policy: {formatNAD(Number(c.lifeCoverPortion || 0))}</span>
                    <span>20% Top-Up: {formatNAD(Number(c.retrenchmentPortion || 0))}</span>
                    <span>Start: {c.startDate}</span>
                    <span>End: {c.endDate || "Open"}</span>
                  </div>

                  <button
                    style={{
                      ...styles.actionBtn,
                      ...(disabled ? styles.actionBtnDisabled : {}),
                      width: "100%",
                      marginTop: "14px"
                    }}
                    disabled={disabled}
                    onClick={() => !disabled && onSelect && onSelect(c)}
                  >
                    {disabled ? "Completed" : actionLabel}
                  </button>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function getStatusStyle(status) {
  const base = {
    padding: "4px 8px",
    borderRadius: "999px",
    fontSize: "12px",
    color: "#fff",
    textTransform: "capitalize"
  };

  if (status === "active") return { ...base, background: "#16a34a" };
  if (status === "released") return { ...base, background: "#64748b" };
  if (status === "defaulted") return { ...base, background: "#dc2626" };

  return { ...base, background: "#0ea5e9" };
}

const styles = {
  container: {
    padding: "20px",
    background: "#fff",
    borderRadius: "18px",
    boxShadow: "0 22px 48px rgba(15, 23, 42, 0.18)",
    overflowX: "auto"
  },
  title: {
    marginBottom: "10px",
    color: "#0f172a"
  },
  empty: {
    color: "#64748b"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
    color: "#0f172a"
  },
  row: {
    borderBottom: "1px solid #e2e8f0"
  },
  mobileList: {
    display: "none"
  },
  mobileCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "16px",
    background: "#f8fafc",
    marginTop: "14px"
  },
  mobileHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start"
  },
  mobileMuted: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "12px"
  },
  mobileMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px 14px",
    marginTop: "10px",
    fontSize: "13px",
    color: "#334155"
  },
  mobileValues: {
    display: "grid",
    gap: "6px",
    marginTop: "12px",
    fontSize: "13px",
    color: "#0f172a"
  },
  rankCell: {
    fontWeight: "bold",
    color: "#0284c7"
  },
  stackCell: {
    display: "grid",
    gap: "4px",
    fontSize: "12px"
  },
  actionBtn: {
    padding: "8px 14px",
    borderRadius: "999px",
    border: "none",
    background: "#0f172a",
    color: "#fff",
    cursor: "pointer"
  },
  actionBtnDisabled: {
    background: "#cbd5e1",
    color: "#475569",
    cursor: "not-allowed"
  }
};
