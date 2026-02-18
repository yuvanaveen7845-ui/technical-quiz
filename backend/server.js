const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const { seedAdmins } = require('./utils/seed');
const User = require('./models/User');
const Quiz = require('./models/Quiz');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set('io', io);
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Serve static files

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', uploadRoutes);

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected');
        seedAdmins();
    })
    .catch(err => console.log(err));

// --- GAME CONTROLLER LOGIC ---

let activeQuestion = null; // { id, text, options, answer, timeLimit, startedAt, targetSet, targetStatus }
let activeRound = null; // 'round1', 'phase1', 'phase2'

const getQualifiedStudents = async (set, count) => {
    return await User.find({ set, role: 'student', status: { $ne: 'eliminated' } })
        .sort({ currentScore: -1 })
        .limit(count);
};

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Identify user on connection if possible, or wait for 'join' event
    socket.on('joinGame', async ({ userId }) => {
        try {
            const user = await User.findById(userId);
            if (user) {
                socket.join(`set-${user.set}`);
                socket.join(`status-${user.status}`);
                socket.join(userId.toString()); // Join personal room
                socket.user = user;

                // Send current state
                if (activeQuestion) {
                    // Check if user is in target group
                    const isTargetSet = activeQuestion.targetSet === 'all' || activeQuestion.targetSet === user.set;
                    const isTargetStatus = activeQuestion.targetStatus === 'all' || activeQuestion.targetStatus === user.status;

                    if (isTargetSet && isTargetStatus) {
                        socket.emit('questionContent', {
                            text: activeQuestion.text,
                            options: activeQuestion.options,
                            endTime: activeQuestion.endTime, // Send end time
                            image: activeQuestion.image
                        });
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
    });

    socket.on('adminJoin', () => {
        socket.join('admin-room');
        socket.emit('gameState', { activeQuestion, activeRound });
    });

    // Admin Actions
    socket.on('admin:startQuizBatch', async ({ targetSet, targetStatus }) => {
        try {
            const questions = await Quiz.find({
                targetSet: parseInt(targetSet),
                targetStatus: targetStatus
            }).lean();

            if (questions.length === 0) return;

            io.emit('quizBatchStart', {
                questions: questions,
                targetSet: parseInt(targetSet),
                targetStatus
            });

        } catch (e) {
            console.error(e);
        }
    });

    socket.on('admin:pushQuestion', (data) => {
        const timeLimit = parseInt(data.timeLimit) || 30;
        const startedAt = Date.now();
        const endTime = startedAt + (timeLimit * 1000);

        activeQuestion = {
            ...data,
            timeLimit,
            startedAt,
            endTime,
            answers: {}
        };

        io.emit('questionContent', {
            text: data.text,
            options: data.options,
            endTime: endTime, // Send absolute end time
            targetSet: data.targetSet,
            targetStatus: data.targetStatus,
            image: data.image
        });
    });

    socket.on('admin:closeQuestion', async () => {
        if (!activeQuestion) return;

        // Calculate scores and save to DB
        const correctAnswers = [];
        const answerMap = activeQuestion.answers;

        for (const [userId, answer] of Object.entries(answerMap)) {
            if (answer === activeQuestion.answer) {
                correctAnswers.push(userId);
                // Increment score in DB
                await User.findByIdAndUpdate(userId, { $inc: { currentScore: 1 } });
            }
        }

        // Show correct answer to students
        io.emit('questionResult', {
            correctAnswer: activeQuestion.answer,
            winners: correctAnswers
        });

        activeQuestion = null;
    });

    // Batch Answer Handler
    socket.on('submitAnswerBatch', async ({ userId, questionId, answer }) => {
        try {
            const question = await Quiz.findById(questionId);
            if (question && question.correctAnswer === answer) {
                await User.findByIdAndUpdate(userId, { $inc: { currentScore: 1 } });
                // Notify admin to refresh leaderboard more frequently
                io.to('admin-room').emit('statusUpdate');
            }
            io.to('admin-room').emit('liveResponse', { userId, answer });
        } catch (e) {
            console.error(e);
        }
    });

    socket.on('submitAnswer', async ({ userId, answer }) => {
        if (activeQuestion && !activeQuestion.answers[userId]) {
            activeQuestion.answers[userId] = answer;
            io.to('admin-room').emit('liveResponse', { userId, answer });
        }
    });

    // Admin: Change Round / Promote Users
    socket.on('admin:promoteUsers', async ({ userIds, newStatus }) => {
        await User.updateMany({ _id: { $in: userIds } }, { status: newStatus, currentScore: 0 });
        io.emit('statusUpdate'); // Tell clients to refresh status/re-join rooms
    });

    socket.on('admin:resetGame', async () => {
        await User.updateMany({ role: 'student' }, { status: 'registered', currentScore: 0 });
        activeQuestion = null;
        io.emit('gameReset');
    });

    socket.on('reportTabSwitch', async ({ userId }) => {
        try {
            const user = await User.findByIdAndUpdate(userId, { $inc: { tabSwitches: 1 } }, { new: true });
            // Notify Admin
            io.to('admin-room').emit('tabSwitchUpdate', { userId, name: user.name, count: user.tabSwitches });
            // Warn Student
            io.to(userId).emit('tabSwitchWarning', { count: user.tabSwitches });
        } catch (e) {
            console.error('Error updating tab switches:', e);
        }
    });

    socket.on('admin:removeStudent', async ({ userId }) => {
        try {
            await User.findByIdAndDelete(userId);
            io.emit('studentRemoved', { userId }); // Notify everyone to refresh
        } catch (e) {
            console.error('Error removing student:', e);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
