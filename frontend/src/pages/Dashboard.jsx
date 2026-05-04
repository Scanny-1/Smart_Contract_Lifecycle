import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = () => {
    const [contracts, setContracts] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, expired: 0, rejected: 0, draft: 0 });
    const [renewContract, setRenewContract] = useState(null);
    const [renewDate, setRenewDate] = useState('');
    const { user } = useAuth();

    const getDisplayStatus = (contract) => {
        if (contract.status === 'Draft' || contract.status === 'Rejected' || contract.status === 'Pending') {
            return contract.status;
        }
        if (new Date(contract.endDate) < new Date()) {
            return 'Expired';
        }
        return contract.status;
    };

    const loadData = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const contractsRes = await axios.get('http://localhost:5000/api/contracts', config);
            const fetchedContracts = contractsRes.data;
            
            let pending = 0, active = 0, expired = 0, rejected = 0, draft = 0;
            fetchedContracts.forEach(c => {
                const status = getDisplayStatus(c);
                if (status === 'Pending') pending++;
                else if (status === 'Active') active++;
                else if (status === 'Expired') expired++;
                else if (status === 'Rejected') rejected++;
                else if (status === 'Draft') draft++;
            });

            setContracts(fetchedContracts);
            setStats({ total: fetchedContracts.length, pending, active, expired, rejected, draft });
        } catch (err) {
            console.error('Error fetching dashboard data', err);
        }
    };

    useEffect(() => {
        loadData();
    }, [user.token]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleRenewSubmit = async () => {
        if (!renewDate) {
            alert('Please select a new end date');
            return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`http://localhost:5000/api/contracts/${renewContract._id}/renew`, { newEndDate: renewDate }, config);
            
            await loadData();
            setRenewContract(null);
            setRenewDate('');
        } catch (err) {
            alert(err.response?.data?.message || 'Renew failed');
        }
    };

    const donutData = {
        labels: ['Pending', 'Active', 'Expired', 'Rejected', 'Draft'],
        datasets: [{
            data: [stats.pending, stats.active, stats.expired, stats.rejected, stats.draft],
            backgroundColor: [
                'rgba(245, 158, 11, 0.8)', // Warning (Pending)
                'rgba(16, 185, 129, 0.8)', // Success (Active)
                'rgba(239, 68, 68, 0.8)',  // Danger (Expired)
                'rgba(236, 72, 153, 0.8)', // Pink (Rejected)
                'rgba(148, 163, 184, 0.8)' // Gray (Draft)
            ],
            borderColor: ['#f59e0b', '#10b981', '#ef4444', '#ec4899', '#94a3b8'],
            borderWidth: 1,
            hoverOffset: 4
        }]
    };

    const donutOptions = {
        cutout: '75%',
        plugins: {
            legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter' } } }
        }
    };

    // Calculate contracts by month for Bar chart
    const monthlyData = new Array(12).fill(0);
    contracts.forEach(c => {
        const month = new Date(c.createdAt || c.startDate).getMonth();
        monthlyData[month]++;
    });

    const barData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            label: 'Contracts Created',
            data: monthlyData,
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
            borderColor: '#3b82f6',
            borderWidth: 1,
            borderRadius: 4
        }]
    };

    const barOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
    };

    const pendingForMe = contracts.filter(c => {
        if (c.status !== 'Pending') return false;
        const roleName = user.roleId ? user.roleId.name : null;
        if (roleName === 'Admin') return true;
        if (c.allowedRoles && user.roleId && c.allowedRoles.includes(user.roleId._id || user.roleId)) return true;
        return false;
    });

    const exportToCSV = () => {
        const headers = ['Title,Created By,Status,Start Date,End Date'];
        const rows = contracts.map(c => 
            `"${c.title}","${c.createdBy?.name || 'Unknown'}","${c.status}","${new Date(c.startDate).toLocaleDateString()}","${new Date(c.endDate).toLocaleDateString()}"`
        );
        const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "contracts_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Overview of your contract lifecycle</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={exportToCSV} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        Export CSV
                    </button>
                    <Link to="/create" className="btn btn-primary">+ New Contract</Link>
                </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total</span>
                    <span style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-main)' }}>{stats.total}</span>
                </div>
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', borderBottom: '3px solid var(--success)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Active</span>
                    <span style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--success)' }}>{stats.active}</span>
                </div>
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', borderBottom: '3px solid var(--warning)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Pending</span>
                    <span style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--warning)' }}>{stats.pending}</span>
                </div>
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', borderBottom: '3px solid var(--error)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Expired</span>
                    <span style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--error)' }}>{stats.expired}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', marginBottom: '2rem' }}>
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 style={{ alignSelf: 'flex-start', marginBottom: '1rem' }}>Status Distribution</h3>
                    <div style={{ width: '100%', maxWidth: '250px' }}>
                        <Doughnut data={donutData} options={donutOptions} />
                    </div>
                </div>

                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Contracts Created (YTD)</h3>
                    <div style={{ width: '100%', height: '250px' }}>
                        <Bar data={barData} options={barOptions} />
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                {pendingForMe.length > 0 ? (
                    <div className="glass-card" style={{ border: '1px solid rgba(245, 158, 11, 0.3)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--warning)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ color: 'var(--warning)', margin: 0 }}>Requires Your Approval</h3>
                            <span className="status-badge status-Pending">{pendingForMe.length} Action{pendingForMe.length > 1 ? 's' : ''} Needed</span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="glass-table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Created By</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingForMe.map(contract => (
                                        <tr key={contract._id}>
                                            <td style={{ fontWeight: '500', color: 'var(--text-main)' }}>{contract.title}</td>
                                            <td>{contract.createdBy?.name || 'Unknown'}</td>
                                            <td><span className="status-badge status-Pending">Awaiting Approval</span></td>
                                            <td>
                                                <Link to={`/contract/${contract._id}`} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                                                    Review Now
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <h3>You're all caught up!</h3>
                        <p>No contracts require your approval at the moment.</p>
                    </div>
                )}
            </div>

            <div className="glass-card">
                <h3 style={{ marginBottom: '1.5rem' }}>Recent Contracts</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table className="glass-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Created By</th>
                                <th>Duration</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contracts.length > 0 ? contracts.slice(0, 10).map(contract => {
                                const displayStatus = getDisplayStatus(contract);
                                const roleName = user.roleId ? user.roleId.name : null;
                                const isOwner = (contract.createdBy?._id || contract.createdBy) === user._id || roleName === 'Admin';
                                const canRenew = isOwner && (displayStatus === 'Active' || displayStatus === 'Expired');
                                
                                return (
                                <tr key={contract._id}>
                                    <td style={{ fontWeight: '500', color: 'var(--text-main)' }}>{contract.title}</td>
                                    <td>{contract.createdBy?.name || 'Unknown'}</td>
                                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {new Date(contract.startDate).toLocaleDateString()} &rarr; {new Date(contract.endDate).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${displayStatus}`}>
                                            {displayStatus}
                                        </span>
                                    </td>
                                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Link to={`/contract/${contract._id}`} className="btn btn-outline" style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}>
                                            View Details
                                        </Link>
                                        {canRenew && (
                                            <button 
                                                onClick={() => setRenewContract(contract)} 
                                                className="btn btn-success" 
                                                style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
                                            >
                                                Renew
                                            </button>
                                        )}
                                    </td>
                                </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                        No contracts found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {renewContract && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="glass-card animate-slide-in" style={{ width: '100%', maxWidth: '400px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--success)' }}>Renew Contract</h3>
                        <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Select a new end date for <strong>{renewContract.title}</strong></p>
                        <div className="form-group">
                            <label className="form-label">New End Date</label>
                            <input 
                                type="date" 
                                className="form-input" 
                                value={renewDate} 
                                onChange={(e) => setRenewDate(e.target.value)} 
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button onClick={() => setRenewContract(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                            <button onClick={handleRenewSubmit} className="btn btn-success" style={{ flex: 1 }}>Confirm Renew</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
