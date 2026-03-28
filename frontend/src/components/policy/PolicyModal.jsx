import { useEffect, useState } from "react";
import { getPolicyholderPrivateData } from "../../api/policyApi";
import { formatNAD } from "../../utils/currency";
import ProgressBar from "../common/ProgressBar";

export default function PolicyModal({
  policy,
  open,
  onClose,
  onPrimaryAction,
  primaryLabel = "Use Policy"
}) {
  const isCompact = typeof window !== "undefined" && window.innerWidth < 900;
  const [narrative, setNarrative] = useState("");
  const [narrativeState, setNarrativeState] = useState("idle");
  const isVisible = Boolean(open && policy);

  const total = Number(policy?.totalValue || 0);
  const available = Number(policy?.availableValue || 0);
  const ceded = Number(policy?.cededValue ?? total - available);
  const utilization = total > 0 ? Math.round((ceded / total) * 100) : 0;
  const death = Number(policy?.deathCover || 0);
  const retrenchment = Number(policy?.retrenchmentCover || 0);
  const image = policy?.image || "https://via.placeholder.com/900x520.png?text=Cedex+Policy";

  useEffect(() => {
    if (!isVisible) {
      setNarrative("");
      setNarrativeState("idle");
      return;
    }

    let active = true;

    const loadNarrative = async () => {
      setNarrativeState("loading");
      try {
        const profile = await getPolicyholderPrivateData(policy.policyId);
        if (!active) return;
        const text = buildNarrative(policy.holderName, profile);
        setNarrative(text);
        setNarrativeState("ready");
      } catch (err) {
        if (!active) return;
        setNarrativeState("fallback");
        setNarrative("");
      }
    };

    loadNarrative();
    return () => {
      active = false;
    };
  }, [isVisible, policy?.policyId, policy?.holderName]);

  if (!isVisible) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.content} onClick={(e) => e.stopPropagation()}>
        <button type="button" style={styles.closeBtn} onClick={onClose}>
          &times;
        </button>

        <div style={{ ...styles.grid, gridTemplateColumns: isCompact ? "1fr" : "1fr 1fr" }}>
          <div
            style={{
              ...styles.photo,
              minHeight: isCompact ? "220px" : styles.photo.minHeight,
              backgroundImage: `linear-gradient(155deg, rgba(15,23,42,0.18), rgba(15,23,42,0.58)), url(${image})`
            }}
          />

          <div style={styles.body}>
            <h2 style={styles.title}>{policy.holderName}</h2>
            <p style={styles.subtitle}>{policy.insurer} - {policy.productType}</p>

            <h4 style={styles.section}>Description</h4>
            <p style={styles.paragraph}>
              {narrativeState === "loading"
                ? "Loading person narrative from private profile..."
                : narrativeState === "ready"
                  ? narrative
                  : "Private-data narrative is restricted for this role. Showing collateral metadata only."}
            </p>

            <h4 style={styles.section}>Attributes</h4>
            <AttributeRow label="Policy ID" value={policy.policyId} />
            <AttributeRow label="Status" value={policy.status} />
            <AttributeRow label="Total Value" value={formatNAD(total)} />
            <AttributeRow label="Available Collateral" value={formatNAD(available)} />
            <AttributeRow label="Ceded Value" value={formatNAD(ceded)} />
            <AttributeRow label="Death Cover" value={formatNAD(death)} />
            <AttributeRow label="Retrenchment Cover" value={formatNAD(retrenchment)} />

            <h4 style={styles.section}>Progress</h4>
            <Progress label="Collateral Utilization" percent={utilization} />
            <Progress label="Death Cover Ratio" percent={total > 0 ? Math.round((death / total) * 100) : 0} />
            <Progress
              label="Retrenchment Cover Ratio"
              percent={total > 0 ? Math.round((retrenchment / total) * 100) : 0}
            />

            {onPrimaryAction && (
              <button type="button" style={styles.primaryBtn} onClick={onPrimaryAction}>
                {primaryLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildNarrative(holderName, profile) {
  const who = holderName || "This policyholder";
  const segments = [];

  if (profile.employmentStatus || profile.employerName) {
    const employment = [
      profile.employmentStatus ? profile.employmentStatus.toLowerCase() : "",
      profile.employerName ? `at ${profile.employerName}` : ""
    ]
      .filter(Boolean)
      .join(" ");
    segments.push(`${who} is currently ${employment}.`);
  }

  if (Number(profile.yearsEmployed || 0) > 0) {
    segments.push(`Employment tenure is approximately ${profile.yearsEmployed} years.`);
  }

  if (Number(profile.monthlyIncome || 0) > 0) {
    segments.push(`Reported monthly income is ${formatNAD(profile.monthlyIncome)}.`);
  } else if (profile.incomeLevel) {
    segments.push(`Income band is classified as ${profile.incomeLevel.toLowerCase()}.`);
  }

  if (Number(profile.creditScore || 0) > 0) {
    segments.push(`Credit score on file is ${profile.creditScore}.`);
  }

  if (Number(profile.dependents || 0) > 0 || profile.maritalStatus) {
    const family = [
      Number(profile.dependents || 0) > 0 ? `${profile.dependents} dependents` : "",
      profile.maritalStatus ? profile.maritalStatus.toLowerCase() : ""
    ]
      .filter(Boolean)
      .join(", ");
    segments.push(`Household profile notes ${family}.`);
  }

  if (segments.length === 0) {
    return `${who} has a private profile on record linked to this policy, ready for consent and insurer approval checks.`;
  }

  return segments.join(" ");
}

function AttributeRow({ label, value }) {
  return (
    <div style={styles.attrRow}>
      <span style={styles.attrLabel}>{label}</span>
      <span style={styles.attrValue}>{value}</span>
    </div>
  );
}

function Progress({ label, percent }) {
  const safe = Math.max(0, Math.min(100, Number(percent || 0)));
  return (
    <div style={styles.progressWrap}>
      <div style={styles.progressHeader}>
        <span style={styles.attrLabel}>{label}</span>
        <span style={styles.attrValue}>{safe}%</span>
      </div>
      <ProgressBar percent={safe} />
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px",
    background: "rgba(2, 6, 23, 0.55)"
  },
  content: {
    position: "relative",
    width: "min(940px, 100%)",
    maxHeight: "92vh",
    overflowY: "auto",
    borderRadius: "20px",
    background: "#ffffff",
    padding: "20px"
  },
  closeBtn: {
    position: "absolute",
    right: "14px",
    top: "8px",
    border: "none",
    background: "transparent",
    fontSize: "28px",
    cursor: "pointer",
    color: "#334155"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "26px"
  },
  photo: {
    minHeight: "380px",
    borderRadius: "16px",
    backgroundPosition: "center",
    backgroundSize: "cover"
  },
  body: {
    display: "grid",
    gap: "8px",
    alignContent: "start"
  },
  title: {
    margin: 0,
    color: "#0f172a"
  },
  subtitle: {
    margin: "0 0 8px 0",
    color: "#475569"
  },
  section: {
    margin: "8px 0 2px 0",
    color: "#0f172a"
  },
  paragraph: {
    margin: 0,
    color: "#475569",
    lineHeight: 1.5
  },
  attrRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px"
  },
  attrLabel: {
    color: "#64748b",
    fontSize: "13px"
  },
  attrValue: {
    color: "#0f172a",
    fontSize: "13px",
    fontWeight: "600"
  },
  progressWrap: {
    display: "grid",
    gap: "5px",
    marginBottom: "6px"
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px"
  },
  primaryBtn: {
    marginTop: "10px",
    padding: "10px 16px",
    borderRadius: "999px",
    border: "none",
    background: "#1d4ed8",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700"
  }
};
