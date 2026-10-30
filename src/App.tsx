import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { type ReactNode } from 'react';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/Common';

import { GetStarted } from '@/screens/auth/GetStarted';
import { Login } from '@/screens/auth/Login';
import { Register } from '@/screens/auth/Register';

import { DriverDashboard } from '@/screens/driver/DriverDashboard';
import { DriverProfile } from '@/screens/driver/DriverProfile';
import { DriverHistory } from '@/screens/driver/DriverHistory';
import { DriverEarnings } from '@/screens/driver/DriverEarnings';
import { StartRide } from '@/screens/driver/StartRide';
import { ActiveRide } from '@/screens/driver/ActiveRide';

import { AdminPanel } from '@/screens/admin/AdminPanel';
import { RoleSelection } from '@/screens/auth/RoleSelection';

// ============================================================
// LOADING SCREEN
// ============================================================

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}


// ============================================================
// PROTECTED ROUTE
// ============================================================

function ProtectedRoute({
  children,
  allowedRole,
}: {
  children: ReactNode;
  allowedRole?: 'driver' | 'admin';
}) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Not logged in
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Profile still loading
  if (!profile) {
    return <LoadingScreen />;
  }

  // Wrong role
  if (allowedRole && profile.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}


// ============================================================
// HOME ROUTE
// ============================================================

function HomeRoute() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Not logged in
  if (!session) {
    return <GetStarted />;
  }

  // Profile still loading
  if (!profile) {
    return <LoadingScreen />;
  }

  // Driver
  if (profile.role === 'driver') {
    return <Navigate to="/driver" replace />;
  }

  // Admin
  if (profile.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Passenger accounts are no longer supported
  if (profile.role === 'passenger') {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/login" replace />;
}


// ============================================================
// AUTH ROUTE
// ============================================================

function AuthRoute({
  children,
}: {
  children: ReactNode;
}) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Already logged in
  if (session && profile) {
    if (profile.role === 'driver') {
      return <Navigate to="/driver" replace />;
    }

    if (profile.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }

    // Passenger accounts are no longer supported
    if (profile.role === 'passenger') {
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}


// ============================================================
// APP ROUTES
// ============================================================

function AppRoutes() {
  return (
    <Routes>

      {/* ======================================================
          HOME
      ====================================================== */}

      <Route
        path="/"
        element={<HomeRoute />}
      />


      {/* ======================================================
          AUTH
      ====================================================== */}

      <Route
        path="/login"
        element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        }
      />

      <Route
        path="/register"
        element={
          <AuthRoute>
            <Register />
          </AuthRoute>
        }
      />


      {/* ======================================================
          DRIVER
      ====================================================== */}

      <Route
        path="/driver"
        element={
          <ProtectedRoute allowedRole="driver">
            <DriverDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/driver/profile"
        element={
          <ProtectedRoute allowedRole="driver">
            <DriverProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/driver/history"
        element={
          <ProtectedRoute allowedRole="driver">
            <DriverHistory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/driver/earnings"
        element={
          <ProtectedRoute allowedRole="driver">
            <DriverEarnings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/driver/start-ride"
        element={
          <ProtectedRoute allowedRole="driver">
            <StartRide />
          </ProtectedRoute>
        }
      />

      <Route
        path="/driver/ride/:rideId"
        element={
          <ProtectedRoute allowedRole="driver">
            <ActiveRide />
          </ProtectedRoute>
        }
      />


      {/* ======================================================
          ADMIN
      ====================================================== */}

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminPanel />
          </ProtectedRoute>
        }
      />


      {/* ======================================================
          FALLBACK
      ====================================================== */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}


// ============================================================
// APP
// ============================================================

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

