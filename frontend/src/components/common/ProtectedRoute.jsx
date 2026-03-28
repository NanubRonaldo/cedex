import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { getWorkspaceRole } from "../../utils/roles";

export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  const workspaceRole = getWorkspaceRole(user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && workspaceRole !== role) {
    return (
      <Navigate
        to={workspaceRole === "lender" ? "/lender/dashboard" : "/policyholder/dashboard"}
        replace
      />
    );
  }

  return children;
}
