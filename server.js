const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(".")); // serve HTML files

// ================= DATABASE =================

mongoose.connect("mongodb://127.0.0.1:27017/eventplanner")
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Error:", err));

// ================= SCHEMAS =================

const venueSchema = new mongoose.Schema({
    name: String,
    location: String,
    map: String,
    image: String,
    capacity: Number,
    basePrice: Number,
    rating: Number,
    popularity: Number,
    tags: [String]
});

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    phone: String,
    cancelCount: { type: Number, default: 0 }
});

const bookingSchema = new mongoose.Schema({
    bookingId: String,
    venueId: mongoose.Schema.Types.ObjectId,
    venueName: String,
    venueLocation: String,
    user: String,
    date: String,
    price: Number,
    timestamp: String
});

const cancellationLogSchema = new mongoose.Schema({
    user: String,
    venueName: String,
    eventDate: String,
    cancelledAt: String
});

const Venue   = mongoose.model("Venue",           venueSchema);
const User    = mongoose.model("User",            userSchema);
const Booking = mongoose.model("Booking",         bookingSchema);
const CancellationLog = mongoose.model("CancellationLog", cancellationLogSchema);

// ================= AUTH ROUTES =================

// REGISTER
app.post("/register", async (req, res) => {
    try {
        const { username, password, phone } = req.body;

        if (!username || !password || !phone)
            return res.status(400).json({ error: "All fields required" });

        const exists = await User.findOne({ username });
        if (exists)
            return res.status(409).json({ error: "Username already taken" });

        const hashed = await bcrypt.hash(password, 10);
        await User.create({ username, password: hashed, phone });

        res.json({ message: "Registered successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// LOGIN
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Admin hardcoded check
        if (username === "admin" && password === "admin123") {
            return res.json({ role: "admin", username: "admin" });
        }

        const user = await User.findOne({ username });
        if (!user)
            return res.status(401).json({ error: "Invalid credentials" });

        const match = await bcrypt.compare(password, user.password);
        if (!match)
            return res.status(401).json({ error: "Invalid credentials" });

        res.json({ role: "user", username: user.username });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// ================= VENUE ROUTES =================

// GET ALL VENUES
app.get("/venues", async (req, res) => {
    try {
        const venues = await Venue.find();
        res.json(venues);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// ================= AI RECOMMENDATION (Weighted Scoring Algorithm) =================
//
// ALGORITHM: Weighted Multi-Criteria Decision Analysis (MCDA)
// Each venue is scored out of 100 based on 6 weighted criteria:
//
//  Criterion          Weight   Rationale
//  ─────────────────────────────────────────────────
//  Location match       25%    Must-have — wrong city = irrelevant
//  Capacity match       25%    Core requirement — must fit guests
//  Budget match         20%    Financial fit
//  Theme/tag match      15%    Preference alignment
//  Venue rating          10%   Quality signal (user reviews)
//  Popularity            5%    Social proof / demand signal
//  ─────────────────────────────────────────────────
//  Total               100%
//
// Only venues matching location AND capacity range are returned.
// Score is normalized to 0–100 and shown as a % match to the user.

app.post("/recommend", async (req, res) => {
    try {
        const { location, guestRange, budget, theme, eventType } = req.body;

        // Map guestRange to min/max capacity
        const rangeMap = {
            small:  { min: 0,   max: 100  },
            medium: { min: 100, max: 300  },
            large:  { min: 300, max: 600  },
            grand:  { min: 600, max: 99999 }
        };

        const range = rangeMap[guestRange] || { min: 0, max: 99999 };

        const venues = await Venue.find();

        let scored = venues.map(v => {
            let score = 0;

            // ── 1. LOCATION MATCH (25 pts) ──
            if (v.location.toLowerCase() === location.toLowerCase()) score += 25;

            // ── 2. CAPACITY MATCH (25 pts) ──
            // Full points if venue capacity fits the range
            // Partial points if venue is close but slightly under
            if (v.capacity >= range.min && v.capacity <= range.max + 200) {
                if (v.capacity >= range.min) score += 25;
            }

            // ── 3. BUDGET MATCH (20 pts) ──
            if (budget === "1-3 Lakhs" && v.basePrice <= 300000)  score += 20;
            else if (budget === "3-5 Lakhs" && v.basePrice <= 500000) score += 20;
            else if (budget === "5+ Lakhs" && v.basePrice >= 300000)  score += 20;
            // Partial budget match (within 20% over budget)
            else if (budget === "1-3 Lakhs" && v.basePrice <= 360000) score += 10;
            else if (budget === "3-5 Lakhs" && v.basePrice <= 600000) score += 10;

            // ── 4. THEME / TAG MATCH (15 pts) ──
            if (v.tags && v.tags.includes(theme)) score += 15;
            // Bonus for event type tag match
            if (eventType === "Corporate" && v.tags && v.tags.includes("corporate")) score += 5;
            if (eventType === "Marriage"  && v.tags && v.tags.includes("royal"))     score += 5;
            if (eventType === "Birthday"  && v.tags && v.tags.includes("outdoor"))   score += 5;

            // ── 5. VENUE RATING (10 pts) ──
            // Rating is out of 5, normalize to 10 pts
            score += ((v.rating || 0) / 5) * 10;

            // ── 6. POPULARITY (5 pts) ──
            // Popularity is out of 100, normalize to 5 pts
            score += ((v.popularity || 0) / 100) * 5;

            // Normalize total to 0–100
            // Max possible raw score = 25+25+20+15+5+10+5 = 105 (with bonuses)
            const maxScore = 105;
            const matchPercent = Math.min(Math.round((score / maxScore) * 100), 99);

            return { ...v.toObject(), score, matchPercent };
        });

        // Filter: only return venues that match location AND fit the capacity range
        scored = scored.filter(v =>
            v.location.toLowerCase() === location.toLowerCase() &&
            v.capacity >= range.min
        );

        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);

        res.json(scored);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// ================= BOOKING ROUTES =================

// GET bookings for a user
app.get("/bookings/:username", async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.params.username });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// GET all bookings (admin)
app.get("/bookings", async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// CREATE booking
app.post("/bookings", async (req, res) => {
    try {
        const { venueId, date, user } = req.body;

        // Conflict check
        const conflict = await Booking.findOne({ venueId, date });
        if (conflict)
            return res.status(409).json({ error: "Venue already booked on this date" });

        const bookingId = "EVT" + Date.now();
        const timestamp = new Date().toLocaleString();

        const booking = await Booking.create({ ...req.body, bookingId, timestamp });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// CANCEL booking
app.delete("/bookings/:bookingId", async (req, res) => {
    try {
        const { username } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.cancelCount >= 3)
            return res.status(403).json({ error: "Cancellation limit reached" });

        const booking = await Booking.findOne({ bookingId: req.params.bookingId, user: username });
        if (!booking) return res.status(404).json({ error: "Booking not found" });

        await CancellationLog.create({
            user: username,
            venueName: booking.venueName,
            eventDate: booking.date,
            cancelledAt: new Date().toLocaleString()
        });

        await Booking.deleteOne({ bookingId: req.params.bookingId });
        await User.updateOne({ username }, { $inc: { cancelCount: 1 } });

        res.json({ message: "Cancelled", cancelCount: user.cancelCount + 1 });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// GET cancel count for user
app.get("/cancellations/:username", async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        res.json({ cancelCount: user ? user.cancelCount : 0 });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// GET cancellation logs (admin)
app.get("/cancellation-logs", async (req, res) => {
    try {
        const logs = await CancellationLog.find();
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// ================= START =================
app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));