import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const socket = io('http://localhost:5000');

const QuestionManager = () => {
    const { user } = useContext(AuthContext);
    const [questions, setQuestions] = useState([]);
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [questionContent, setQuestionContent] = useState('');
    const [questionData, setQuestionData] = useState({
        options: ['', '', '', ''],
        answer: '',
        timeLimit: 30,
        image: '',
        targetSet: 1,
        targetStatus: 'registered'
    });

    const [activeQuestion, setActiveQuestion] = useState(null);
    const [liveAnswers, setLiveAnswers] = useState({});
    const [studentCount, setStudentCount] = useState(0);

    useEffect(() => {
        socket.emit('adminJoin');
        fetchQuestions();
        fetchStudentCount();

        socket.on('liveResponse', ({ userId, answer }) => {
            setLiveAnswers(prev => ({ ...prev, [userId]: answer }));
        });

        socket.on('tabSwitchUpdate', ({ userId, name, count }) => {
            const studentName = name || userId;
            toast.warn(`⚠️ Alert: ${studentName} switched tabs! (Count: ${count})`, {
                position: "top-right",
                autoClose: 5000,
                theme: "dark",
            });
        });

        return () => {
            socket.off('liveResponse');
            socket.off('tabSwitchUpdate');
        };
    }, []);

    const fetchQuestions = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/questions', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setQuestions(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to fetch questions");
        }
    };

    const fetchStudentCount = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/users', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            // Approximate count for now, logic can be improved
            setStudentCount(res.data.length);
        } catch (err) { }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await axios.post('http://localhost:5000/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setQuestionData({ ...questionData, image: res.data.url });
            toast.success("Image uploaded");
        } catch (err) {
            toast.error("Upload failed");
        }
    };

    const handleSave = async () => {
        if (!questionContent || !questionData.answer) {
            toast.error("Question and Answer are required");
            return;
        }

        const payload = {
            question: questionContent,
            correctAnswer: questionData.answer, // Map frontend 'answer' to backend 'correctAnswer'
            options: questionData.options,
            timeLimit: questionData.timeLimit,
            image: questionData.image,
            targetSet: questionData.targetSet,
            targetStatus: questionData.targetStatus
        };

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            if (editingId) {
                await axios.put(`http://localhost:5000/api/admin/questions/${editingId}`, payload, config);
                toast.success("Question Updated");
            } else {
                await axios.post('http://localhost:5000/api/admin/questions', payload, config);
                toast.success("Question Added");
            }
            fetchQuestions();
            handleClear();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save");
        }
    };

    const handleEdit = (q) => {
        setEditingId(q._id);
        setQuestionContent(q.question);
        setQuestionData({
            options: q.options,
            answer: q.correctAnswer,
            timeLimit: q.timeLimit,
            image: q.image || '',
            targetSet: q.targetSet,
            targetStatus: q.targetStatus
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this question?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/admin/questions/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            toast.success("Deleted");
            fetchQuestions();
        } catch (err) {
            toast.error("Delete failed");
        }
    };

    const handleClear = () => {
        setEditingId(null);
        setQuestionContent('');
        setQuestionData({
            options: ['', '', '', ''],
            answer: '',
            timeLimit: 30,
            image: '',
            targetSet: 1,
            targetStatus: 'registered'
        });
    };

    const handlePush = (q = null) => {
        // If q is passed, push that. If not, push current form (must be saved first ideally, but we can allow "Draft" push)
        // Let's enforce pushing from the form state ensures what you see is what you push.

        const dataToPush = {
            text: questionContent,
            options: questionData.options,
            answer: questionData.answer,
            timeLimit: questionData.timeLimit,
            targetSet: questionData.targetSet,
            targetStatus: questionData.targetStatus,
            image: questionData.image
        };

        // If pushing from saved list, use that data
        if (q) {
            dataToPush.text = q.question;
            dataToPush.options = q.options;
            dataToPush.answer = q.correctAnswer;
            dataToPush.timeLimit = q.timeLimit;
            dataToPush.targetSet = q.targetSet;
            dataToPush.targetStatus = q.targetStatus;
            dataToPush.image = q.image;
        }

        socket.emit('admin:pushQuestion', dataToPush);
        setActiveQuestion(dataToPush);
        setLiveAnswers({});
        toast.info("🚀 Question Pushed Live!");
    };

    const handleCloseQuestion = () => {
        socket.emit('admin:closeQuestion');
        setActiveQuestion(null);
        toast.info("Question Closed");
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '2rem auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

            {/* Left Column: Form */}
            <div className="glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3>{editingId ? '✏️ Edit Question' : '➕ Add New Question'}</h3>
                    <button className="btn" onClick={handleClear} style={{ background: '#64748b' }}>Clear</button>
                </div>

                <div style={{ display: 'grid', gap: '10px' }}>
                    <label>Question Content:</label>
                    <ReactQuill theme="snow" value={questionContent} onChange={setQuestionContent} style={{ background: 'white', color: 'black', borderRadius: '8px' }} />

                    <label>Upload Image:</label>
                    <input type="file" onChange={handleImageUpload} className="input-field" accept="image/*" />
                    {questionData.image && <img src={questionData.image} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px' }} />}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {questionData.options.map((opt, idx) => (
                            <input key={idx} className="input-field" placeholder={`Option ${idx + 1}`} value={opt} onChange={e => {
                                const newOpts = [...questionData.options];
                                newOpts[idx] = e.target.value;
                                setQuestionData({ ...questionData, options: newOpts });
                            }} />
                        ))}
                    </div>

                    <input className="input-field" placeholder="Correct Answer (Exact Match)" value={questionData.answer} onChange={e => setQuestionData({ ...questionData, answer: e.target.value })} />

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select className="input-field" value={questionData.targetSet} onChange={e => setQuestionData({ ...questionData, targetSet: parseInt(e.target.value) })}>
                            <option value={1}>Set 1</option>
                            <option value={2}>Set 2</option>
                        </select>
                        <select className="input-field" value={questionData.targetStatus} onChange={e => setQuestionData({ ...questionData, targetStatus: e.target.value })}>
                            <option value="registered">Round 1</option>
                            <option value="round1_qualified">Round 2 (P1)</option>
                            <option value="phase1_qualified">Round 2 (P2)</option>
                        </select>
                        <input className="input-field" type="number" value={questionData.timeLimit} onChange={e => setQuestionData({ ...questionData, timeLimit: parseInt(e.target.value) })} style={{ width: '80px' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                        <button className="btn" onClick={handleSave} style={{ flex: 1 }}>{editingId ? 'Update Question' : 'Save Question to Bank'}</button>
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1rem', background: '#334155', borderRadius: '8px', border: '1px solid var(--accent)' }}>
                        <h4>🔥 Batch Control (Full Set)</h4>
                        <p style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                            Start the quiz for all students in <strong>Set {questionData.targetSet}</strong> ({questionData.targetStatus}).
                            <br />
                            <span style={{ color: 'gold' }}>
                                {questions.filter(q => q.targetSet === questionData.targetSet && q.targetStatus === questionData.targetStatus).length} Questions Ready
                            </span>
                        </p>
                        <button className="btn" onClick={() => {
                            socket.emit('admin:startQuizBatch', {
                                targetSet: questionData.targetSet,
                                targetStatus: questionData.targetStatus
                            });
                            toast.success(`Started Batch Quiz for Set ${questionData.targetSet}!`);
                        }} style={{ width: '100%', marginTop: '10px', background: 'linear-gradient(45deg, #FF512F 0%, #DD2476 100%)', fontWeight: 'bold' }}>
                            🏁 START FULL QUIZ (Set {questionData.targetSet})
                        </button>
                    </div>
                </div>

                {activeQuestion && (
                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0,255,100,0.1)', border: '1px solid var(--success)', borderRadius: '8px' }}>
                        <h4>🔴 Live Now</h4>
                        <p>Responses: {Object.keys(liveAnswers).length}</p>
                        <button className="btn" onClick={handleCloseQuestion} style={{ background: 'var(--danger)', width: '100%' }}>Stop Question</button>
                    </div>
                )}
            </div>

            {/* Right Column: List */}
            <div className="glass-panel">
                <h3>📚 Question Bank ({questions.length})</h3>
                <div style={{ maxHeight: '70vh', overflowY: 'auto', display: 'grid', gap: '1rem' }}>
                    {questions.map(q => (
                        <div key={q._id} className="glass-panel" style={{ padding: '1rem', borderLeft: `4px solid ${q.targetSet === 1 ? 'var(--primary)' : 'var(--secondary)'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="status-badge">Set {q.targetSet}</span>
                                <span className="status-badge" style={{ background: '#334155' }}>{q.timeLimit}s</span>
                            </div>
                            <div dangerouslySetInnerHTML={{ __html: q.question }} style={{ margin: '0.5rem 0', fontSize: '0.9rem' }} />
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ans: {q.correctAnswer}</div>

                            <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                                {/* Single Push Removed to favor Batch Mode */}
                                {/* <button className="btn" style={{ fontSize: '0.8rem', padding: '5px' }} onClick={() => handlePush(q)}>🚀 Push</button> */}
                                <button className="btn" style={{ fontSize: '0.8rem', padding: '5px', background: '#3b82f6' }} onClick={() => handleEdit(q)}>✏️ Edit</button>
                                <button className="btn" style={{ fontSize: '0.8rem', padding: '5px', background: 'var(--danger)' }} onClick={() => handleDelete(q._id)}>🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuestionManager;
