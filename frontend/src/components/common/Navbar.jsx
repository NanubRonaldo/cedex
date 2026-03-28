import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="navbar">
      <div className="navbar-left">
        <p className="navbar-eyebrow">Cedex</p>
        <h3>Cession workspace</h3>
      </div>

      <div className="navbar-right">
        {user && (
          <>
            <div className="navbar-user">
              <strong>{user.name}</strong>
              <span style={styles.role}>{user.role}</span>
            </div>
            <button onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  role: {
    textTransform: "capitalize",
    opacity: 0.8,
    fontSize: "12px"
  }
};
