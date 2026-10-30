import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Bike } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  showBack?: boolean;
  showLogout?: boolean;
}

export function AppLayout({ children, title, showBack = false, showLogout = false }: AppLayoutProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-lg font-bold text-slate-900">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {showLogout && (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              <LogOut size={16} />
              Logout
            </button>
          )}
          <div className="flex items-center gap-1.5 text-blue-600">
            <Bike size={20} />
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
