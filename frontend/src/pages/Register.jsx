import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/auth/register', { name, email, password });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div style={{ display: 'grid', placeItems: 'center', minHeight: '80vh' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '3rem 2.5rem', borderTop: '1px solid rgba(236, 72, 153, 0.5)' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '2rem', backgroundImage: 'var(--gradient-2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Create Account</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>Join the competition today</p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Full Name</label>
                        <input className="input-field" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email Address</label>
                        <input className="input-field" type="email" placeholder="student@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Password</label>
                        <input className="input-field" type="password" placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>

                    <button type="submit" className="btn" style={{ width: '100%', padding: '1rem', background: 'var(--gradient-2)', fontSize: '1.1rem' }}>Register</button>
                </form>
                {error && <div className="fade-in" style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', borderRadius: '8px', textAlign: 'center' }}>{error}</div>}
            </div>
        </div>
    );
};

export default Register;
