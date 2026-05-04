import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [roleId, setRoleId] = useState('');
    const [newRoleName, setNewRoleName] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/auth/users', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const fetchRoles = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/auth/roles', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setRoles(data);
            if (data.length > 0 && !roleId) {
                setRoleId(data[0]._id);
            }
        } catch (error) {
            console.error('Failed to fetch roles', error);
        }
    };

    const handleCreateEmployee = async (e) => {
        e.preventDefault();
        setMessage('');
        if (!roleId) return setMessage('Please create a role first');
        try {
            await axios.post('http://localhost:5000/api/auth/employee', {
                name, email, password, roleId
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setMessage('Employee created successfully!');
            setName(''); setEmail(''); setPassword('');
            fetchUsers();
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error creating employee');
        }
    };

    const handleDeleteEmployee = async (id) => {
        if (!window.confirm('Are you sure you want to delete this employee?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/auth/employee/${id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setMessage('Employee deleted successfully');
            fetchUsers();
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error deleting employee');
        }
    };

    return (
        <div className="animate-fade-in" style={{ padding: '2rem' }}>
            <h1 style={{ marginBottom: '2rem' }}>Team Management</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div className="glass-card">
                    <h2 style={{ marginBottom: '1.5rem' }}>Create Employee</h2>
                    {message && <div style={{ color: message.includes('success') ? 'var(--success)' : 'var(--error)', marginBottom: '1rem' }}>{message}</div>}
                    <form onSubmit={handleCreateEmployee}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select className="form-input" value={roleId} onChange={e => setRoleId(e.target.value)} style={{ backgroundColor: 'var(--surface)' }} required>
                                {roles.length === 0 && <option value="">No roles available</option>}
                                {roles.map(r => (
                                    <option key={r._id} value={r._id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Employee</button>
                    </form>
                </div>

                <div className="glass-card">
                    <h2 style={{ marginBottom: '1.5rem' }}>Team Members</h2>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '1rem' }}>Name</th>
                                <th style={{ padding: '1rem' }}>Email</th>
                                <th style={{ padding: '1rem' }}>Role</th>
                                <th style={{ padding: '1rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem' }}>{u.name}</td>
                                    <td style={{ padding: '1rem' }}>{u.email}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ 
                                            padding: '0.2rem 0.6rem', 
                                            borderRadius: '4px', 
                                            fontSize: '0.8rem',
                                            background: u.roleId?.name === 'Admin' ? 'var(--primary)' : 'rgba(255,255,255,0.1)'
                                        }}>
                                            {u.roleId?.name || 'No Role'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {u.roleId?.name !== 'Admin' && (
                                            <button 
                                                onClick={() => handleDeleteEmployee(u._id)}
                                                style={{ background: 'var(--error)', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div style={{ marginTop: '2rem' }}>
                <div className="glass-card">
                    <h2 style={{ marginBottom: '1.5rem' }}>Company Roles</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Standard roles are automatically provisioned for your company workflow.</p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {roles.map(r => (
                            <div key={r._id} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                {r.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
