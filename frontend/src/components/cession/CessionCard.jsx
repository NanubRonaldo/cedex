import { formatNAD } from "../../utils/currency";

export default function CessionCard({ cession, onClick }) {
  const stageIndex = getStageIndex(cession.status);

  return (
    <div style={styles.card} onClick={() => onClick && onClick(cession)}>
      <div style={styles.header}>
        <span style={styles.rank}>#{cession.priorityRank}</span>
        <span style={getStatusStyle(cession.status)}>
          {cession.status}
        </span>
      </div>

      <div style={styles.body}>
        <h4 style={styles.amount}>{formatNAD(cession.amount)}</h4>

        <p><strong>Policy:</strong> {cession.policyId}</p>
        <p><strong>Cedent:</strong> {cession.cedent}</p>
        <p><strong>Cessionary:</strong> {cession.cessionary}</p>

        <p style={styles.date}>
          {cession.startDate} -> {cession.endDate || "Open"}
        </p>
      </div>

      <div style={styles.progressWrap}>
        <div style={styles.progressTrack}>
          {CESSION_STAGES.map((stage, index) => (
            <span
              key={stage}
              style={{
                ...styles.progressStep,
                ...(index <= stageIndex ? styles.progressStepActive : styles.progressStepIdle)
              }}
              title={stage}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const CESSION_STAGES = [
  "requested",
  "consented",
  "insurer_approved",
  "active",
  "release_requested",
  "lender_release_approved",
  "released"
];

function getStageIndex(status) {
  const idx = CESSION_STAGES.indexOf(String(status || "").toLowerCase());
  return idx >= 0 ? idx : -1;
}

function getStatusStyle(status) {
  const base = {
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    color: "#fff"
  };

  if (status === "active") return { ...base, background: "green" };
  if (status === "released") return { ...base, background: "gray" };
  if (status === "defaulted") return { ...base, background: "red" };

  return base;
}

const styles = {
  card: {
    width: "240px",
    borderRadius: "14px",
    padding: "14px",
    background: "#fff",
    boxShadow: "10px 10px 22px rgba(15, 23, 42, 0.16), -8px -8px 18px rgba(255,255,255,0.1)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  rank: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#0077ff"
  },
  body: {
    fontSize: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  amount: {
    margin: "0",
    fontSize: "17px",
    color: "#111"
  },
  date: {
    marginTop: "6px",
    fontSize: "11px",
    color: "gray"
  },
  progressWrap: {
    marginTop: "2px"
  },
  progressTrack: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "4px"
  },
  progressStep: {
    height: "5px",
    borderRadius: "999px"
  },
  progressStepActive: {
    background: "linear-gradient(90deg, #22c55e, #16a34a)"
  },
  progressStepIdle: {
    background: "#dbe2ea"
  }
};
