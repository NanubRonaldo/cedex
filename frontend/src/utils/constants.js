export const ROLES = {
  POLICYHOLDER: "policyholder",
  LENDER: "lender"
};

export const POLICY_STATUS = {
  ACTIVE: "active",
  EXPIRED: "expired",
  SUSPENDED: "suspended"
};

export const CESSION_STATUS = {
  ACTIVE: "active",
  PENDING: "pending",
  REJECTED: "rejected",
  RELEASED: "released"
};

/**
 * API base URL (can be changed per environment)
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  TOKEN: "app_token",
  USER: "app_user"
};
