// ================= CONFIG =================
const API = "http://localhost:5000";

// ================= INITIALIZE =================
// Legacy localStorage keys kept for compatibility during transition
if (!localStorage.getItem("bookings"))         localStorage.setItem("bookings", JSON.stringify([]));
if (!localStorage.getItem("cancellations"))    localStorage.setItem("cancellations", JSON.stringify({}));
if (!localStorage.getItem("cancellationLogs")) localStorage.setItem("cancellationLogs", JSON.stringify([]));

// ================= PRICE CALCULATION =================

// Maps guest range to a representative count for pricing
function guestRangeToCount(guestRange) {
    const map = { small: 75, medium: 200, large: 450, grand: 800 };
    return map[guestRange] || 100;
}

function calculatePrice(basePrice, guestCount, eventType, theme, selectedDate) {
    let price = basePrice;
    price += guestCount * 10;
    if (eventType === "Marriage")    price += 100;
    if (eventType === "Corporate")   price += 500;
    if (eventType === "Birthday")    price += 300;
    if (theme === "royal")           price += 500;
    if (theme === "modern")          price += 300;
    const day = new Date(selectedDate).getDay();
    if (day === 0 || day === 6)      price += 750;
    return price;
}

// ================= GET RECOMMENDATIONS =================

async function getRecommendations() {
    const currentUser  = localStorage.getItem("currentUser");
    const location     = document.getElementById("location").value.trim();
    const guestRange   = document.getElementById("guestRange").value;
    const selectedDate = document.getElementById("eventDate").value;
    const eventType    = document.getElementById("eventType").value;
    const theme        = document.getElementById("theme").value;
    const budget       = document.getElementById("budget").value;

    if (!location || !guestRange || !selectedDate) {
        alert("Please fill required fields.");
        return;
    }

    const list = document.getElementById("venueList");
    list.innerHTML = "";

    try {
        // Call backend AI recommendation endpoint
        const res = await fetch(`${API}/recommend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ location, guestRange, budget, theme, eventType })
        });

        if (!res.ok) throw new Error("Server error");
        const venues = await res.json();

        // Get bookings from backend
        const bookingsRes = await fetch(`${API}/bookings/${currentUser}`);
        const userBookings = await bookingsRes.json();

        // Get all bookings for conflict check
        const allBookingsRes = await fetch(`${API}/bookings`);
        const allBookings = await allBookingsRes.json();

        // Get cancel count
        const cancelRes = await fetch(`${API}/cancellations/${currentUser}`);
        const { cancelCount } = await cancelRes.json();

        if (venues.length === 0) {
            document.getElementById("emptyState").classList.remove("hidden");
            document.getElementById("backBtnWrap").classList.add("hidden");
            return;
        }

        // Store all venues globally for pagination
        window._allVenues       = venues;
        window._venuesMeta      = { userBookings, allBookings, cancelCount, selectedDate, eventType, theme, guestRange };
        window._venuesShown     = 0;

        // Render first 5
        renderNextVenues(5);

        // Show/hide empty state based on results
        document.getElementById("emptyState").classList.add("hidden");
        document.getElementById("backBtnWrap").classList.remove("hidden");

    } catch (err) {
        console.error(err);
        // FALLBACK: use localStorage if backend is down
        fallbackGetRecommendations(currentUser, location, guestRange, selectedDate, eventType, theme);
    }

    document.getElementById("formSection").classList.add("hidden");
    document.getElementById("results").classList.remove("hidden");
}

// ================= RENDER VENUES (Paginated) =================

function renderVenueCard(v) {
    const { userBookings, allBookings, cancelCount, selectedDate, eventType, theme, guestRange } = window._venuesMeta;

    const userBooking = userBookings.find(b =>
        String(b.venueId) === String(v._id) && b.date === selectedDate
    );
    const anyBooking = allBookings.find(b =>
        String(b.venueId) === String(v._id) && b.date === selectedDate
    );

    const finalPrice = calculatePrice(v.basePrice, guestRangeToCount(guestRange), eventType, theme, selectedDate);

    let buttonHTML = "";
    if (userBooking) {
        const disabled = cancelCount >= 3 ? "disabled" : "";
        buttonHTML = `
            <button class="booked-btn">✓ Booked</button>
            <button class="book-btn" ${disabled}
                onclick="cancelBooking('${userBooking.bookingId}')">
                Cancel Booking
            </button>
            <div class="booked-label">Free cancellations used: ${cancelCount}/3</div>
        `;
    } else if (anyBooking) {
        buttonHTML = `<button class="booked-btn" style="background:#e74c3c;">Not Available</button>`;
    } else {
        buttonHTML = `
            <button class="book-btn"
                onclick="bookVenue('${v._id}', '${v.name}', '${v.map}', ${finalPrice})">
                Book Venue
            </button>
        `;
    }

    const matchPercent = v.matchPercent || 0;
    const matchColor = matchPercent >= 80 ? "#2ecc71"
                     : matchPercent >= 60 ? "#f39c12"
                     : "#e74c3c";

    const budgetWarning = v.overBudget
        ? `<div class="budget-warning">⚠️ Slightly over your budget</div>`
        : "";

    return `
        <div class="venue-card">
            <img src="${v.image}" class="venue-img" onerror="this.src='images/decor1.png'">
            <div class="venue-info">
                <div class="match-badge" style="background:${matchColor}">
                    🤖 ${matchPercent}% AI Match
                </div>
                ${budgetWarning}
                <h3>${v.name}</h3>
                <p>📍 ${v.map}</p>
                <p>⭐ <strong>${v.rating || "N/A"}</strong> &nbsp;|&nbsp; 👥 Capacity: ${v.capacity}</p>
                <p><strong>Estimated Cost:</strong> ₹${finalPrice.toLocaleString()}</p>
                ${buttonHTML}
            </div>
        </div>
    `;
}

function renderNextVenues(count = 5) {
    const all    = window._allVenues || [];
    const shown  = window._venuesShown || 0;
    const next   = all.slice(shown, shown + count);
    const list   = document.getElementById("venueList");

    // Remove existing Load More button if present
    const existingBtn = document.getElementById("loadMoreBtn");
    if (existingBtn) existingBtn.remove();

    next.forEach(v => {
        list.innerHTML += renderVenueCard(v);
    });

    window._venuesShown = shown + next.length;
    const remaining = all.length - window._venuesShown;

    // Show venue count
    document.getElementById("venueCount").textContent =
        `Showing ${window._venuesShown} of ${all.length} venues`;

    // Show Load More button if there are more venues
    if (remaining > 0) {
        const backBtnWrap = document.getElementById("backBtnWrap");
        backBtnWrap.insertAdjacentHTML("beforebegin", `
            <div class="btn-center" id="loadMoreBtn">
                <button class="cta-btn load-more-btn" onclick="renderNextVenues(5)">
                    Load ${Math.min(remaining, 5)} More Venues ↓
                </button>
                <p class="load-more-hint">${remaining} more venue${remaining > 1 ? "s" : ""} available</p>
            </div>
        `);
    }

    document.getElementById("emptyState").classList.add("hidden");
    document.getElementById("backBtnWrap").classList.remove("hidden");
}

// ================= FALLBACK (localStorage) =================

function fallbackGetRecommendations(currentUser, location, guestRange, selectedDate, eventType, theme) {
    const rangeMap = {
        small:  { min: 0,   max: 100   },
        medium: { min: 100, max: 300   },
        large:  { min: 300, max: 600   },
        grand:  { min: 600, max: 99999 }
    };
    const range = rangeMap[guestRange] || { min: 0, max: 99999 };

    const localVenues = [
        { _id:1, name:"Royal Palace Hall",         location:"Chennai",   map:"Marina Beach Road, Chennai", image:"images/royal_palace.jpg",  capacity:250, basePrice:200000, rating:4.5 },
        { _id:2, name:"Skyline Convention Center",  location:"Chennai",   map:"OMR Road, Chennai",          image:"images/skyline.jpg",        capacity:500, basePrice:350000, rating:4.7 },
        { _id:3, name:"Green Garden Venue",         location:"Chennai",   map:"ECR Beach Road, Chennai",    image:"images/green_garden.jpg",   capacity:150, basePrice:120000, rating:4.2 },
        { _id:4, name:"Grand City Banquet",         location:"Bangalore", map:"MG Road, Bangalore",         image:"images/grand_city.jpg",     capacity:300, basePrice:250000, rating:4.3 },
        { _id:5, name:"Elite Convention Arena",     location:"Bangalore", map:"Whitefield, Bangalore",      image:"images/elite_arena.jpg",    capacity:700, basePrice:500000, rating:4.9 }
    ];

    const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    const cancellations = JSON.parse(localStorage.getItem("cancellations")) || {};
    const userCancelCount = cancellations[currentUser] || 0;

    const list = document.getElementById("venueList");
    list.innerHTML = "";

    const filtered = localVenues.filter(v =>
        v.location.toLowerCase() === location.toLowerCase() &&
        v.capacity >= range.min
    );

    filtered.forEach(v => {
        const userBooking = bookings.find(b => String(b.venueId) === String(v._id) && b.date === selectedDate && b.user === currentUser);
        const anyBooking  = bookings.find(b => String(b.venueId) === String(v._id) && b.date === selectedDate);
        const finalPrice  = calculatePrice(v.basePrice, guestRangeToCount(guestRange), eventType, theme, selectedDate);

        let buttonHTML = "";
        if (userBooking) {
            const disabled = userCancelCount >= 3 ? "disabled" : "";
            buttonHTML = `
                <button class="booked-btn">✓ Booked</button>
                <button class="book-btn" ${disabled} onclick="cancelBookingLocal(${v._id}, '${selectedDate}')">Cancel Booking</button>
                <div class="booked-label">Free cancellations used: ${userCancelCount}/3</div>
            `;
        } else if (anyBooking) {
            buttonHTML = `<button class="booked-btn" style="background:#e74c3c;">Not Available</button>`;
        } else {
            buttonHTML = `<button class="book-btn" onclick="bookVenueLocal(${v._id}, '${v.name}', '${v.map}', ${finalPrice})">Book Venue</button>`;
        }

        list.innerHTML += `
            <div class="venue-card">
                <img src="${v.image}" class="venue-img" onerror="this.src='images/decor1.png'">
                <div class="venue-info">
                    <h3>${v.name}</h3>
                    <p>📍 ${v.map}</p>
                    <p>⭐ ${v.rating} &nbsp;|&nbsp; 👥 Up to ${v.capacity} guests</p>
                    <p><strong>Estimated Cost:</strong> ₹${finalPrice.toLocaleString()}</p>
                    ${buttonHTML}
                </div>
            </div>
        `;
    });
}

// ================= BOOK VENUE (Backend) =================

async function bookVenue(venueId, venueName, venueLocation, finalPrice) {
    const currentUser  = localStorage.getItem("currentUser");
    const date         = document.getElementById("eventDate").value;

    try {
        const res = await fetch(`${API}/bookings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                venueId, venueName, venueLocation,
                user: currentUser, date, price: finalPrice
            })
        });

        const data = await res.json();
        if (!res.ok) { 
            alert(data.error || "Booking failed"); 
            return; 
        }

        // ✅ FIX START: SAVE TO LOCALSTORAGE ALSO
        let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

        bookings.push({
            bookingId: data.bookingId,
            venueId: venueId,
            venueName: venueName,
            venueLocation: venueLocation,
            user: currentUser,
            date: date,
            price: finalPrice,
            timestamp: data.timestamp || new Date().toLocaleString()
        });

        localStorage.setItem("bookings", JSON.stringify(bookings));
        // ✅ FIX END

        localStorage.setItem("latestBooking", JSON.stringify(data));
        localStorage.setItem("returnToResults", "true");

        window.location.href = "confirmation.html";

    } catch (err) {
        console.error(err);

        // fallback (already works correctly)
        bookVenueLocal(venueId, venueName, venueLocation, finalPrice);
    }
}

