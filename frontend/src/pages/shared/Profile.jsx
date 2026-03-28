import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import useAuth from "../../hooks/useAuth";
import { getPersonaLabel, getWorkspaceRole } from "../../utils/roles";

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const workspaceRole = getWorkspaceRole(user);
  const personaLabel = getPersonaLabel(user);
  const isPolicyholder = workspaceRole === "policyholder";
  const isLender = workspaceRole === "lender";

  if (!user) {
    return <p style={styles.loading}>Loading profile...</p>;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <DashboardLayout title="My Profile">
      <div style={styles.card}>
        <h3 style={styles.name}>{user.name}</h3>
        <p style={styles.role}>{personaLabel.toUpperCase()}</p>

        <div style={styles.info}>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>User ID:</strong> {user.id}</p>
        </div>

        <div style={styles.divider} />

        {isPolicyholder && (
          <div style={styles.roleBox}>
            <h4>Policyholder Access</h4>
            <p>Manage policies</p>
            <p>Create collateral-ready records</p>
            <p>Track cessions and released value</p>
          </div>
        )}

        {isLender && (
          <div style={styles.roleBox}>
            <h4>Lender Access</h4>
            <p>Review available collateral</p>
            <p>Create funding cessions</p>
            <p>Track exposure and repayment releases</p>
          </div>
        )}

        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </DashboardLayout>
  );
}

const styles = {
  card: {
    background: "#111827",
    borderRadius: "18px",
    padding: "28px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
    maxWidth: "540px",
    color: "#e5eef7"
  },
  name: {
    margin: 0,
    fontSize: "24px"
  },
  role: {
    margin: "6px 0 16px",
    fontSize: "12px",
    color: "#7dd3fc",
    fontWeight: "bold",
    letterSpacing: "0.08em"
  },
  info: {
    fontSize: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    color: "#cbd5e1"
  },
  divider: {
    height: "1px",
    background: "#1f2937",
    margin: "18px 0"
  },
  roleBox: {
    background: "#020617",
    padding: "14px",
    borderRadius: "12px",
    fontSize: "13px",
    marginBottom: "12px",
    color: "#dbeafe"
  },
  logoutBtn: {
    marginTop: "10px",
    width: "100%",
    padding: "12px",
    borderRadius: "999px",
    border: "none",
    background: "#ef4444",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold"
  },
  loading: {
    color: "#fff",
    textAlign: "center",
    marginTop: "50px"
  }
};
