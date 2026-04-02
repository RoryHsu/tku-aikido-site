import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({ allowRoles, children }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-600">載入中...</div>
      </div>
    );
  }

  if (!profile?.role || !allowRoles.includes(profile.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}