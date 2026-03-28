import CededValueBar from "./cededValueBar";
import { formatNAD } from "../../utils/currency";

export default function PolicyTable({
  policies,
  onSelect,
  actionLabel = "View",
  title = "Policies"
}) {
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>{title}</h3>

      {!policies.length ? (
        <p style={styles.empty}>No policies available yet.</p>
      ) : (
        <>
          <table className="data-table data-table--desktop" style={styles.table}>
            <thead>
              <tr>
                <th>Policy ID</th>
                <th>Holder</th>
                <th>Insurer</th>
                <th>Type</th>
                <th>Total</th>
                <th>Available</th>
                <th>Ceded</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {policies.map((p) => {
                const cededValue = p.totalValue - p.availableValue;

                return (
                  <tr key={p.policyId} style={styles.row}>
                    <td>{p.policyId}</td>
                    <td>{p.holderName}</td>
                    <td>{p.insurer}</td>
                    <td>{p.productType}</td>
                    <td>{formatNAD(p.totalValue)}</td>
                    <td>{formatNAD(p.availableValue)}</td>
                    <td>{formatNAD(cededValue)}</td>
                    <td style={{ minWidth: "180px" }}>
                      <CededValueBar
                        totalValue={p.totalValue}
                        cededValue={cededValue}
                      />
                    </td>
                    <td>
                      <span style={getStatusStyle(p.status)}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <button
                        style={styles.actionBtn}
                        onClick={() => onSelect && onSelect(p)}
                      >
                        {actionLabel}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="data-table-mobile" style={styles.mobileList}>
            {policies.map((p) => {
              const cededValue = p.totalValue - p.availableValue;

              return (
                <article key={`${p.policyId}-mobile`} style={styles.mobileCard}>
                  <div style={styles.mobileHeader}>
                    <div>
                      <strong>{p.policyId}</strong>
                      <p style={styles.mobileMuted}>{p.insurer}</p>
                    </div>
                    <span style={getStatusStyle(p.status)}>{p.status}</span>
                  </div>

                  <div style={styles.mobileMeta}>
                    <span>{p.holderName}</span>
                    <span>{p.productType}</span>
                  </div>

                  <div style={styles.mobileValues}>
                    <span>Total: {formatNAD(p.totalValue)}</span>
                    <span>Available: {formatNAD(p.availableValue)}</span>
                    <span>Ceded: {formatNAD(cededValue)}</span>
                  </div>

                  <CededValueBar totalValue={p.totalValue} cededValue={cededValue} />

                  <button
                    style={{ ...styles.actionBtn, width: "100%", marginTop: "14px" }}
                    onClick={() => onSelect && onSelect(p)}
                  >
                    {actionLabel}
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
  if (status === "lapsed") return { ...base, background: "#dc2626" };
  if (status === "matured") return { ...base, background: "#64748b" };

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
  actionBtn: {
    padding: "8px 14px",
    borderRadius: "999px",
    border: "none",
    background: "#0f172a",
    color: "#fff",
    cursor: "pointer"
  }
};
