const express = require('express');
const User = require('../models/User'); // Correct path
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Get Dashboard Data
router.get('/dashboard', authenticateToken, isAdmin, async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).sort({ set: 1, currentScore: -1 });
        const totalStudents = students.length;
        // Format for old dashboard if needed, or just return list
        res.json({ results: students, leaderboard: students, totalStudents });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

const Quiz = require('../models/Quiz');

// Get All Users for Game Master
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find({ role: 'student' }).sort({ set: 1, currentScore: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Question Management Routes
router.get('/questions', authenticateToken, isAdmin, async (req, res) => {
    try {
        const questions = await Quiz.find().sort({ createdAt: -1 });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/questions', authenticateToken, isAdmin, async (req, res) => {
    try {
        const newQuestion = new Quiz(req.body);
        await newQuestion.save();
        res.json(newQuestion);
    } catch (error) {
        console.error('Error saving question:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.put('/questions/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const updatedQuestion = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedQuestion);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/questions/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await Quiz.findByIdAndDelete(req.params.id);
        res.json({ message: 'Question deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
