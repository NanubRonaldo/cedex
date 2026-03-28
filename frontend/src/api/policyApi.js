import API from "./api";

// Get all policies for logged-in user
export const getPolicies = async () => {
  const response = await API.get("/policies");
  return response.data;
};

// Get a single policy
export const getPolicyById = async (policyId) => {
  const response = await API.get(`/policies/${policyId}`);
  return response.data;
};

// Create a new policy (Insurer-side)
export const createPolicy = async (data) => {
  const response = await API.post("/policies", data);
  return response.data;
};

// Get available policies for lending (aggregated logic)
export const getAvailablePolicies = async () => {
  const response = await API.get("/policies/available");
  return response.data;
};

export const calculateCollateral = async (policyId, loanAmount) => {
  const response = await API.post(`/policies/${policyId}/calculate-collateral`, {
    loanAmount
  });
  return response.data;
};

export const getPolicyCollateralStatus = async (policyId) => {
  const response = await API.get(`/policies/${policyId}/collateral-status`);
  return response.data;
};

export const getAvailableCapacity = async (policyId) => {
  const response = await API.get(`/policies/${policyId}/available-capacity`);
  return response.data;
};

export const getPolicyholderPrivateData = async (policyId) => {
  const response = await API.get(`/policies/${policyId}/private/policyholder`);
  return response.data;
};

// Update policy (e.g. status or value updates)
export const updatePolicy = async (policyId, data) => {
  const response = await API.put(`/policies/${policyId}`, data);
  return response.data;
};
