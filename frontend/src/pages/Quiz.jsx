import { useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';
import API_URL from '../config';

const socket = io(API_URL, {
    transports: ['polling'],
    withCredentials: true
});

const Quiz = () => {
    const { user } = useContext(AuthContext);
    const [quizQueue, setQuizQueue] = useState([]); // Array of questions
    const [currentIndex, setCurrentIndex] = useState(0); // Current question index
    const [timeLeft, setTimeLeft] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Waiting for the host to start...');

    // Derived current question
    const currentQuestion = quizQueue.length > 0 ? quizQueue[currentIndex] : null;

    useEffect(() => {
        if (!currentQuestion || submitted || quizCompleted) return;

        // Reset timer when question changes
        setTimeLeft(currentQuestion.timeLimit || 30);

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleSubmit(null, true); // Auto-submit on timeout
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [currentIndex, quizQueue, submitted, quizCompleted]);

    useEffect(() => {
        if (user) {
            socket.emit('joinGame', { userId: user._id || user.id });
        }

        const handleVisibilityChange = () => {
            if (document.hidden && user) {
                socket.emit('reportTabSwitch', { userId: user._id || user.id });
                toast.warning("⚠ Warning: Tab switching detected! Reporting to Admin...", {
                    position: "top-center",
                    autoClose: 3000,
                    theme: "colored"
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Batch Start Listener
        socket.on('quizBatchStart', (data) => {
            const mySet = user.set || 1;
            const myStatus = user.status || 'registered';
            const targetSet = data.targetSet || 1;
            const targetStatus = data.targetStatus || 'registered';

            const isSetMatch = (targetSet === 'all') || (targetSet === mySet);
            const isStatusMatch = (targetStatus === 'registered') || (targetStatus === myStatus);

            if (isSetMatch && isStatusMatch && data.questions && data.questions.length > 0) {
                console.log("Quiz Started with questions:", data.questions);
                setQuizQueue(data.questions);
                setCurrentIndex(0);
                setQuizCompleted(false);
                setSubmitted(false);
                setStatusMessage('');
                setSelectedOption(null);
            } else {
                if (!quizQueue.length) setStatusMessage('Round in progress for other group...');
            }
        });

        // Listen for removal event
        socket.on('studentRemoved', ({ userId }) => {
            if (user && (user._id === userId || user.id === userId)) {
                alert("🚫 You have been disqualified/removed by the Game Master.");
                window.location.href = '/login';
            }
        });

        // Listen for tab switch confirmation/warning from server
        socket.on('tabSwitchWarning', ({ count }) => {
            // Only show if not already shown by the local trigger? 
            // Actually, showing the count from server is good.
            toast.error(`⚠ Tab Switch Recorded! Total Violations: ${count}`, {
                position: "top-center",
                autoClose: 5000,
                theme: "colored"
            });
        });

        // Handle Game Reset
        socket.on('gameReset', () => {
            // Reset everything
            setQuizQueue([]);
            setCurrentIndex(0);
            setQuizCompleted(false);
            setStatusMessage('Game reset by Admin.');
        });

        return () => {
            socket.off('quizBatchStart');
            socket.off('studentRemoved');
            socket.off('gameReset');
            socket.off('tabSwitchWarning');
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user]);

    // Disable copy/context menu
    useEffect(() => {
        const preventCopy = (e) => e.preventDefault();
        document.addEventListener('contextmenu', preventCopy);
        document.addEventListener('copy', preventCopy);
        document.addEventListener('cut', preventCopy);
        return () => {
            document.removeEventListener('contextmenu', preventCopy);
            document.removeEventListener('copy', preventCopy);
            document.removeEventListener('cut', preventCopy);
        }
    }, []);

    const handleSubmit = (option, isTimeout = false) => {
        if (submitted) return;
        setSubmitted(true);
        setSelectedOption(option);

        // Send Answer with Question ID
        if (currentQuestion) {
            socket.emit('submitAnswerBatch', {
                userId: user._id || user.id,
                questionId: currentQuestion._id,
                answer: option
            });
        }

        // Auto move to next after delay
        setTimeout(() => {
            handleNext();
        }, 1000);
    };

    const handleNext = () => {
        if (currentIndex < quizQueue.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSubmitted(false);
            setSelectedOption(null);
        } else {
            setQuizCompleted(true);
            setQuizQueue([]);
        }
    };

    if (quizCompleted) {
        return (
            <div className="glass-panel" style={{ textAlign: 'center', marginTop: '2rem' }}>
                <h2>🎉 Quiz Completed!</h2>
                <p>You have finished all questions.</p>
                <p>Wait for the results on the main screen.</p>
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="glass-panel" style={{ textAlign: 'center', marginTop: '2rem' }}>
                <h2>🔴 Live Quiz Lobby</h2>
                <div style={{ margin: '2rem 0' }}>
                    <p style={{ fontSize: '1.2rem' }}>Status: <span className="status-badge" style={{ background: 'var(--primary)' }}>{user?.status || 'Active'}</span></p>
                    <p style={{ fontSize: '1.2rem' }}>Set: <strong style={{ color: 'var(--accent)' }}>{user?.set || 1}</strong></p>
                    <div style={{ marginTop: '2rem' }} className="loader"></div>
                    <p style={{ color: 'var(--text-muted)' }}>{statusMessage}</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '1rem' }}>Waiting for Batch Start...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Question {currentIndex + 1} of {quizQueue.length}</h3>
                <span className={timeLeft < 10 ? 'timer-low' : ''} style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    ⏱ {timeLeft}s
                </span>
            </div>

            <div style={{ fontSize: '1.4rem', marginBottom: '2rem', textAlign: 'left', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: currentQuestion.question }}></div>

            {currentQuestion.image && (
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src={currentQuestion.image} alt="Question" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {currentQuestion.options.map((opt, idx) => (
                    <button
                        key={idx}
                        className={`quiz-option ${selectedOption === opt ? 'selected' : ''}`}
                        onClick={() => {
                            if (!submitted) {
                                handleSubmit(opt);
                            }
                        }}
                        disabled={submitted}
                    >
                        {opt}
                    </button>
                ))}
            </div>
            {submitted && <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)' }}>Saving Answer...</p>}
        </div>
    );
};

export default Quiz;
