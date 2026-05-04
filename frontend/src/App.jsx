import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ContractForm from './pages/ContractForm';
import ContractView from './pages/ContractView';
import Profile from './pages/Profile';
import NotificationDropdown from './components/NotificationDropdown';
import NotificationToast from './components/NotificationToast';
import AdminDashboard from './pages/AdminDashboard';

const PrivateRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    
    if (roles) {
        const userRole = user.roleId ? user.roleId.name : null;
        if (!roles.includes(userRole)) {
            return <Navigate to="/" />;
        }
    }
    
    return children;
};

const Navbar = () => {
    const { user, logout } = useAuth();
    return (
        <nav className="navbar">
            <Link to="/" className="nav-logo">SMART CONTRACTS</Link>
            <div className="nav-links">
                {user ? (
                    <>
                        <Link to="/" className="nav-link">Dashboard</Link>
                        <Link to="/create" className="nav-link">New Contract</Link>
                        {user.roleId && user.roleId.name === 'Admin' && (
                            <Link to="/admin" className="nav-link" style={{ color: 'var(--primary)' }}>Team</Link>
                        )}
                        
                        <Link to="/profile" className="nav-link" style={{ fontWeight: 'bold' }}>
                            {user.name} ({user.roleId ? user.roleId.name : 'User'})
                        </Link>
                        <NotificationDropdown />
                        <button onClick={logout} className="btn btn-outline" style={{ padding: '0.4rem 1rem' }}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="nav-link">Login</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

function App() {
    return (
        <AuthProvider>
            <SocketProvider>
                <Router>
                <div className="app-container">
                    <Navbar />
                    <NotificationToast />
                    <main className="main-content">
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/" element={
                                <PrivateRoute>
                                    <Dashboard />
                                </PrivateRoute>
                            } />
                            
                            {/* Admin Routes */}
                            <Route path="/admin" element={
                                <PrivateRoute roles={['Admin']}>
                                    <AdminDashboard />
                                </PrivateRoute>
                            } />

                            <Route path="/create" element={
                                <PrivateRoute>
                                    <ContractForm />
                                </PrivateRoute>
                            } />
                            <Route path="/edit/:id" element={
                                <PrivateRoute>
                                    <ContractForm />
                                </PrivateRoute>
                            } />
                            <Route path="/contract/:id" element={
                                <PrivateRoute>
                                    <ContractView />
                                </PrivateRoute>
                            } />
                            <Route path="/profile" element={
                                <PrivateRoute>
                                    <Profile />
                                </PrivateRoute>
                            } />
                        </Routes>
                    </main>
                </div>
            </Router>
            </SocketProvider>
        </AuthProvider>
    );
}

export default App;
