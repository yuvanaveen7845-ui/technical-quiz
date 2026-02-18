const express = require('express');
const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        const quizzes = await Quiz.find({}, '-correctAnswer'); // Exclude correct answer
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/submit', authenticateToken, async (req, res) => {
    const { answers } = req.body; // Expect { questionId: "selectedOption" }
    const student = req.user;

    try {
        const quizzes = await Quiz.find({});
        let score = 0;

        quizzes.forEach((quiz) => {
            if (answers[quiz._id] === quiz.correctAnswer) {
                score++;
            }
        });

        const newResult = new Result({
            studentId: student.id,
            name: student.name,
            email: student.email,
            score,
            totalQuestions: quizzes.length,
            submittedAt: new Date()
        });

        await newResult.save();

        // Real-time update via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.emit('scoreUpdate', {
                studentId: student.id,
                name: student.name,
                email: student.email,
                score,
                totalQuestions: quizzes.length
            });
        }

        res.json({ score, totalQuestions: quizzes.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
