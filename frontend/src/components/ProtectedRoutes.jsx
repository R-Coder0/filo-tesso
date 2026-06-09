import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const isAdmin =
    typeof window !== "undefined" ? localStorage.getItem("isAdmin") : null;

  if (!isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;
