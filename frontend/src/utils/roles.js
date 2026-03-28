export function getWorkspaceRole(user) {
  if (!user) return null;
  return user.role === "lender" ? "lender" : "policyholder";
}

export function getPersonaLabel(user) {
  if (!user) return "";
  const email = String(user.email || "").toLowerCase();
  if (email === "borrower@cedex.local") return "borrower";
  if (email === "insurer@cedex.local") return "insurer";
  return user.role;
}
