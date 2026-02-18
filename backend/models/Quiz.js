const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    timeLimit: { type: Number, default: 30 },
    image: { type: String },
    targetSet: { type: Number, default: 1 },
    targetStatus: { type: String, default: 'registered' }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', QuizSchema);
