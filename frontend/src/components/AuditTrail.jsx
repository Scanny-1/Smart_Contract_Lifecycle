import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const AuditTrail = ({ contractId }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { data } = await api.get(`/contracts/${contractId}/audit`);
                setLogs(data);
            } catch (error) {
                console.error("Error fetching audit logs", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [contractId, user.token]);

    if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading audit trail...</div>;

    if (logs.length === 0) return <div style={{ color: 'var(--text-muted)' }}>No audit history found.</div>;

    return (
        <div className="audit-trail">
            <h4 style={{ marginBottom: '1.5rem', textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Immutable Audit Trail</h4>
            <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                {/* Vertical Line */}
                <div style={{ position: 'absolute', left: '7px', top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
                
                {logs.map((log, idx) => (
                    <div key={log._id} style={{ position: 'relative', marginBottom: idx === logs.length - 1 ? 0 : '1.5rem' }}>
                        {/* Dot */}
                        <div style={{ 
                            position: 'absolute', left: '-1.5rem', top: '0.2rem', 
                            width: '12px', height: '12px', borderRadius: '50%', 
                            background: log.action === 'Rejected' ? 'var(--error)' : (log.action === 'Approved' ? 'var(--success)' : 'var(--primary)'),
                            border: '2px solid var(--surface)'
                        }}></div>
                        
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{log.action}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {new Date(log.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                                {log.details}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <span>By: {log.performedBy?.name} ({log.performedBy?.role})</span>
                                {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AuditTrail;
