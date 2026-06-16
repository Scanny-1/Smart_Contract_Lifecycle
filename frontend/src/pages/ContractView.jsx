import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AuditTrail from '../components/AuditTrail';
import { getFileUrl } from '../utils/helpers';

const ContractView = () => {
    const { id } = useParams();
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [renewDate, setRenewDate] = useState('');
    const [showRenew, setShowRenew] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchContract = async () => {
            try {
                const { data } = await api.get(`/contracts/${id}`);
                setContract(data);
            } catch (err) {
                setError('Failed to fetch contract details');
            } finally {
                setLoading(false);
            }
        };
        fetchContract();
    }, [id, user.token]);

    const handleReview = async (status) => {
        let report = prompt(`Please enter your report for this ${status} review:`);
        if (report === null) return;
        try {
            await api.put(`/contracts/${id}/review`, { status, report });
            const { data } = await api.get(`/contracts/${id}`);
            setContract(data);
        } catch (err) {
            alert(err.response?.data?.message || 'Review failed');
        }
    };

    const handleApproval = async (status) => {
        let reason = '';
        if (status === 'Rejected') {
            reason = prompt('Please enter a reason for rejection:');
            if (reason === null) return; // User cancelled
        }

        try {
            await api.put(`/contracts/${id}/approve`, { status, reason });
            const { data } = await api.get(`/contracts/${id}`);
            setContract(data);
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this contract?')) return;
        try {
            await api.delete(`/contracts/${id}`);
            navigate('/');
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed');
        }
    };

    const handleRenew = async () => {
        if (!renewDate) {
            alert('Please select a new end date');
            return;
        }
        try {
            await api.put(`/contracts/${id}/renew`, { newEndDate: renewDate });
            const { data } = await api.get(`/contracts/${id}`);
            setContract(data);
            setShowRenew(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Renew failed');
        }
    };

    const handleSign = async () => {
        if (!window.confirm('By signing, you agree to the terms of this document. This action cannot be undone.')) return;
        try {
            await api.post(`/contracts/${id}/sign`, {});
            const { data } = await api.get(`/contracts/${id}`);
            setContract(data);
            alert('Successfully signed document!');
        } catch (err) {
            alert(err.response?.data?.message || 'Signing failed');
        }
    };

    if (loading) return <div>Loading contract details...</div>;
    if (error) return <div className="glass-card" style={{ color: 'var(--error)' }}>{error}</div>;
    if (!contract) return <div>Contract not found</div>;

    const roleName = user.roleId ? user.roleId.name : null;
    const canApprove = contract.status === 'Pending' && roleName === 'Admin';
    const canReviewLegal = contract.status === 'Pending' && roleName === 'Legal Head';
    const canReviewFinancial = contract.status === 'Pending' && roleName === 'Financial Head';

    const isOwner = contract.createdBy._id === user._id || roleName === 'Admin';
    const canEditDelete = isOwner && (contract.status === 'Draft' || contract.status === 'Rejected');
    const canRenew = isOwner && (contract.status === 'Active' || contract.status === 'Expired');
    const hasSigned = contract.signatures?.some(s => s.userId === user._id);
    const canSign = contract.status === 'Active' && !hasSigned;

    // Determine Timeline Steps
    const steps = [
        { label: 'Drafted', active: true, success: true },
        { label: 'Pending Approval', active: contract.status === 'Pending' || contract.status === 'Active', success: contract.status === 'Active' },
        { label: 'Active', active: contract.status === 'Active', success: contract.status === 'Active' }
    ];

    const fileUrl = getFileUrl(contract.fileURL);
    const isPDF = contract.fileURL.toLowerCase().endsWith('.pdf');

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 500px' }}>
                    <div className="glass-card" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div>
                                <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>{contract.title}</h1>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span className={`status-badge status-${contract.status.replace(/\s+/g, '')}`}>
                                        {contract.status}
                                    </span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created by</div>
                                <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>{contract.createdBy?.name}</div>
                            </div>
                        </div>

                        {contract.status === 'Rejected' && contract.rejectionReason && (
                            <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginBottom: '2rem' }}>
                                <strong>Rejection Reason:</strong> {contract.rejectionReason}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                            <div>
                                <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.85rem' }}>Description</h4>
                                <p style={{ color: 'var(--text-main)', lineHeight: '1.6' }}>{contract.description || 'No description provided.'}</p>
                                
                                <h4 style={{ color: 'var(--text-muted)', marginTop: '1.5rem', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.85rem' }}>Documents</h4>
                                {contract.fileURL && (
                                    <div><a href={getFileUrl(contract.fileURL)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>Primary Document</a></div>
                                )}
                                {contract.legalDocuments && contract.legalDocuments.length > 0 && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <strong>Legal Docs:</strong>
                                        <ul style={{ margin: '0.2rem 0 0 1rem', padding: 0 }}>
                                            {contract.legalDocuments.map((doc, i) => (
                                                <li key={i}><a href={getFileUrl(doc)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>Legal Document {i + 1}</a></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {contract.financialDocuments && contract.financialDocuments.length > 0 && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <strong>Financial Docs:</strong>
                                        <ul style={{ margin: '0.2rem 0 0 1rem', padding: 0 }}>
                                            {contract.financialDocuments.map((doc, i) => (
                                                <li key={i}><a href={getFileUrl(doc)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>Financial Document {i + 1}</a></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.85rem' }}>Timeline</h4>
                                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(0,0,0,0.05)' }}>
                                    <p style={{ margin: '0 0 0.5rem 0' }}><strong>Start:</strong> {new Date(contract.startDate).toLocaleDateString()}</p>
                                    <p style={{ margin: 0 }}><strong>End:</strong> {new Date(contract.endDate).toLocaleDateString()}</p>
                                </div>

                                <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.85rem' }}>Department Reviews</h4>
                                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <strong>Legal Status:</strong> <span className={`status-badge status-${contract.legalStatus}`}>{contract.legalStatus}</span>
                                        {contract.legalReport && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Report: {contract.legalReport}</div>}
                                    </div>
                                    <div>
                                        <strong>Financial Status:</strong> <span className={`status-badge status-${contract.financialStatus}`}>{contract.financialStatus}</span>
                                        {contract.financialReport && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Report: {contract.financialReport}</div>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Signatures Section */}
                        {contract.signatures && contract.signatures.length > 0 && (
                            <div style={{ background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <h4 style={{ marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--success)' }}>Digital Signatures</h4>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {contract.signatures.map((sig, idx) => (
                                        <div key={idx} style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--success)', borderRight: '1px solid rgba(0,0,0,0.05)', borderTop: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <strong>Signed User ID: {sig.userId}</strong>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(sig.signedAt).toLocaleString()}</span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                                                Hash: {sig.digitalHash}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                IP: {sig.ipAddress}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2.5rem', border: '1px solid var(--border)' }}>
                            <h4 style={{ marginBottom: '1.5rem', textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lifecycle Progress</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '3rem' }}>
                                {/* Connecting line */}
                                <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '2px', background: 'rgba(0,0,0,0.1)', zIndex: 1 }}></div>
                                
                                {steps.map((step, idx) => (
                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                                        <div style={{ 
                                            width: '32px', height: '32px', borderRadius: '50%', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: step.success ? 'var(--success)' : (step.active ? 'var(--warning)' : 'var(--surface)'),
                                            border: `2px solid ${step.success ? 'var(--success)' : (step.active ? 'var(--warning)' : 'var(--border)')}`,
                                            color: step.success || step.active ? '#000' : 'var(--text-muted)',
                                            fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem',
                                            boxShadow: step.active && !step.success ? '0 0 10px rgba(245, 158, 11, 0.5)' : 'none'
                                        }}>
                                            {step.success ? '✓' : (idx + 1)}
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: step.active ? 'var(--text-main)' : 'var(--text-muted)', textAlign: 'center', maxWidth: '80px' }}>
                                            {step.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            
                            <AuditTrail contractId={contract._id} />
                        </div>

                        {showRenew && (
                            <div className="animate-slide-in" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                                <h4 style={{ marginBottom: '1rem', color: 'var(--success)' }}>Renew Contract</h4>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label">New End Date</label>
                                        <input 
                                            type="date" 
                                            className="form-input" 
                                            value={renewDate} 
                                            onChange={(e) => setRenewDate(e.target.value)} 
                                        />
                                    </div>
                                    <button onClick={handleRenew} className="btn btn-success">Confirm</button>
                                    <button onClick={() => setShowRenew(false)} className="btn btn-outline">Cancel</button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ border: 'none', background: 'rgba(0,0,0,0.05)' }}>
                                    &larr; Back
                                </button>
                                {isPDF && (
                                    <button onClick={() => setPreviewMode(!previewMode)} className="btn btn-primary" style={{ background: previewMode ? 'transparent' : '', border: previewMode ? '1px solid var(--primary)' : '' }}>
                                        {previewMode ? 'Close Preview' : 'Preview Document'}
                                    </button>
                                )}
                                {!isPDF && (
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                                        Download Document
                                    </a>
                                )}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                {canEditDelete && (
                                    <>
                                        <Link to={`/edit/${contract._id}`} className="btn btn-outline" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                                            Edit
                                        </Link>
                                        <button onClick={handleDelete} className="btn btn-danger">
                                            Delete
                                        </button>
                                    </>
                                )}
                                {canRenew && !showRenew && (
                                    <button onClick={() => setShowRenew(true)} className="btn btn-success">
                                        Renew
                                    </button>
                                )}
                                {canReviewLegal && (
                                    <>
                                        <button onClick={() => handleReview('Approved')} className="btn btn-success">
                                            Approve Legal
                                        </button>
                                        <button onClick={() => handleReview('Rejected')} className="btn btn-danger">
                                            Reject Legal
                                        </button>
                                    </>
                                )}
                                {canReviewFinancial && (
                                    <>
                                        <button onClick={() => handleReview('Approved')} className="btn btn-success">
                                            Approve Financial
                                        </button>
                                        <button onClick={() => handleReview('Rejected')} className="btn btn-danger">
                                            Reject Financial
                                        </button>
                                    </>
                                )}
                                {canApprove && (
                                    <>
                                        <button onClick={() => handleApproval('Active')} className="btn btn-success">
                                            Final Approve
                                        </button>
                                        <button onClick={() => handleApproval('Rejected')} className="btn btn-danger">
                                            Final Reject
                                        </button>
                                    </>
                                )}
                                {canSign && (
                                    <button onClick={handleSign} className="btn" style={{ background: '#3b82f6', color: 'white' }}>
                                        Sign Document
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* PDF Preview Pane */}
                {previewMode && isPDF && (
                    <div className="glass-card animate-slide-in" style={{ flex: '1 1 400px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.05)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Document Preview</h3>
                            <a href={fileUrl} download className="btn btn-outline" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>Download</a>
                        </div>
                        <div style={{ flex: 1, minHeight: '600px', background: '#333' }}>
                            <object data={fileUrl} type="application/pdf" width="100%" height="100%">
                                <p>Your browser does not support PDFs. <a href={fileUrl}>Download the PDF</a>.</p>
                            </object>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContractView;
