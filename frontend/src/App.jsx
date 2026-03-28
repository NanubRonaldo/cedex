import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import useAuth from "./hooks/useAuth";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AuthLayout from "./layouts/AuthLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import LenderDashboard from "./pages/lender/LenderDashboard";
import AvailablePolicies from "./pages/lender/AvailablePolicies";
import CreatePolicyPage from "./pages/policyholder/CreatePolicy";
import PolicyholderDashboard from "./pages/policyholder/Dashboard";
import MyPolicies from "./pages/policyholder/MyPolicies";
import PolicyDetails from "./pages/policyholder/PolicyDetails";
import Profile from "./pages/shared/Profile";
import { getWorkspaceRole } from "./utils/roles";

export default function App() {
  const { user } = useAuth();
  const workspaceRole = getWorkspaceRole(user);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <AuthLayout>
              <Login />
            </AuthLayout>
          }
        />

        <Route
          path="/register"
          element={
            <AuthLayout>
              <Register />
            </AuthLayout>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/policyholder/dashboard"
          element={
            <ProtectedRoute role="policyholder">
              <PolicyholderDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/policyholder/create-policy"
          element={
            <ProtectedRoute role="policyholder">
              <CreatePolicyPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/policyholder/policies"
          element={
            <ProtectedRoute role="policyholder">
              <MyPolicies />
            </ProtectedRoute>
          }
        />

        <Route
          path="/policy/:id"
          element={
            <ProtectedRoute>
              <PolicyDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/lender/dashboard"
          element={
            <ProtectedRoute role="lender">
              <LenderDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/lender/policies"
          element={
            <ProtectedRoute role="lender">
              <AvailablePolicies />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to={
                user
                  ? workspaceRole === "lender"
                    ? "/lender/dashboard"
                    : "/policyholder/dashboard"
                  : "/login"
              }
              replace
            />
          }
        />
      </Routes>
    </Router>
  );
}
