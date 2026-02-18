import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [set, setSet] = useState(1);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { email, password, set });
            login(res.data.user, res.data.token);
            if (res.data.user.role === 'admin') navigate('/admin-dashboard');
            else navigate('/quiz');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: '80vh' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2.5rem', borderTop: '1px solid rgba(99, 102, 241, 0.5)' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '2rem', backgroundImage: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Welcome Back</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>Enter your credentials to access the quiz portal</p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email Address</label>
                        <input className="input-field" type="email" placeholder="student@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Password</label>
                        <input className="input-field" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Select Set</label>
                        <select className="input-field" value={set} onChange={(e) => setSet(parseInt(e.target.value))} style={{ cursor: 'pointer' }}>
                            <option value={1}>Set 1 (Alpha)</option>
                            <option value={2}>Set 2 (Beta)</option>
                        </select>
                    </div>

                    <button type="submit" className="btn" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>Sign In</button>
                </form>
                {error && <div className="fade-in" style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', borderRadius: '8px', textAlign: 'center' }}>{error}</div>}
            </div>
        </div>
    );
};

export default Login;
