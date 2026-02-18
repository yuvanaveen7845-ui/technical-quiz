const mongoose = require('mongoose');
const Quiz = require('./models/Quiz');
const User = require('./models/User');
require('dotenv').config();

const runVerification = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Cleanup old test data
        await Quiz.deleteMany({ question: /VERIFY_PHASE/ });
        await User.deleteMany({ email: /verify_phase/ });

        // 2. Create Questions for Phase 1 and Phase 2
        const q1 = await Quiz.create({
            question: 'VERIFY_PHASE_1_Q',
            options: ['A', 'B'],
            correctAnswer: 'A',
            targetSet: 1,
            targetStatus: 'round1_qualified' // Round 2 Phase 1
        });

        const q2 = await Quiz.create({
            question: 'VERIFY_PHASE_2_Q',
            options: ['C', 'D'],
            correctAnswer: 'C',
            targetSet: 1,
            targetStatus: 'phase1_qualified' // Round 2 Phase 2
        });

        console.log('Created Questions:', {
            q1: { id: q1._id, target: q1.targetStatus },
            q2: { id: q2._id, target: q2.targetStatus }
        });

        // 3. Verify Query Logic (Simulating Admin Push)

        // Simulating push for Phase 1
        console.log('\n--- Testing Push for Round 2 Phase 1 ---');
        const batch1 = await Quiz.find({
            targetSet: 1,
            targetStatus: 'round1_qualified'
        }).lean();

        const phase1Ids = batch1.map(q => q._id.toString());
        console.log('Batch 1 Questions Found:', phase1Ids.length);
        if (phase1Ids.includes(q1._id.toString()) && !phase1Ids.includes(q2._id.toString())) {
            console.log('✅ SUCCESS: Only Phase 1 questions selected.');
        } else {
            console.log('❌ FAILURE: Incorrect questions selected for Phase 1.');
        }

        // Simulating push for Phase 2
        console.log('\n--- Testing Push for Round 2 Phase 2 ---');
        const batch2 = await Quiz.find({
            targetSet: 1,
            targetStatus: 'phase1_qualified'
        }).lean();

        const phase2Ids = batch2.map(q => q._id.toString());
        console.log('Batch 2 Questions Found:', phase2Ids.length);
        if (phase2Ids.includes(q2._id.toString()) && !phase2Ids.includes(q1._id.toString())) {
            console.log('✅ SUCCESS: Only Phase 2 questions selected.');
        } else {
            console.log('❌ FAILURE: Incorrect questions selected for Phase 2.');
        }

        // Cleanup
        await Quiz.deleteMany({ question: /VERIFY_PHASE/ });
        await User.deleteMany({ email: /verify_phase/ });
        console.log('\nCleanup Done. Verification Complete.');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

runVerification();
