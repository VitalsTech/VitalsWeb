import { Navigate, Outlet } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { DOCTOR_NAV_ITEMS } from '@/components/Sidebar';
import { useAuth } from '@/auth/AuthProvider';

export function DoctorLayout() {
  const { isAuthenticated, isLoading, role, doctorId } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-bg">
        <p className="text-[14px] text-text-muted">Загрузка…</p>
      </div>
    );
  }

  if (role === 'patient' && !doctorId) {
    return <Navigate to="/patient" replace />;
  }

  return (
    <AppShell roleLabel="Врач" navItems={DOCTOR_NAV_ITEMS}>
      <Outlet />
    </AppShell>
  );
}
