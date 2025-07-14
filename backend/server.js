const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

// Load environment variables
dotenv.config();

// Validate environment variables
if (!process.env.MONGO_URI) {
    console.error("❌ ERROR: MONGO_URI is missing in .env file!");
    process.exit(1);
}

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Rate limiting to prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
app.use(limiter);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    });

// Farmer Schema
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

const Farmer = mongoose.model("Farmer", farmerSchema);

// Item Schema
const itemSchema = new mongoose.Schema({
    email: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    description: { type: String, default: "" }
});

const Item = mongoose.model("Item", itemSchema);

// **Register Endpoint**
app.post("/register", async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, location, farmingExperience, waterAvailability, pastCrops, password } = req.body;

        // Ensure all fields are provided
        if (!firstName || !lastName || !email || !phoneNumber || !location || !farmingExperience || !waterAvailability || !pastCrops || !password) {
            return res.status(400).json({ success: false, message: "All fields are required!" });
        }

        // Check if user already exists
        const existingFarmer = await Farmer.findOne({ email });
        if (existingFarmer) {
            return res.status(400).json({ success: false, message: "Email already exists!" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newFarmer = new Farmer({ firstName, lastName, email, phoneNumber, location, farmingExperience, waterAvailability, pastCrops, password: hashedPassword });
        await newFarmer.save();

        res.status(201).json({ success: true, message: "User registered successfully", email });
    } catch (err) {
        console.error("❌ Error during registration:", err.message);
        res.status(500).json({ success: false, message: "Error registering user" });
    }
});

// **Login Endpoint**
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const farmer = await Farmer.findOne({ email });
        if (!farmer) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const isPasswordValid = await bcrypt.compare(password, farmer.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        res.status(200).json({ success: true, message: "Login successful", email: farmer.email });
    } catch (err) {
        console.error("❌ Error during login:", err.message);
        res.status(500).json({ success: false, message: "Error logging in" });
    }
});

// **Dashboard Endpoint**
app.get("/dashboard/:email", async (req, res) => {
    try {
        const farmer = await Farmer.findOne({ email: req.params.email });
        if (!farmer) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            name: `${farmer.firstName} ${farmer.lastName}`,
            ...farmer._doc
        });
    } catch (err) {
        console.error("❌ Error fetching user data:", err.message);
        res.status(500).json({ success: false, message: "Error fetching user data" });
    }
});

// **Add Items Endpoint**
app.post("/items", async (req, res) => {
    try {
        const { email, items } = req.body;

        // Save each item to the database
        const savedItems = await Item.insertMany(items.map(item => ({
            email,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            description: item.description || ""
        })));

        res.status(201).json({ success: true, message: "Items added successfully", items: savedItems });
    } catch (err) {
        console.error("❌ Error adding items:", err.message);
        res.status(500).json({ success: false, message: "Error adding items" });
    }
});

// **Get Items Endpoint**
app.get("/items/:email", async (req, res) => {
    try {
        const items = await Item.find({ email: req.params.email });
        res.status(200).json(items);
    } catch (err) {
        console.error("❌ Error fetching items:", err.message);
        res.status(500).json({ success: false, message: "Error fetching items" });
    }
});

// **Update Item Endpoint**
app.put("/items/:id", async (req, res) => {
    try {
        const { name, quantity, price, description } = req.body;
        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id, 
            { name, quantity, price, description: description || "" }, 
            { new: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }

        res.status(200).json({ success: true, message: "Item updated successfully", item: updatedItem });
    } catch (err) {
        console.error("❌ Error updating item:", err.message);
        res.status(500).json({ success: false, message: "Error updating item" });
    }
});

// **Delete Item Endpoint**
app.delete("/items/:id", async (req, res) => {
    try {
        const deletedItem = await Item.findByIdAndDelete(req.params.id);

        if (!deletedItem) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }

        res.status(200).json({ success: true, message: "Item deleted successfully" });
    } catch (err) {
        console.error("❌ Error deleting item:", err.message);
        res.status(500).json({ success: false, message: "Error deleting item" });
    }
});

// **Update Farmer Profile Endpoint**
app.put("/farmers/:email", async (req, res) => {
    try {
        const { location, farmingExperience, waterAvailability, pastCrops } = req.body;
        
        const updatedFarmer = await Farmer.findOneAndUpdate(
            { email: req.params.email },
            { 
                location,
                farmingExperience,
                waterAvailability,
                pastCrops
            },
            { new: true }
        );

        if (!updatedFarmer) {
            return res.status(404).json({ success: false, message: "Farmer not found" });
        }

        res.status(200).json({ 
            success: true, 
            message: "Profile updated successfully",
            farmer: updatedFarmer
        });
    } catch (err) {
        console.error("❌ Error updating farmer profile:", err.message);
        res.status(500).json({ success: false, message: "Error updating profile" });
    }
});

// **Error Handling Middleware**
app.use((err, req, res, next) => {
    console.error("❌ Unhandled error:", err.message);
    res.status(500).json({ success: false, message: "Internal server error" });
});

// **Start the Server**
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));