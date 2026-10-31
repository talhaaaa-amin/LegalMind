import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireAuth() {
  const { currentLawyer, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-paper text-sm text-slate-500">Loading workspace...</div>;
  }

  if (!currentLawyer) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
