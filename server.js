const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'rides.json');

// --- tiny JSON-file "database" -------------------------------------------
function readRides() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeRides(rides) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(rides, null, 2));
}

// --- middleware ------------------------------------------------------------
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API ---------------------------------------------------------------
// GET all rides
app.get('/api/rides', (req, res) => {
  const rides = readRides().sort((a, b) => b.createdAt - a.createdAt);
  res.json(rides);
});

// POST a new ride (offer or request)
app.post('/api/rides', (req, res) => {
  const { type, name, from, to, date, time, seats, note, contact } = req.body;

  if (!type || !name || !from || !to || !contact) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  if (type !== 'offer' && type !== 'request') {
    return res.status(400).json({ error: 'Invalid ride type.' });
  }

  const ride = {
    id: crypto.randomBytes(6).toString('hex'),
    type,
    name: String(name).slice(0, 80),
    from: String(from).slice(0, 100),
    to: String(to).slice(0, 100),
    date: date || null,
    time: time || null,
    seats: type === 'offer' ? Math.max(1, Math.min(8, parseInt(seats) || 1)) : null,
    note: note ? String(note).slice(0, 300) : '',
    contact: String(contact).slice(0, 120),
    status: 'open',
    createdAt: Date.now()
  };

  const rides = readRides();
  rides.push(ride);
  writeRides(rides);

  res.status(201).json(ride);
});

// PATCH a ride's status (e.g. mark as matched)
app.patch('/api/rides/:id', (req, res) => {
  const rides = readRides();
  const ride = rides.find(r => r.id === req.params.id);
  if (!ride) return res.status(404).json({ error: 'Ride not found.' });

  if (req.body.status === 'open' || req.body.status === 'matched') {
    ride.status = req.body.status;
  }
  writeRides(rides);
  res.json(ride);
});

// DELETE a ride
app.delete('/api/rides/:id', (req, res) => {
  const rides = readRides();
  const next = rides.filter(r => r.id !== req.params.id);
  if (next.length === rides.length) return res.status(404).json({ error: 'Ride not found.' });
  writeRides(next);
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Saathi Sawaari running at http://localhost:${PORT}`);
});
