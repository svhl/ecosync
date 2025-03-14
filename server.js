const express = require("express");
const mysql = require("mysql2");
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();
app.use(express.json()); // Allows Express to parse JSON body
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
		'INSERT INTO users (username, password, industry, map, contact, type, approved, sell) VALUES (?, ?, ?, ?, ?, ?, "no", "no")';
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
// User Login
app.post("/login", (req, res) => {
	const { username, password } = req.body;
	const query =
		'SELECT * FROM users WHERE username = ? AND password = ? AND approved = "yes"';
	db.query(query, [username, password], (err, results) => {
		if (err)
			return res.json({ success: false, message: "Error logging in." });
		if (results.length > 0) {
			req.session.user = username;
			res.json({ success: true, redirect: "/dashboard.html" }); // Send redirect URL in response
		} else {
			res.json({
				success: false,
				message: "Invalid credentials or not approved.",
			});
		}
	});
});

app.post("/admin-login", (req, res) => {
	const { username, password } = req.body;
	const query = "SELECT * FROM admins WHERE username = ? AND password = ?";
	db.query(query, [username, password], (err, results) => {
		if (err) return res.json({ error: "Error logging in." });
		if (results.length > 0) {
			req.session.admin = username;
			res.json({ success: true }); // Send JSON response instead of redirect
		} else {
			res.json({ error: "Invalid admin credentials." });
		}
	});
});

// Fetch Unapproved Users for Signup
app.get("/unapproved-users", (req, res) => {
	if (!req.session.admin) return res.send("Unauthorized");
	db.query('SELECT * FROM users WHERE approved = "no"', (err, results) => {
		if (err) return res.send("Error fetching users.");
		res.json(results);
	});
});

// Fetch Users Pending Sell Approval
app.get("/pending-sell-approvals", (req, res) => {
	if (!req.session.admin) return res.send("Unauthorized");
	db.query('SELECT * FROM users WHERE sell = "pending"', (err, results) => {
		if (err) return res.send("Error fetching sell approvals.");
		res.json(results);
	});
});

// Approve User for Signup
app.post("/approve-user", (req, res) => {
	if (!req.session.admin) return res.status(401).send("Unauthorized");

	let { username } = req.body;
	if (!username) return res.status(400).send("Missing username.");

	db.query(
		'UPDATE users SET approved = "yes" WHERE username = ?',
		[username],
		(err) => {
			if (err) return res.status(500).send("Error approving user.");
			res.send("User approved.");
		}
	);
});

// Approve User for Selling
app.post("/approve-sell", (req, res) => {
	if (!req.session.admin) return res.status(401).send("Unauthorized");

	let { username } = req.body;
	if (!username) return res.status(400).send("Missing username.");

	db.query(
		'UPDATE users SET sell = "yes" WHERE username = ?',
		[username],
		(err) => {
			if (err) return res.status(500).send("Error approving selling.");
			res.send("Selling permission granted.");
		}
	);
});

// Request Sell Approval
app.post("/request-sell", (req, res) => {
	if (!req.session.user) return res.send("Unauthorized");
	const username = req.session.user;
	db.query(
		'UPDATE users SET sell = "pending" WHERE username = ?',
		[username],
		(err) => {
			if (err) return res.send("Error requesting sell approval.");
			res.redirect("/dashboard.html");
		}
	);
});

app.listen(3000, () => {
	console.log("Server running on http://localhost:3000");
});

app.get("/get-user-status", (req, res) => {
	if (!req.session.user) {
		return res.json({ error: "Not logged in" });
	}

	const query = "SELECT sell FROM users WHERE username = ?";
	db.query(query, [req.session.user], (err, results) => {
		if (err || results.length === 0) {
			return res.json({ error: "Error fetching user data" });
		}
		res.json(results[0]); // Return the user's sell status
	});
});
