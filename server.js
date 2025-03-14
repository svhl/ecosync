const express = require("express");
const mysql = require("mysql2");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
	session({
		secret: "secret",
		resave: false,
		saveUninitialized: true,
	})
);

const db = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "password",
	database: "mydatabase",
});

db.connect((err) => {
	if (err) throw err;
	console.log("Database connected.");
});

// User Signup
app.post("/signup", (req, res) => {
	const { username, password, industry, map, contact, type } = req.body;
	const query =
		'INSERT INTO users (username, password, industry, map, contact, type, approved) VALUES (?, ?, ?, ?, ?, ?, "no")';
	db.query(
		query,
		[username, password, industry, map, contact, type],
		(err) => {
			if (err) return res.send("Error signing up.");
			res.send("Signup successful. Waiting for approval.");
		}
	);
});

// User Login
app.post("/login", (req, res) => {
	const { username, password } = req.body;
	const query =
		'SELECT * FROM users WHERE username = ? AND password = ? AND approved = "yes"';
	db.query(query, [username, password], (err, results) => {
		if (err) return res.send("Error logging in.");
		if (results.length > 0) {
			req.session.user = username;
			res.send("Login successful.");
		} else {
			res.send("Invalid credentials or not approved.");
		}
	});
});

// Admin Login
app.post("/admin-login", (req, res) => {
	const { username, password } = req.body;
	const query = "SELECT * FROM admins WHERE username = ? AND password = ?";
	db.query(query, [username, password], (err, results) => {
		if (err) return res.send("Error logging in.");
		if (results.length > 0) {
			req.session.admin = username;
			res.send("Admin login successful.");
		} else {
			res.send("Invalid admin credentials.");
		}
	});
});

// Admin Panel - Fetch Unapproved Users
app.get("/unapproved-users", (req, res) => {
	if (!req.session.admin) return res.send("Unauthorized");
	db.query('SELECT * FROM users WHERE approved = "no"', (err, results) => {
		if (err) return res.send("Error fetching users.");
		res.json(results);
	});
});

// Approve User
app.post("/approve-user", (req, res) => {
	if (!req.session.admin) return res.send("Unauthorized");
	const { username } = req.body;
	db.query(
		'UPDATE users SET approved = "yes" WHERE username = ?',
		[username],
		(err) => {
			if (err) return res.send("Error approving user.");
			res.send("User approved.");
		}
	);
});

app.listen(3000, () => {
	console.log("Server running on http://localhost:3000");
});
