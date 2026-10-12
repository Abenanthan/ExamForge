import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getUser, isLoggedIn } from '../utils/auth';

function ProtectedRoute({ role }) {
  const location = useLocation();
  const user = getUser();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin-dashboard' : '/student-dashboard'} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;