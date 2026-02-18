import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import API_URL from '../config';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
            if (res.data.user.role !== 'admin') {
                setError('Access Denied: Not an Admin');
                return;
            }
            login(res.data.user, res.data.token);
            navigate('/admin-dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="glass-panel" style={{ maxWidth: '400px', margin: '2rem auto', border: '1px solid var(--accent)' }}>
            <h2 style={{ color: 'var(--accent)' }}>Admin Portal</h2>
            <form onSubmit={handleSubmit}>
                <input className="input-field" type="email" placeholder="Admin Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input className="input-field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit" className="btn" style={{ width: '100%', marginTop: '1rem', background: 'var(--accent)' }}>Login as Admin</button>
            </form>
            {error && <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>{error}</p>}
        </div>
    );
};

export default AdminLogin;
