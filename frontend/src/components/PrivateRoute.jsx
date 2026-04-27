import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PrivateRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh'
            }}>
                <div className="flex flex-col items-center gap-md">
                    <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
                    <p className="text-secondary">Loading...</p>
                </div>
            </div>
        );
    }

    return user ? children : <Navigate to="/login" />;
}

export default PrivateRoute;
