import { Navigate, Outlet } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { PATIENT_NAV_ITEMS } from '@/components/Sidebar';
import { useAuth } from '@/auth/AuthProvider';

export function PatientLayout() {
  const { isAuthenticated, isLoading, role, patientId } = useAuth();

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

  if (role === 'doctor' && !patientId) {
    return <Navigate to="/doctor" replace />;
  }

  return (
    <AppShell roleLabel="Пациент" navItems={PATIENT_NAV_ITEMS}>
      <Outlet />
    </AppShell>
  );
}
