const express = require('express');
const bcrypt = require('bcrypt');
const Farmer = require('../models/Farmer');

const router = express.Router();

// Register endpoint
router.post('/register', async (req, res) => {
    const { firstName, lastName, email, phoneNumber, location, farmingExperience, waterAvailability, pastCrops, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newFarmer = new Farmer({
            firstName,
            lastName,
            email,
            phoneNumber,
            location,
            farmingExperience,
            waterAvailability,
            pastCrops,
            password: hashedPassword,
        });

        await newFarmer.save();
        res.status(200).json({ success: true, message: 'User registered successfully', email });
    } catch (err) {
        if (err.code === 11000) { // Duplicate email error
            res.status(400).json({ success: false, message: 'Email already exists' });
        } else {
            res.status(500).json({ success: false, message: 'Error registering user' });
        }
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const farmer = await Farmer.findOne({ email });
        if (!farmer) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, farmer.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        res.status(200).json({ success: true, message: 'Login successful', email: farmer.email });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error logging in' });
    }
});

module.exports = router;