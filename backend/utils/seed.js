const mongoose = require('mongoose');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const bcrypt = require('bcryptjs');

const seedAdmins = async () => {
    const admin1Email = 'kit28.24bad188@gmail.com';
    const admin2Email = 'kit28.24bad133@gmail.com';
    const admin1Pass = 'yuva2503';
    const admin2Pass = 'sam0820';

    const existingAdmin1 = await User.findOne({ email: admin1Email });
    if (!existingAdmin1) {
        const hashedPassword = await bcrypt.hash(admin1Pass, 10);
        await new User({ name: 'Admin One', email: admin1Email, password: hashedPassword, role: 'admin' }).save();
        console.log('seeded admin 1');
    }

    const existingAdmin2 = await User.findOne({ email: admin2Email });
    if (!existingAdmin2) {
        const hashedPassword = await bcrypt.hash(admin2Pass, 10);
        await new User({ name: 'Admin Two', email: admin2Email, password: hashedPassword, role: 'admin' }).save();
        console.log('seeded admin 2');
    }
};

const seedQuizzes = async () => {
    const count = await Quiz.countDocuments();
    if (count > 0) return;

    const quizzes = [
        {
            question: "Which of the following is not a built-in module in Node.js?",
            options: ["fs", "http", "mysql", "path"],
            correctAnswer: "mysql"
        },
        {
            question: "What does the 'M' in MERN stack stand for?",
            options: ["MySQL", "MongoDB", "MariaDB", "Memcached"],
            correctAnswer: "MongoDB"
        },
        {
            question: "Which method is used to insert a document into a MongoDB collection?",
            options: ["insertOne()", "add()", "put()", "store()"],
            correctAnswer: "insertOne()"
        },
        {
            question: "In React, what hook is used to manage state in functional components?",
            options: ["useEffect", "useReducer", "useState", "useContext"],
            correctAnswer: "useState"
        },
        {
            question: "What is the purpose of Express.js?",
            options: ["Database Management", "Frontend Framework", "Backend Web Application Framework", "Testing Library"],
            correctAnswer: "Backend Web Application Framework"
        },
        {
            question: "Which command installs a package globally in npm?",
            options: ["npm install -g", "npm global install", "npm add -g", "npm save -g"],
            correctAnswer: "npm install -g"
        },
        {
            question: "What is JSX?",
            options: ["Java XML", "JavaScript XML", "JSON XML", "Java Syntax Extension"],
            correctAnswer: "JavaScript XML"
        },
        {
            question: "Which HTTP method is typically used to update a resource?",
            options: ["GET", "POST", "PUT", "DELETE"],
            correctAnswer: "PUT"
        },
        {
            question: "What is the default port for MongoDB?",
            options: ["3306", "5432", "27017", "8080"],
            correctAnswer: "27017"
        },
        {
            question: "Which function is used to serialize an object into a JSON string in JavaScript?",
            options: ["JSON.parse()", "JSON.stringify()", "JSON.object()", "JSON.toText()"],
            correctAnswer: "JSON.stringify()"
        }
    ];

    await Quiz.insertMany(quizzes);
    console.log('Seeded Quizzes');
};


module.exports = { seedAdmins, seedQuizzes };
