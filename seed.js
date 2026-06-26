const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/eventplanner")
    .then(() => console.log("✅ Connected"))
    .catch(err => { console.error(err); process.exit(1); });

const venueSchema = new mongoose.Schema({
    name: String, location: String, map: String,
    image: String, capacity: Number, basePrice: Number,
    rating: Number, popularity: Number, tags: [String]
});

const Venue = mongoose.model("Venue", venueSchema);

// 50 venues — Chennai (25) + Bangalore (25)
// Capacities spread: 50, 80, 100, 120, 150, 180, 200, 250, 300, 350, 400, 500, 600, 700, 1000
// Tags cover all themes: royal, modern, minimal, outdoor, luxury, corporate

const venues = [
// ===== CHENNAI =====
{ name:"Royal Palace Hall",        location:"Chennai",   map:"Marina Beach Road, Chennai",    image:"images/royal_palace.jpg",  capacity:250, basePrice:200000, rating:4.5, popularity:90, tags:["royal","luxury"] },
{ name:"Skyline Convention Center",location:"Chennai",   map:"OMR Road, Chennai",             image:"images/skyline.jpg",        capacity:500, basePrice:350000, rating:4.7, popularity:95, tags:["modern","corporate"] },
{ name:"Green Garden Venue",       location:"Chennai",   map:"ECR Beach Road, Chennai",       image:"images/green_garden.jpg",   capacity:150, basePrice:120000, rating:4.2, popularity:80, tags:["outdoor","minimal"] },
{ name:"Golden Lotus Palace",      location:"Chennai",   map:"Anna Nagar, Chennai",           image:"images/royal_palace.jpg",   capacity:400, basePrice:300000, rating:4.6, popularity:88, tags:["royal","luxury"] },
{ name:"Beachside Bliss",          location:"Chennai",   map:"ECR Coast, Chennai",            image:"images/green_garden.jpg",   capacity:220, basePrice:180000, rating:4.4, popularity:82, tags:["outdoor","luxury"] },
{ name:"Classic Banquet Hall",     location:"Chennai",   map:"Tambaram, Chennai",             image:"images/skyline.jpg",        capacity:80,  basePrice:60000,  rating:3.9, popularity:60, tags:["minimal"] },
{ name:"Lakeview Lawn",            location:"Chennai",   map:"Velachery Lake, Chennai",       image:"images/green_garden.jpg",   capacity:200, basePrice:150000, rating:4.1, popularity:75, tags:["outdoor"] },
{ name:"Urban Hub Hall",           location:"Chennai",   map:"T Nagar, Chennai",              image:"images/skyline.jpg",        capacity:180, basePrice:130000, rating:4.0, popularity:70, tags:["modern","corporate"] },
{ name:"Majestic Hall",            location:"Chennai",   map:"T Nagar, Chennai",              image:"images/royal_palace.jpg",   capacity:450, basePrice:350000, rating:4.7, popularity:93, tags:["luxury","royal"] },
{ name:"Regal Banquet",            location:"Chennai",   map:"Nungambakkam, Chennai",         image:"images/royal_palace.jpg",   capacity:350, basePrice:280000, rating:4.6, popularity:89, tags:["royal"] },
{ name:"Coral Convention",         location:"Chennai",   map:"OMR, Chennai",                  image:"images/skyline.jpg",        capacity:420, basePrice:330000, rating:4.7, popularity:92, tags:["modern","corporate"] },
{ name:"Pearl Hall",               location:"Chennai",   map:"Adyar, Chennai",                image:"images/skyline.jpg",        capacity:220, basePrice:190000, rating:4.3, popularity:80, tags:["modern"] },
{ name:"Sunset Arena",             location:"Chennai",   map:"Besant Nagar, Chennai",         image:"images/green_garden.jpg",   capacity:300, basePrice:250000, rating:4.5, popularity:85, tags:["outdoor","luxury"] },
{ name:"Harmony Hall",             location:"Chennai",   map:"Guindy, Chennai",               image:"images/skyline.jpg",        capacity:120, basePrice:100000, rating:4.0, popularity:68, tags:["minimal"] },
{ name:"Crystal Hall",             location:"Chennai",   map:"Anna Nagar, Chennai",           image:"images/royal_palace.jpg",   capacity:300, basePrice:260000, rating:4.4, popularity:84, tags:["royal","modern"] },
{ name:"Ocean Breeze Venue",       location:"Chennai",   map:"ECR, Chennai",                  image:"images/green_garden.jpg",   capacity:280, basePrice:230000, rating:4.5, popularity:88, tags:["outdoor"] },
{ name:"Galaxy Convention Hall",   location:"Chennai",   map:"OMR, Chennai",                  image:"images/skyline.jpg",        capacity:600, basePrice:420000, rating:4.6, popularity:91, tags:["modern","corporate"] },
{ name:"Regency Palace",           location:"Chennai",   map:"Adyar, Chennai",                image:"images/royal_palace.jpg",   capacity:700, basePrice:500000, rating:4.8, popularity:95, tags:["luxury","royal"] },
{ name:"Velvet Banquet",           location:"Chennai",   map:"Perambur, Chennai",             image:"images/skyline.jpg",        capacity:100, basePrice:80000,  rating:4.1, popularity:73, tags:["minimal"] },
{ name:"Sunrise Banquet",          location:"Chennai",   map:"Tambaram, Chennai",             image:"images/skyline.jpg",        capacity:50,  basePrice:40000,  rating:4.0, popularity:65, tags:["minimal"] },
{ name:"Emerald Lawns",            location:"Chennai",   map:"Sholinganallur, Chennai",       image:"images/green_garden.jpg",   capacity:350, basePrice:270000, rating:4.4, popularity:83, tags:["outdoor","luxury"] },
{ name:"The Grand Pavilion",       location:"Chennai",   map:"Porur, Chennai",                image:"images/royal_palace.jpg",   capacity:1000,basePrice:700000, rating:4.9, popularity:99, tags:["luxury","royal","corporate"] },
{ name:"Lotus Garden Venue",       location:"Chennai",   map:"Velachery, Chennai",            image:"images/green_garden.jpg",   capacity:180, basePrice:140000, rating:4.2, popularity:76, tags:["outdoor","minimal"] },
{ name:"Starlight Banquet",        location:"Chennai",   map:"Chromepet, Chennai",            image:"images/skyline.jpg",        capacity:120, basePrice:95000,  rating:4.0, popularity:67, tags:["minimal","modern"] },
{ name:"Opal Convention Centre",   location:"Chennai",   map:"Perungudi, Chennai",            image:"images/skyline.jpg",        capacity:500, basePrice:380000, rating:4.7, popularity:90, tags:["corporate","modern"] },

// ===== BANGALORE =====
{ name:"Grand City Banquet",       location:"Bangalore", map:"MG Road, Bangalore",            image:"images/grand_city.jpg",     capacity:300, basePrice:250000, rating:4.3, popularity:85, tags:["royal","modern"] },
{ name:"Elite Convention Arena",   location:"Bangalore", map:"Whitefield, Bangalore",         image:"images/elite_arena.jpg",    capacity:700, basePrice:500000, rating:4.9, popularity:98, tags:["luxury","modern","corporate"] },
{ name:"Silicon Grand Hall",       location:"Bangalore", map:"Electronic City, Bangalore",    image:"images/grand_city.jpg",     capacity:350, basePrice:260000, rating:4.5, popularity:87, tags:["corporate","modern"] },
{ name:"Gardenia Greens",          location:"Bangalore", map:"Hebbal, Bangalore",             image:"images/elite_arena.jpg",    capacity:200, basePrice:160000, rating:4.2, popularity:78, tags:["outdoor","minimal"] },
{ name:"Plaza Convention Hall",    location:"Bangalore", map:"Indiranagar, Bangalore",        image:"images/grand_city.jpg",     capacity:450, basePrice:320000, rating:4.6, popularity:90, tags:["modern","corporate"] },
{ name:"Royal Orchid Venue",       location:"Bangalore", map:"Yelahanka, Bangalore",          image:"images/elite_arena.jpg",    capacity:500, basePrice:380000, rating:4.8, popularity:95, tags:["luxury","royal"] },
{ name:"Eco Garden Venue",         location:"Bangalore", map:"Bannerghatta, Bangalore",       image:"images/elite_arena.jpg",    capacity:150, basePrice:120000, rating:4.1, popularity:72, tags:["outdoor","minimal"] },
{ name:"Imperial Palace",          location:"Bangalore", map:"Whitefield, Bangalore",         image:"images/grand_city.jpg",     capacity:600, basePrice:450000, rating:4.9, popularity:97, tags:["luxury","royal"] },
{ name:"Grand Royale",             location:"Bangalore", map:"Koramangala, Bangalore",        image:"images/elite_arena.jpg",    capacity:500, basePrice:400000, rating:4.8, popularity:96, tags:["luxury","royal"] },
{ name:"Metro Hall",               location:"Bangalore", map:"Majestic, Bangalore",           image:"images/grand_city.jpg",     capacity:100, basePrice:80000,  rating:4.2, popularity:77, tags:["corporate","minimal"] },
{ name:"Blue Sky Venue",           location:"Bangalore", map:"Whitefield, Bangalore",         image:"images/elite_arena.jpg",    capacity:260, basePrice:200000, rating:4.4, popularity:83, tags:["outdoor","modern"] },
{ name:"Emerald Hall",             location:"Bangalore", map:"BTM Layout, Bangalore",         image:"images/grand_city.jpg",     capacity:80,  basePrice:65000,  rating:4.1, popularity:74, tags:["minimal"] },
{ name:"Silver Oak Venue",         location:"Bangalore", map:"Jayanagar, Bangalore",          image:"images/grand_city.jpg",     capacity:240, basePrice:210000, rating:4.3, popularity:81, tags:["modern","outdoor"] },
{ name:"Sky Lounge Hall",          location:"Bangalore", map:"MG Road, Bangalore",            image:"images/grand_city.jpg",     capacity:180, basePrice:150000, rating:4.4, popularity:84, tags:["modern","luxury"] },
{ name:"Infinity Convention",      location:"Bangalore", map:"Koramangala, Bangalore",        image:"images/elite_arena.jpg",    capacity:450, basePrice:350000, rating:4.7, popularity:93, tags:["corporate","modern"] },
{ name:"Green Pearl Venue",        location:"Bangalore", map:"BTM, Bangalore",                image:"images/elite_arena.jpg",    capacity:220, basePrice:180000, rating:4.3, popularity:80, tags:["outdoor","minimal"] },
{ name:"Golden Crown Hall",        location:"Bangalore", map:"Indiranagar, Bangalore",        image:"images/grand_city.jpg",     capacity:1000,basePrice:750000, rating:4.9, popularity:99, tags:["luxury","royal","corporate"] },
{ name:"City Center Banquet",      location:"Bangalore", map:"Majestic, Bangalore",           image:"images/grand_city.jpg",     capacity:120, basePrice:95000,  rating:4.2, popularity:78, tags:["minimal","corporate"] },
{ name:"Palm Garden Venue",        location:"Bangalore", map:"Hebbal, Bangalore",             image:"images/elite_arena.jpg",    capacity:280, basePrice:220000, rating:4.3, popularity:82, tags:["outdoor"] },
{ name:"Harmony Greens",           location:"Bangalore", map:"Bannerghatta, Bangalore",       image:"images/elite_arena.jpg",    capacity:50,  basePrice:45000,  rating:4.0, popularity:65, tags:["minimal","outdoor"] },
{ name:"Tech Park Arena",          location:"Bangalore", map:"Electronic City, Bangalore",    image:"images/grand_city.jpg",     capacity:400, basePrice:300000, rating:4.6, popularity:88, tags:["corporate","modern"] },
{ name:"Urban Elite Hall",         location:"Bangalore", map:"Indiranagar, Bangalore",        image:"images/grand_city.jpg",     capacity:350, basePrice:280000, rating:4.5, popularity:85, tags:["modern","luxury"] },
{ name:"Sunrise Lawns",            location:"Bangalore", map:"Yelahanka, Bangalore",          image:"images/elite_arena.jpg",    capacity:200, basePrice:160000, rating:4.2, popularity:76, tags:["outdoor","minimal"] },
{ name:"Diamond Convention",       location:"Bangalore", map:"Marathahalli, Bangalore",       image:"images/grand_city.jpg",     capacity:600, basePrice:460000, rating:4.8, popularity:94, tags:["luxury","corporate"] },
{ name:"Mystic Garden Hall",       location:"Bangalore", map:"Sarjapur, Bangalore",           image:"images/elite_arena.jpg",    capacity:160, basePrice:130000, rating:4.1, popularity:73, tags:["outdoor","minimal"] },
];

async function seedData() {
    try {
        await Venue.deleteMany();
        await Venue.insertMany(venues);
        console.log(`✅ Seeded ${venues.length} venues successfully`);
        console.log(`   Chennai: ${venues.filter(v=>v.location==="Chennai").length} venues`);
        console.log(`   Bangalore: ${venues.filter(v=>v.location==="Bangalore").length} venues`);
        console.log(`   Smallest capacity: ${Math.min(...venues.map(v=>v.capacity))} guests`);
        console.log(`   Largest capacity: ${Math.max(...venues.map(v=>v.capacity))} guests`);
    } catch (err) {
        console.error("❌ Seed error:", err);
    } finally {
        process.exit();
    }
}

seedData();