const TOKEN_KEY = "token";
const USER_KEY = "user";

export const setIdentity = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);

  try {
    return user ? JSON.parse(user) : null;
  } catch (error) {
    clearIdentity();
    return null;
  }
};

export const clearIdentity = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const getRole = () => {
  const user = getUser();
  return user?.role || null;
};

export const getMSP = () => {
  const user = getUser();
  return user?.msp || null;
};

export const authHeader = () => {
  const token = getToken();

  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`
  };
};
