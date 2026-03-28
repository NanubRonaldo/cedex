import axios from "axios";
import { API_BASE_URL } from "../utils/constants";
import { clearIdentity, getToken } from "../services/identityService";

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

API.interceptors.request.use((req) => {
  const token = getToken();

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearIdentity();
      window.location.href = "/login";
    }

    return Promise.reject(err);
  }
);

export default API;
