import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user, changePassword } = useAuth();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
            return setError('New passwords do not match');
        }

        setLoading(true);
        try {
            await changePassword(oldPassword, newPassword);
            setMessage('Password updated successfully!');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '2rem auto' }}>
            <div className="glass-card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Profile Information</h2>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <span style={{ color: 'var(--text-muted)' }}>Name:</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{user.name}</div>
                    </div>
                    <div>
                        <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{user.email}</div>
                    </div>
                    <div>
                        <span style={{ color: 'var(--text-muted)' }}>Role:</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--primary)' }}>{user.role}</div>
                    </div>
                </div>
            </div>

            <div className="glass-card">
                <h2 style={{ marginBottom: '1.5rem' }}>Change Password</h2>
                {message && <div style={{ color: 'var(--success)', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(0,255,150,0.1)', borderRadius: '0.5rem' }}>{message}</div>}
                {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255,50,50,0.1)', borderRadius: '0.5rem' }}>{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Current Password</label>
                        <input 
                            type="password" 
                            className="form-input" 
                            value={oldPassword} 
                            onChange={(e) => setOldPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input 
                            type="password" 
                            className="form-input" 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirm New Password</label>
                        <input 
                            type="password" 
                            className="form-input" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            required 
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
