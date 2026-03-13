import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

export const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="app-loading" role="status" aria-live="polite">
        <div className="app-loading__spinner" />
        <p>Loading your session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};
