// ================= ADMIN CREDENTIALS =================

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

// ================= REGISTER FUNCTION =================

function register() {

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const phoneInput = document.getElementById("phone");

    const phone = phoneInput ? phoneInput.value.trim() : "";

    if (!username || !password) {
        alert("Please fill all fields");
        return;
    }

    let users = JSON.parse(localStorage.getItem("users")) || [];

    const exists = users.find(u => u.username === username);

    if (exists) {
        alert("User already exists");
        return;
    }

    users.push({
        username: username,
        password: password,
        phone: phone
    });

    localStorage.setItem("users", JSON.stringify(users));

    alert("Registration successful! Now login.");

}

// ================= LOGIN FUNCTION =================

function login() {

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Please fill all fields");
        return;
    }

    // 🔐 ADMIN LOGIN
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {

        localStorage.setItem("currentUser", "admin");
        localStorage.setItem("role", "admin");

        window.location.href = "admin.html";
        return;
    }

    // 👤 NORMAL USER LOGIN
    let users = JSON.parse(localStorage.getItem("users")) || [];

    const validUser = users.find(u =>
        u.username === username && u.password === password
    );

    if (!validUser) {
        alert("Invalid credentials");
        return;
    }

    localStorage.setItem("currentUser", username);
    localStorage.setItem("role", "user");

    window.location.href = "dashboard.html";
}