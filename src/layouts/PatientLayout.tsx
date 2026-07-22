import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/auth/AuthProvider';

export function PatientLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/patient/auth" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg">
        <p className="text-[14px] text-text-muted">Загрузка…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-[1400px] px-10 py-9">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
