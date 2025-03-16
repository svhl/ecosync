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
			res.redirect("/login.html");
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

// Handle Seller Listing Submission
app.post("/submit-listing", (req, res) => {
	if (!req.session.user) return res.status(401).send("Unauthorized");

	const { productName, quantityPerMonth, productType } = req.body;
	const username = req.session.user;

	const query =
		"INSERT INTO seller_listing (username, product_name, quantity, type) VALUES (?, ?, ?, ?)";
	db.query(
		query,
		[username, productName, quantityPerMonth, productType],
		(err) => {
			if (err) {
				return res.status(500).send("Error submitting listing.");
			}
			// Respond with success message
			res.send("Listing submitted successfully.");
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

app.get("/listings", (req, res) => {
	if (!req.session.user) return res.status(401).send("Unauthorized");

	// Get logged-in user's coordinates
	db.query(
		"SELECT map FROM users WHERE username = ?",
		[req.session.user],
		(err, userResult) => {
			if (err || userResult.length === 0)
				return res.status(500).send("Error fetching user location.");

			const userCoords = userResult[0].map.split(",").map(Number);

			// Fetch seller listings with coordinates
			const query = `
				SELECT u.username, u.industry, u.contact, u.map, s.product_name, s.quantity, s.type
				FROM seller_listing s
				JOIN users u ON s.username = u.username
				WHERE u.approved = "yes" AND u.sell = "yes"
			`;

			db.query(query, (err, results) => {
				if (err)
					return res.status(500).send("Error fetching listings.");

				const toRadians = (degrees) => (degrees * Math.PI) / 180;

				const haversineDistance = (lat1, lon1, lat2, lon2) => {
					const R = 6371; // Earth's radius in km
					const dLat = toRadians(lat2 - lat1);
					const dLon = toRadians(lon2 - lon1);
					const a =
						Math.sin(dLat / 2) * Math.sin(dLat / 2) +
						Math.cos(toRadians(lat1)) *
							Math.cos(toRadians(lat2)) *
							Math.sin(dLon / 2) *
							Math.sin(dLon / 2);
					const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
					return R * c; // Distance in km
				};

				const listings = results
					.map((listing) => {
						const sellerCoords = listing.map.split(",").map(Number);
						const distanceKm = haversineDistance(
							userCoords[0],
							userCoords[1],
							sellerCoords[0],
							sellerCoords[1]
						);

						return {
							industry: listing.industry,
							contact: listing.contact,
							product_name: listing.product_name,
							quantity: listing.quantity,
							type: listing.type,
							coord_difference: distanceKm.toFixed(2), // Distance in km
						};
					})
					.filter(
						(listing) => parseFloat(listing.coord_difference) > 0
					); // Filter out listings with 0.0 km distance

				res.json(listings);
			});
		}
	);
});

app.get("/byprods", (req, res) => {
	if (!req.session.user) return res.status(401).send("Unauthorized");

	// Get logged-in user's coordinates
	db.query(
		"SELECT map FROM users WHERE username = ?",
		[req.session.user],
		(err, userResult) => {
			if (err || userResult.length === 0)
				return res.status(500).send("Error fetching user location.");

			const userCoords = userResult[0].map.split(",").map(Number);

			// Fetch seller listings with coordinates
			const query = `
				SELECT u.username, u.industry, u.contact, u.map, s.product_name, s.quantity, s.type
				FROM seller_listing s
				JOIN users u ON s.username = u.username
				WHERE u.approved = "yes" AND u.sell = "yes"
			`;

			db.query(query, (err, results) => {
				if (err)
					return res.status(500).send("Error fetching listings.");

				const toRadians = (degrees) => (degrees * Math.PI) / 180;

				const haversineDistance = (lat1, lon1, lat2, lon2) => {
					const R = 6371; // Earth's radius in km
					const dLat = toRadians(lat2 - lat1);
					const dLon = toRadians(lon2 - lon1);
					const a =
						Math.sin(dLat / 2) * Math.sin(dLat / 2) +
						Math.cos(toRadians(lat1)) *
							Math.cos(toRadians(lat2)) *
							Math.sin(dLon / 2) *
							Math.sin(dLon / 2);
					const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
					return R * c; // Distance in km
				};

				const listings = results
					.map((listing) => {
						const sellerCoords = listing.map.split(",").map(Number);
						const distanceKm = haversineDistance(
							userCoords[0],
							userCoords[1],
							sellerCoords[0],
							sellerCoords[1]
						);

						return {
							industry: listing.industry,
							contact: listing.contact,
							product_name: listing.product_name,
							quantity: listing.quantity,
							type: listing.type,
							coord_difference: distanceKm.toFixed(2), // Distance in km
						};
					})
					.filter(
						(listing) => parseFloat(listing.coord_difference) > 0
					); // Filter out listings with 0.0 km distance

				res.json(listings);
			});
		}
	);
});

app.get("/equip", (req, res) => {
	if (!req.session.user) return res.status(401).send("Unauthorized");

	// Get logged-in user's coordinates
	db.query(
		"SELECT map FROM users WHERE username = ?",
		[req.session.user],
		(err, userResult) => {
			if (err || userResult.length === 0)
				return res.status(500).send("Error fetching user location.");

			const userCoords = userResult[0].map.split(",").map(Number);

			// Fetch seller listings with coordinates
			const query = `
				SELECT u.username, u.industry, u.contact, u.map, s.product_name, s.quantity, s.type
				FROM seller_listing s
				JOIN users u ON s.username = u.username
				WHERE u.approved = "yes" AND u.sell = "yes"
			`;

			db.query(query, (err, results) => {
				if (err)
					return res.status(500).send("Error fetching listings.");

				const toRadians = (degrees) => (degrees * Math.PI) / 180;

				const haversineDistance = (lat1, lon1, lat2, lon2) => {
					const R = 6371; // Earth's radius in km
					const dLat = toRadians(lat2 - lat1);
					const dLon = toRadians(lon2 - lon1);
					const a =
						Math.sin(dLat / 2) * Math.sin(dLat / 2) +
						Math.cos(toRadians(lat1)) *
							Math.cos(toRadians(lat2)) *
							Math.sin(dLon / 2) *
							Math.sin(dLon / 2);
					const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
					return R * c; // Distance in km
				};

				const listings = results
					.map((listing) => {
						const sellerCoords = listing.map.split(",").map(Number);
						const distanceKm = haversineDistance(
							userCoords[0],
							userCoords[1],
							sellerCoords[0],
							sellerCoords[1]
						);

						return {
							industry: listing.industry,
							contact: listing.contact,
							product_name: listing.product_name,
							quantity: listing.quantity,
							type: listing.type,
							coord_difference: distanceKm.toFixed(2), // Distance in km
						};
					})
					.filter(
						(listing) => parseFloat(listing.coord_difference) > 0
					); // Filter out listings with 0.0 km distance

				res.json(listings);
			});
		}
	);
});
