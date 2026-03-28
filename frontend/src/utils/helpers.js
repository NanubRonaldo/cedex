import { getUser } from "../services/identityService";
import { formatNAD } from "./currency";

/**
 * Format currency (Namibian context or general use)
 */
export const formatCurrency = (amount) => {
  return formatNAD(amount);
};

/**
 * Calculate ceded percentage
 */
export const calculateCededPercent = (totalValue, cededValue) => {
  if (!totalValue) return 0;
  return Math.round((cededValue / totalValue) * 100);
};

/**
 * Check if user has a specific role
 */
export const hasRole = (role) => {
  const user = getUser();
  return user?.role === role;
};

/**
 * Get color based on utilization level
 */
export const getUtilizationColor = (percent) => {
  if (percent < 50) return "#22c55e"; // green
  if (percent < 80) return "#f59e0b"; // amber
  return "#ef4444"; // red
};

/**
 * Sort cessions by priority rank (ascending)
 */
export const sortByPriority = (cessions = []) => {
  return [...cessions].sort((a, b) => a.priorityRank - b.priorityRank);
};

/**
 * Check if policy has available collateral
 */
export const hasAvailableCollateral = (policy) => {
  return policy?.availableValue > 0;
};
