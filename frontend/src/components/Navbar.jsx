import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="glass-panel" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '3rem',
            padding: '1rem 2rem',
            position: 'sticky',
            top: '20px',
            zIndex: 100,
            background: 'rgba(17, 25, 40, 0.85)', // Slightly more opaque
            backdropFilter: 'blur(20px)'
        }}>
            <Link to="/" style={{
                fontSize: '1.8rem',
                fontWeight: '800',
                background: 'var(--gradient-1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textDecoration: 'none',
                fontFamily: 'var(--font-display)'
            }}>
                TechQuiz<span style={{ color: 'var(--accent)', WebkitTextFillColor: 'initial' }}>.io</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {user ? (
                    <>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>
                            Hello, <span style={{ color: 'white' }}>{user.name}</span>
                        </span>
                        {user.role === 'admin' ? (
                            <Link to="/admin-dashboard" className="nav-link" style={{ fontWeight: '600' }}>Dashboard</Link>
                        ) : (
                            <Link to="/quiz" className="nav-link" style={{ fontWeight: '600' }}>Exams</Link>
                        )}
                        <button className="btn" onClick={handleLogout} style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#f87171',
                            boxShadow: 'none',
                            padding: '0.6rem 1.2rem',
                            fontSize: '0.9rem'
                        }}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="nav-link">Log In</Link>
                        <Link to="/register" className="btn" style={{ textDecoration: 'none', background: 'var(--gradient-2)' }}>Get Started</Link>
                        <Link to="/admin-login" className="nav-link" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>Admin</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
