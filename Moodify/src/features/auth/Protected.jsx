import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

export const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};
