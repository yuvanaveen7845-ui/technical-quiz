const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body; // Removed set
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: 'student'
        });
        await newUser.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password, set } = req.body; // Accept set on login
    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`Login failed: User not found for email ${email}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`Login failed: Password mismatch for user ${email}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Update Set if provided and user is student
        if (user.role === 'student' && set) {
            user.set = set;
            await user.save();
        }

        const token = jwt.sign({ id: user._id, role: user.role, name: user.name, email: user.email, set: user.set, status: user.status }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { _id: user._id, name: user.name, role: user.role, email: user.email, set: user.set, status: user.status } });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
