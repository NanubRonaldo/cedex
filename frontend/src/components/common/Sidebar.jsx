import useAuth from "../../hooks/useAuth";
import { NavLink } from "react-router-dom";
import { getWorkspaceRole } from "../../utils/roles";

export default function Sidebar() {
  const { user } = useAuth();
  const workspaceRole = getWorkspaceRole(user);

  if (!user) return null;

  const policyholderLinks = [
    { name: "Dashboard", path: "/policyholder/dashboard" },
    { name: "Create Policy", path: "/policyholder/create-policy" },
    { name: "My Policies", path: "/policyholder/policies" }
  ];

  const lenderLinks = [
    { name: "Dashboard", path: "/lender/dashboard" },
    { name: "Available Policies", path: "/lender/policies" }
  ];

  const links = workspaceRole === "policyholder" ? policyholderLinks : lenderLinks;

  return (
    <div className="sidebar">
      <div className="sidebar__intro">
        <h4>Workspace</h4>
        <p className="sidebar__caption">
          {workspaceRole === "policyholder"
            ? "Register policies, monitor programmable collateral, and manage releases."
            : "Model 80/20 collateral splits and mint ranked tokenized cessions."}
        </p>
      </div>

      {links.map((link) => (
        <NavLink
          key={link.path}
          to={link.path}
          className={({ isActive }) =>
            `sidebar-link${isActive ? " sidebar-link--active" : ""}`
          }
        >
          {link.name}
        </NavLink>
      ))}

      <NavLink
        to="/"
        className={({ isActive }) =>
          `sidebar-link${isActive ? " sidebar-link--active" : ""}`
        }
      >
        Profile
      </NavLink>
    </div>
  );
}
