import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            setIsLoading(false);
        }
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--bg-gradient)',
            zIndex: 1000
        }}>
            {/* Animated background elements */}
            <div style={{
                position: 'absolute',
                top: '10%',
                left: '20%',
                width: '300px',
                height: '300px',
                background: 'var(--primary)',
                filter: 'blur(100px)',
                opacity: 0.3,
                borderRadius: '50%',
                animation: 'pulse 4s infinite alternate'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '10%',
                right: '20%',
                width: '250px',
                height: '250px',
                background: 'var(--secondary)',
                filter: 'blur(100px)',
                opacity: 0.2,
                borderRadius: '50%',
                animation: 'pulse 5s infinite alternate-reverse'
            }} />

            <div className="animate-slide-in" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 10 }}>
                <div className="glass-card" style={{ padding: '3rem 2rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome Back</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Enter your credentials to access the platform</p>
                    </div>

                    {error && (
                        <div style={{ 
                            background: 'rgba(239, 68, 68, 0.1)', 
                            color: '#fca5a5', 
                            padding: '1rem', 
                            borderRadius: '8px', 
                            marginBottom: '1.5rem',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            fontSize: '0.9rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input 
                                type="email" 
                                className="form-input" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                placeholder="name@company.com"
                                style={{ padding: '1rem' }}
                            />
                        </div>
                        <div className="form-group" style={{ position: 'relative' }}>
                            <label className="form-label">Password</label>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className="form-input" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                                placeholder="••••••••"
                                style={{ padding: '1rem', paddingRight: '3rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '40px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    color: 'var(--text-muted)'
                                }}
                            >
                                {showPassword ? '👁️' : '🙈'}
                            </button>
                        </div>
                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            style={{ width: '100%', padding: '1rem', marginTop: '1rem', fontSize: '1rem' }}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>

                    <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <p style={{ marginBottom: '1rem' }}></p>
                        Smart Contract Lifecycle Management System <br/>
                        Enterprise Edition
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
