import API from "./api";

// Create a cession (locks policy value)
export const createCession = async (data) => {
  /**
   * Expected payload:
   * {
   *   policyId,
   *   cedent,
   *   cessionary,
   *   amount
   * }
   */
  const response = await API.post("/cessions", data);
  return response.data;
};

export const createTokenizedCession = async (data) => {
  const response = await API.post("/cessions/tokenized", data);
  return response.data;
};

export const consentCession = async (cessionId) => {
  const response = await API.post(`/cessions/${cessionId}/consent`);
  return response.data;
};

export const approveCession = async (cessionId) => {
  const response = await API.post(`/cessions/${cessionId}/approve`);
  return response.data;
};

export const activateCession = async (cessionId) => {
  const response = await API.post(`/cessions/${cessionId}/activate`);
  return response.data;
};

export const requestReleaseCession = async (cessionId) => {
  const response = await API.post(`/cessions/${cessionId}/release-request`);
  return response.data;
};

export const lenderApproveReleaseCession = async (cessionId) => {
  const response = await API.post(`/cessions/${cessionId}/release-approve-lender`);
  return response.data;
};

// Get all cessions (for lender view)
export const getCessions = async () => {
  const response = await API.get("/cessions");
  return response.data;
};

// Get cessions by policy
export const getCessionsByPolicy = async (policyId) => {
  const response = await API.get(`/cessions/policy/${policyId}`);
  return response.data;
};

export const getPriorityCessionsByPolicy = async (policyId) => {
  const response = await API.get(`/cessions/policy/${policyId}/priority`);
  return response.data;
};

// Release a cession (loan repaid)
export const releaseCession = async (cessionId) => {
  const response = await API.post(`/cessions/${cessionId}/release`);
  return response.data;
};

// Get active cessions
export const getActiveCessions = async () => {
  const response = await API.get("/cessions/active");
  return response.data;
};
