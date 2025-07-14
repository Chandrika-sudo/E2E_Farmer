const express = require('express');
const Farmer = require('../models/Farmer');

const router = express.Router();

// Dashboard endpoint
router.get('/:email', async (req, res) => {
    const email = req.params.email;

    try {
        const farmer = await Farmer.findOne({ email });
        if (!farmer) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            name: `${farmer.firstName} ${farmer.lastName}`,
            firstName: farmer.firstName,
            lastName: farmer.lastName,
            email: farmer.email,
            phoneNumber: farmer.phoneNumber,
            location: farmer.location,
            farmingExperience: farmer.farmingExperience,
            waterAvailability: farmer.waterAvailability,
            pastCrops: farmer.pastCrops,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching user data' });
    }
});

module.exports = router;