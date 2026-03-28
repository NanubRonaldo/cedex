import API from "./api";

export const login = async (email, password) => {
  const response = await API.post("/auth/login", {
    email,
    password
  });

  return response.data;
};

export const register = async (payload) => {
  const response = await API.post("/auth/register", payload);
  return response.data;
};

export const getProfile = async () => {
  const response = await API.get("/auth/profile");
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("token");
};