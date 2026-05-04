import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

const NotificationToast = () => {
    const { notifications } = useSocket();
    const [visibleToasts, setVisibleToasts] = useState([]);

    useEffect(() => {
        if (notifications.length > 0) {
            const latest = notifications[0];
            const toastId = Date.now();
            
            setVisibleToasts(prev => [...prev, { ...latest, id: toastId }]);

            // Remove toast after 5 seconds
            setTimeout(() => {
                setVisibleToasts(prev => prev.filter(t => t.id !== toastId));
            }, 5000);
        }
    }, [notifications]);

    if (visibleToasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 9999
        }}>
            {visibleToasts.map(toast => (
                <div key={toast.id} className="animate-slide-in" style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--border)',
                    borderLeft: `4px solid ${toast.type === 'Approval' ? 'var(--primary)' : 'var(--warning)'}`,
                    padding: '1rem',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    maxWidth: '350px',
                    color: 'white'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                        {toast.type || 'Notification'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {toast.message}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NotificationToast;
