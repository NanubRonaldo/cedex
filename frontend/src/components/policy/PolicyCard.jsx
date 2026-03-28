import CededValueBar from "./cededValueBar";
import { formatNAD } from "../../utils/currency";

export default function PolicyCard({ policy, onClick, actionLabel = "Open Policy" }) {
  const cededValue = policy.cededValue ?? (policy.totalValue - policy.availableValue);
  const pledgedRatio = policy.totalValue > 0 ? Math.round((cededValue / policy.totalValue) * 100) : 0;
  const activeCessions = policy.activeCessions?.length ?? 0;
  const coverImage = policy.image || "https://via.placeholder.com/400x240.png?text=Cedex+Policy";

  return (
    <button type="button" style={styles.card} onClick={() => onClick && onClick(policy)}>
      <div
        style={{
          ...styles.photo,
          backgroundImage: `linear-gradient(160deg, rgba(15, 23, 42, 0.16), rgba(15, 23, 42, 0.56)), url(${coverImage})`,
          backgroundColor: getPolicyAccent(policy)
        }}
      >
        <div style={styles.photoTop}>
          <div style={styles.photoBadge}>{policy.productType}</div>
        </div>
        <div style={styles.photoBottom}>
          <strong style={styles.photoValue}>{formatNAD(policy.availableValue)}</strong>
          <span style={styles.photoCopy}>available collateral</span>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.insurer}>{policy.insurer}</div>
        <div style={styles.holder}>{policy.holderName}</div>

        <div style={styles.meta}>
          <p><strong>Policy ID:</strong> {policy.policyId}</p>
          <p><strong>Type:</strong> {policy.productType}</p>
        </div>

        <div style={styles.values}>
          <p><strong>Total:</strong> {formatNAD(policy.totalValue)}</p>
          <p><strong>Available:</strong> {formatNAD(policy.availableValue)}</p>
          <p><strong>Ceded:</strong> {formatNAD(cededValue || 0)}</p>
          <p><strong>Pledged:</strong> {pledgedRatio}%</p>
          <p><strong>Active Tokens:</strong> {activeCessions}</p>
        </div>

        <CededValueBar
          totalValue={policy.totalValue}
          cededValue={cededValue}
        />

        <div style={styles.footer}>
          <span style={styles.status}>{policy.status}</span>
          <span style={styles.action}>{actionLabel}</span>
        </div>
      </div>
    </button>
  );
}

function getPolicyAccent(policy) {
  const themes = {
    "Life Cover": "linear-gradient(135deg, #0f766e, #164e63)",
    "Education Plan": "linear-gradient(135deg, #1d4ed8, #312e81)",
    "General Cover": "linear-gradient(135deg, #1f2937, #0f766e)",
    "Test Cover": "linear-gradient(135deg, #7c3aed, #1d4ed8)"
  };

  return themes[policy.productType] || "linear-gradient(135deg, #0f172a, #2563eb)";
}

const styles = {
  card: {
    width: "100%",
    minHeight: "360px",
    borderRadius: "16px",
    cursor: "pointer",
    boxShadow: "10px 10px 22px rgba(15, 23, 42, 0.16), -8px -8px 18px rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    padding: 0,
    textAlign: "left"
  },
  photo: {
    width: "100%",
    minHeight: "160px",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "6px",
    color: "#eff6ff",
    backgroundPosition: "center",
    backgroundSize: "cover"
  },
  photoTop: {
    display: "flex",
    justifyContent: "flex-start"
  },
  photoBottom: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  photoBadge: {
    alignSelf: "flex-start",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.16)",
    border: "1px solid rgba(255,255,255,0.24)",
    fontSize: "11px",
    letterSpacing: "0.06em",
    textTransform: "uppercase"
  },
  photoValue: {
    fontSize: "24px"
  },
  photoCopy: {
    fontSize: "12px",
    color: "rgba(239, 246, 255, 0.82)"
  },
  content: {
    padding: "14px 14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    color: "#0f172a"
  },
  insurer: {
    fontSize: "12px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.08em"
  },
  holder: {
    fontSize: "18px",
    fontWeight: "bold"
  },
  meta: {
    fontSize: "12px",
    color: "#334155",
    display: "grid",
    gap: "2px"
  },
  values: {
    fontSize: "13px",
    color: "#0f172a",
    display: "grid",
    gap: "2px"
  },
  footer: {
    marginTop: "auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px"
  },
  status: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#0369a1",
    textTransform: "capitalize"
  },
  action: {
    fontSize: "12px",
    color: "#2563eb",
    fontWeight: "600"
  }
};
