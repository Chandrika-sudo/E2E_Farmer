const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    location: { type: String, required: true },
    farmingExperience: { type: Number, required: true },
    waterAvailability: { type: String, required: true },
    pastCrops: { type: String, required: true },
    password: { type: String, required: true },
});

module.exports = mongoose.model('Farmer', farmerSchema);