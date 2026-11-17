import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import HouseCardPage from './pages/HouseCardPage';
import HousesPage from './pages/HousesPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import UserEditPage from './pages/UserEditPage';
import UsersPage from './pages/UsersPage';

function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="state" style={{ border: 0, marginTop: 120 }}>Загрузка данных</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}
function RequireSuperadmin() {
  const { isSuperadmin } = useAuth();
  return isSuperadmin ? <Outlet /> : <Navigate to="/houses" replace />;
}

export default function App() {
  return (
    <BrowserRouter basename="/m">
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/houses" element={<HousesPage />} />
            <Route path="/house" element={<HouseCardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route element={<RequireSuperadmin />}>
              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/:id" element={<UserEditPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/houses" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
