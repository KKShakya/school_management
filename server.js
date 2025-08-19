import express from "express";
import dotenv from "dotenv";
import pool from "./db.js";

dotenv.config();

const app = express();
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("School Management API is running 🚀");
});

// Add School
app.post("/addSchool", async (req, res) => {
  try {
    const { name, address, latitude, longitude } = req.body;
    if (!name || !address || !latitude || !longitude) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const [result] = await pool.query(
      "INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)",
      [name, address, latitude, longitude]
    );

    res.status(201).json({ message: "School added", schoolId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// List Schools sorted by proximity
app.get("/listSchools", async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ error: "latitude and longitude are required" });
    }

    const [schools] = await pool.query("SELECT * FROM schools");

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    const withDistance = schools.map((s) => {
      const distance = haversine(userLat, userLon, parseFloat(s.latitude), parseFloat(s.longitude));
      return { ...s, distance_km: distance };
    });

    withDistance.sort((a, b) => a.distance_km - b.distance_km);

    res.json(withDistance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});



// Haversine formula
function haversine(lat1, lon1, lat2, lon2) {
  function toRad(x) {
    return (x * Math.PI) / 180;
  }
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
