import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ContractForm = () => {
    const { id } = useParams();
    const isEdit = !!id;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [file, setFile] = useState(null);
    const [legalFiles, setLegalFiles] = useState([]);
    const [financialFiles, setFinancialFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [initialStatus, setInitialStatus] = useState('');
    const [roles, setRoles] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState([]);
    
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get('http://localhost:5000/api/auth/roles', config);
                setRoles(data);
            } catch (err) {
                console.error("Failed to fetch roles");
            }
        };
        fetchRoles();

        if (isEdit) {
            const fetchContract = async () => {
                try {
                    const config = { headers: { Authorization: `Bearer ${user.token}` } };
                    const { data } = await axios.get(`http://localhost:5000/api/contracts/${id}`, config);
                    
                    if (data.createdBy._id !== user._id) {
                        navigate('/');
                        return;
                    }
                    
                    setTitle(data.title);
                    setDescription(data.description || '');
                    setStartDate(data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '');
                    setEndDate(data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '');
                    setInitialStatus(data.status);
                    setSelectedRoles(data.allowedRoles || []);
                    
                } catch (err) {
                    setError('Failed to fetch contract details');
                }
            };
            fetchContract();
        }
    }, [id, user, navigate, isEdit]);

    const handleRoleToggle = (roleId) => {
        setSelectedRoles(prev => 
            prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
        );
    };

    const handleSubmit = async (e, submitForApproval) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!title || !startDate || !endDate) {
            setError('Please fill in all required fields (Title, Start Date, End Date).');
            setLoading(false);
            return;
        }

        if (!isEdit && !file && legalFiles.length === 0 && financialFiles.length === 0 && submitForApproval) {
             setError('At least one document is required to submit a contract.');
             setLoading(false);
             return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('startDate', startDate);
        formData.append('endDate', endDate);
        formData.append('submitForApproval', submitForApproval);
        formData.append('allowedRoles', JSON.stringify(selectedRoles));
        
        if (file) {
            formData.append('file', file);
        }
        
        for (let i = 0; i < legalFiles.length; i++) {
            formData.append('legalDocuments', legalFiles[i]);
        }
        
        for (let i = 0; i < financialFiles.length; i++) {
            formData.append('financialDocuments', financialFiles[i]);
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${user.token}`
                }
            };

            if (isEdit) {
                await axios.put(`http://localhost:5000/api/contracts/${id}`, formData, config);
            } else {
                await axios.post('http://localhost:5000/api/contracts', formData, config);
            }
            
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save contract');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="glass-card">
                <h2 style={{ marginBottom: '1.5rem' }}>{isEdit ? 'Edit Contract' : 'Create New Contract'}</h2>
                {error && (
                    <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        {error}
                    </div>
                )}
                
                {isEdit && initialStatus === 'Rejected' && (
                    <div style={{ padding: '1rem', background: 'rgba(236, 72, 153, 0.1)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.2)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        <strong>Note:</strong> This contract was rejected. You can edit and resubmit it for approval.
                    </div>
                )}
                
                <form>
                    <div className="form-group">
                        <label className="form-label">Contract Title <span style={{ color: 'var(--error)' }}>*</span></label>
                        <input 
                            type="text" 
                            className="form-input" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            required 
                            placeholder="e.g., Software Licensing Agreement"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea 
                            className="form-input" 
                            rows="3" 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Briefly describe the purpose of this contract"
                        ></textarea>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Start Date <span style={{ color: 'var(--error)' }}>*</span></label>
                            <input 
                                type="date" 
                                className="form-input" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)} 
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">End Date <span style={{ color: 'var(--error)' }}>*</span></label>
                            <input 
                                type="date" 
                                className="form-input" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)} 
                                required 
                            />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Primary Contract Document (PDF/DOC)</label>
                        <input 
                            type="file" 
                            className="form-input" 
                            onChange={(e) => setFile(e.target.files[0])} 
                            accept=".pdf,.doc,.docx"
                        />
                        {isEdit && <small style={{ color: 'var(--text-muted)' }}>Leave blank to keep the existing document.</small>}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Legal Documents (Multiple)</label>
                        <input 
                            type="file" 
                            multiple
                            className="form-input" 
                            onChange={(e) => setLegalFiles(e.target.files)} 
                            accept=".pdf,.doc,.docx"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Financial Documents (Multiple)</label>
                        <input 
                            type="file" 
                            multiple
                            className="form-input" 
                            onChange={(e) => setFinancialFiles(e.target.files)} 
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Who can View and Approve this Contract?</label>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                            {roles.length > 0 ? roles.map(role => (
                                <label key={role._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.05)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedRoles.includes(role._id)} 
                                        onChange={() => handleRoleToggle(role._id)} 
                                    />
                                    {role.name}
                                </label>
                            )) : (
                                <small style={{ color: 'var(--warning)' }}>No custom roles found. Ask your Company Admin to create roles.</small>
                            )}
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button 
                            type="button" 
                            onClick={() => navigate('/')} 
                            className="btn btn-outline" 
                            style={{ flex: 1, border: 'none', background: 'rgba(0,0,0,0.05)' }}
                        >
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            onClick={(e) => handleSubmit(e, false)} 
                            className="btn btn-outline" 
                            disabled={loading} 
                            style={{ flex: 1 }}
                        >
                            Save Draft
                        </button>
                        <button 
                            type="button" 
                            onClick={(e) => handleSubmit(e, true)} 
                            className="btn btn-primary" 
                            disabled={loading} 
                            style={{ flex: 2 }}
                        >
                            {loading ? 'Processing...' : 'Submit for Approval'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ContractForm;
