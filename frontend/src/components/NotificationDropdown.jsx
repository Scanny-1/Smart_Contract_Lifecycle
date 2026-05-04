import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [show, setShow] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get('http://localhost:5000/api/notifications', config);
                setNotifications(data);
            } catch (err) {
                console.error('Failed to fetch notifications', err);
            }
        };

        if (user) {
            fetchNotifications();
        }
    }, [user, show]); // refresh when opened

    const markAsRead = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, config);
            setNotifications(notifications.map(n => n._id === id ? { ...n, readStatus: true } : n));
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }
    };

    const unreadCount = notifications.filter(n => !n.readStatus).length;

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button 
                onClick={() => setShow(!show)} 
                className="btn btn-outline" 
                style={{ padding: '0.4rem 1rem', position: 'relative' }}
            >
                Notifications
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '-5px', right: '-5px',
                        background: 'var(--error)', color: 'white',
                        borderRadius: '50%', padding: '0.2rem 0.5rem',
                        fontSize: '0.7rem', fontWeight: 'bold'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {show && (
                <div style={{
                    position: 'absolute', right: 0, top: '100%', mt: '0.5rem',
                    background: 'var(--surface)', border: '1px solid var(--surface-border)',
                    borderRadius: '8px', width: '300px', maxHeight: '400px',
                    overflowY: 'auto', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    padding: '1rem'
                }}>
                    <h4 style={{ margin: '0 0 1rem 0' }}>Notifications</h4>
                    {notifications.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No notifications</p>
                    ) : (
                        notifications.map(notif => (
                            <div key={notif._id} style={{
                                padding: '0.8rem',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                background: notif.readStatus ? 'transparent' : 'rgba(255,255,255,0.02)',
                                opacity: notif.readStatus ? 0.7 : 1
                            }}>
                                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>{notif.message}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        {new Date(notif.createdAt).toLocaleDateString()}
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {notif.relatedContractId && (
                                            <Link to={`/contract/${notif.relatedContractId._id}`} style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                                                View
                                            </Link>
                                        )}
                                        {!notif.readStatus && (
                                            <button 
                                                onClick={() => markAsRead(notif._id)}
                                                style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', fontSize: '0.8rem' }}
                                            >
                                                Mark Read
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
