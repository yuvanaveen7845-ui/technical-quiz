import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const ProtectedRoute = ({ role }) => {
    const { user } = useContext(AuthContext);

    if (!user) return <Navigate to="/login" replace />;
    if (role && user.role !== role) {
        if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
