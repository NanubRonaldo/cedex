import { createContext, useContext, useEffect, useState } from "react";
import * as authApi from "../api/authApi";
import {
  clearIdentity,
  getToken,
  getUser,
  setIdentity
} from "../services/identityService";
import { getPersonaLabel, getWorkspaceRole } from "../utils/roles";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = getToken();

        if (token) {
          const profile = await authApi.getProfile();
          setIdentity(token, profile);
          setUser(profile);
        }
      } catch (err) {
        console.error("Auth init failed:", err);
        clearIdentity();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authApi.login(email, password);
      setIdentity(data.token, data.user);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      const isNetworkError = !err.response;
      return {
        success: false,
        message: isNetworkError
          ? "API is unreachable (expected http://localhost:5000/api). Start backend server first."
          : err.response?.data?.message || "Login failed"
      };
    }
  };

  const logout = () => {
    clearIdentity();
    setUser(null);
  };

  const workspaceRole = getWorkspaceRole(user);
  const persona = getPersonaLabel(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        workspaceRole,
        persona,
        isPolicyholder: workspaceRole === "policyholder",
        isLender: workspaceRole === "lender",
        isAdmin: user?.role === "admin"
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