// ================= CANCEL BOOKING (Backend) =================

async function cancelBooking(bookingId) {
    const currentUser = localStorage.getItem("currentUser");
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
        const res = await fetch(`${API}/bookings/${bookingId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: currentUser })
        });

        const data = await res.json();
        if (!res.ok) { alert(data.error || "Cancellation failed"); return; }

        alert("Booking cancelled successfully!");
        getRecommendations();

    } catch (err) {
        console.error(err);
        alert("Could not connect to server.");
    }
}

// ================= LOCAL FALLBACK BOOK/CANCEL =================

function bookVenueLocal(id, venueName, venueLocation, finalPrice) {
    const currentUser = localStorage.getItem("currentUser");
    const date = document.getElementById("eventDate").value;
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    if (bookings.find(b => String(b.venueId) === String(id) && b.date === date)) {
        alert("Already booked."); return;
    }

    const bookingData = {
        bookingId: "EVT" + Date.now(),
        venueId: id, venueName, venueLocation,
        user: currentUser, date, price: finalPrice,
        timestamp: new Date().toLocaleString()
    };

    bookings.push(bookingData);
    localStorage.setItem("bookings", JSON.stringify(bookings));
    localStorage.setItem("latestBooking", JSON.stringify(bookingData));
    localStorage.setItem("returnToResults", "true");
    window.location.href = "confirmation.html";
}

function cancelBookingLocal(id, date) {
    const currentUser = localStorage.getItem("currentUser");
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
    let cancellations = JSON.parse(localStorage.getItem("cancellations")) || {};
    let logs = JSON.parse(localStorage.getItem("cancellationLogs")) || [];

    const userCancelCount = cancellations[currentUser] || 0;
    if (userCancelCount >= 3) { alert("Cancellation limit reached."); return; }

    const booking = bookings.find(b => String(b.venueId) === String(id) && b.date === date && b.user === currentUser);
    if (!booking) return;

    bookings = bookings.filter(b => !(String(b.venueId) === String(id) && b.date === date && b.user === currentUser));
    cancellations[currentUser] = userCancelCount + 1;
    logs.push({ user: currentUser, venueName: booking.venueName, eventDate: booking.date, cancelledAt: new Date().toLocaleString() });

    localStorage.setItem("bookings", JSON.stringify(bookings));
    localStorage.setItem("cancellations", JSON.stringify(cancellations));
    localStorage.setItem("cancellationLogs", JSON.stringify(logs));

    alert("Booking Cancelled!");
    getRecommendations();
}

function goBack() {
    document.getElementById("results").classList.add("hidden");
    document.getElementById("formSection").classList.remove("hidden");
    document.getElementById("venueList").innerHTML = "";
    document.getElementById("venueCount").textContent = "";
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    if (loadMoreBtn) loadMoreBtn.remove();
    window._allVenues   = [];
    window._venuesShown = 0;
}

function goToVenue(index) {

    // 🔥 Define SAME venues as slider
    const featuredVenues = [
        {
            venueId: "featured1",
            name: "Royal Palace Hall",
            location: "Chennai",
            price: 200000
        },
        {
            venueId: "featured2",
            name: "Skyline Convention Center",
            location: "Chennai",
            price: 350000
        },
        {
            venueId: "featured3",
            name: "Green Garden Venue",
            location: "Chennai",
            price: 120000
        },
        {
            venueId: "featured4",
            name: "Golden Lotus Palace",
            location: "Chennai",
            price: 300000
        },
        {
            venueId: "featured5",
            name: "Beachside Bliss",
            location: "Chennai",
            price: 180000
        }
    ];

    const selected = featuredVenues[index];

    // ✅ Save selected venue
    localStorage.setItem("selectedVenue", JSON.stringify(selected));

    // 👉 Go to planner page
    window.location.href = "planner.html";
}
