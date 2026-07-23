import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar, DOCTOR_NAV_ITEMS } from '@/components/Sidebar';
import { useAuth } from '@/auth/AuthProvider';

export function DoctorLayout() {
  const { isAuthenticated, isLoading, role, doctorId } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg">
        <p className="text-[14px] text-text-muted">Загрузка…</p>
      </div>
    );
  }

  // A patient-only account has no doctor profile — send it to its own area.
  if (role === 'patient' && !doctorId) {
    return <Navigate to="/patient" replace />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg">
      <Sidebar roleLabel="Врач" navItems={DOCTOR_NAV_ITEMS} />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-[1400px] px-10 py-9">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
