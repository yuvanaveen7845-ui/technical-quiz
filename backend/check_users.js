const mongoose = require('mongoose');
require('dotenv').config();

const testAuth = async () => {
    try {
        const testUser = {
            name: 'Test User',
            email: `test${Date.now()}@example.com`,
            password: 'password123'
        };

        console.log('Registering...', testUser);
        const regRes = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        const regData = await regRes.json();
        console.log('Registration:', regData);

        if (!regRes.ok) throw new Error(JSON.stringify(regData));

        console.log('Logging in...');
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password,
                set: 1
            })
        });
        const loginData = await loginRes.json();
        console.log('Login Response:', loginData);

    } catch (e) {
        console.error('Error:', e);
    }
};

testAuth();
