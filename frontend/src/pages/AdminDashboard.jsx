import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const socket = io('http://localhost:5000');

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const [students, setStudents] = useState([]);
    const [questionTest, setQuestionText] = useState('');
    const [question, setQuestion] = useState({ options: ['', '', '', ''], answer: '', timeLimit: 30, image: null });
    const [targetSet, setTargetSet] = useState(1);
    const [targetStatus, setTargetStatus] = useState('registered');
    const [activeQuestion, setActiveQuestion] = useState(null);
    const [liveAnswers, setLiveAnswers] = useState({});
    const quillRef = useRef(null);

    const [liveQuestion, setLiveQuestion] = useState(null);

    useEffect(() => {
        fetchStudents();
        socket.emit('adminJoin');

        socket.on('liveResponse', ({ userId, answer }) => {
            setLiveAnswers(prev => ({ ...prev, [userId]: answer }));
        });

        socket.on('statusUpdate', () => {
            fetchStudents();
        });

        socket.on('questionContent', (data) => {
            setLiveQuestion(data);
        });

        socket.on('gameReset', () => {
            setLiveQuestion(null);
            fetchStudents();
        });

        socket.on('tabSwitchUpdate', ({ userId, count }) => {
            fetchStudents();
            toast.warn(`⚠️ Alert: Student switched tabs! (Count: ${count})`, {
                position: "top-right",
                autoClose: 5000,
                theme: "dark",
            });
        });

        return () => {
            socket.off('liveResponse');
            socket.off('statusUpdate');
            socket.off('questionContent');
            socket.off('gameReset');
            socket.off('tabSwitchUpdate');
        };
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/users');
            setStudents(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // ... handlePromote, handleReset, handleRemove ...

    // Helper to filter students by tab
    const filteredStudents = students.filter(s => s.role === 'student' && s.set === targetSet);

    const handleRemove = (userId) => {
        if (window.confirm('Are you sure you want to disqualify this student?')) {
            socket.emit('admin:removeStudent', { userId });
            setTimeout(fetchStudents, 500);
        }
    };

    const handlePromote = (userIds, newStatus) => {
        socket.emit('admin:promoteUsers', { userIds, newStatus });
    };

    const handleReset = () => {
        if (window.confirm('Reset everything?')) {
            socket.emit('admin:resetGame');
            setTimeout(fetchStudents, 1000);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Game Master Console</h1>

            <div className="dashboard-grid">

                {/* Live Status Panel */}
                <div className="glass-panel" style={{ marginBottom: '1rem', borderTop: '4px solid var(--accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>🔴 Live Status</h3>
                        <button className="btn" onClick={() => window.open('/admin/questions', '_blank')} style={{ background: 'var(--primary)' }}>➕ Manage Questions</button>
                    </div>

                    {liveQuestion ? (
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Current Question (Set {liveQuestion.targetSet}):</div>
                            <div dangerouslySetInnerHTML={{ __html: liveQuestion.text }} style={{ fontSize: '1.2rem', fontWeight: 'bold' }} />
                            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Time Limit: {liveQuestion.timeLimit || 30}s | Ends at: {new Date(liveQuestion.endTime).toLocaleTimeString()}</div>
                        </div>
                    ) : (
                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No active question. Push one from the Question Manager.
                        </div>
                    )}
                </div>

                {/* Leaderboard / Student Management */}
                <div className="glass-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>🏆 Leaderboard (Set {targetSet})</h3>
                        <button className="btn" style={{ fontSize: '0.8rem', padding: '5px 10px', background: 'var(--danger)' }} onClick={handleReset}>Reset All</button>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                        <select className="input-field" value={targetSet} onChange={e => setTargetSet(parseInt(e.target.value))}>
                            <option value={1}>Set 1</option>
                            <option value={2}>Set 2</option>
                        </select>
                    </div>

                    <table className="leaderboard-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Status</th>
                                <th>Tabs</th>
                                <th>Score</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents
                                .sort((a, b) => (b.currentScore || 0) - (a.currentScore || 0))
                                .map(student => (
                                    <tr key={student._id}>
                                        <td>{student.name}</td>
                                        <td><span className={`status-badge status-${student.status}`}>{student.status}</span></td>
                                        <td style={{ color: (student.tabSwitches || 0) > 3 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                                            {student.tabSwitches || 0}
                                        </td>
                                        <td>{student.currentScore || 0}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                {student.status === 'registered' && (
                                                    <button className="btn" style={{ fontSize: '0.7rem', padding: '2px 5px' }} onClick={() => handlePromote([student._id], 'round1_qualified')}>Promote</button>
                                                )}
                                                {student.status === 'round1_qualified' && (
                                                    <button className="btn" style={{ fontSize: '0.7rem', padding: '2px 5px' }} onClick={() => handlePromote([student._id], 'phase1_qualified')}>P2</button>
                                                )}
                                                {student.status === 'phase1_qualified' && (
                                                    <button className="btn" style={{ fontSize: '0.7rem', padding: '2px 5px', background: 'gold', color: 'black' }} onClick={() => handlePromote([student._id], 'winner')}>WIN</button>
                                                )}
                                                <button className="btn" style={{ fontSize: '0.7rem', padding: '2px 5px', background: 'var(--danger)' }} onClick={() => handleRemove(student._id)}>❌</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
