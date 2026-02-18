const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = 'yuvanaveen7845@gmail.com';
        const user = await User.findOne({ email });

        if (user) {
            const hashedPassword = await bcrypt.hash('123456', 10);
            user.password = hashedPassword;
            await user.save();
            console.log(`Password for ${email} reset to 123456`);
        } else {
            console.log('User not found');
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetPassword();
