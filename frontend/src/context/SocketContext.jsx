import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SERVER_URL } from '../utils/helpers';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (user && user.token) {
            const newSocket = io(SERVER_URL);
            
            newSocket.on('connect', () => {
                newSocket.emit('join', user._id);
            });

            newSocket.on('notification', (notification) => {
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
                
                // Show a browser notification if permitted
                if (Notification.permission === 'granted') {
                    new Notification('Smart Contract Update', {
                        body: notification.message
                    });
                }
            });

            setSocket(newSocket);

            return () => newSocket.close();
        }
    }, [user]);

    const clearUnread = () => setUnreadCount(0);

    return (
        <SocketContext.Provider value={{ socket, notifications, unreadCount, clearUnread }}>
            {children}
        </SocketContext.Provider>
    );
};
