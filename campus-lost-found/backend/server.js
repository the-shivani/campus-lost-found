const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Item = require('./models/Item');

const app = express();
const PORT = 3000;
const MONGO_URI = 'mongodb://127.0.0.1:27017/lostfound';

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ── Routes ──────────────────────────────────────────────

// POST /add → Add a new item
app.post('/add', async (req, res) => {
  try {
    const { item_name, location, contact, date, type } = req.body;
    const newItem = new Item({ item_name, location, contact, date, type });
    const saved = await newItem.save();
    res.status(201).json({ message: 'Item added successfully', item: saved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /items → Fetch all items
app.get('/items', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /delete/:id → Delete an item
app.delete('/delete/:id', async (req, res) => {
  try {
    const deleted = await Item.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /return/:id → Mark item as returned
app.put('/return/:id', async (req, res) => {
  try {
    const updated = await Item.findByIdAndUpdate(
      req.params.id,
      { status: 'returned' },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item marked as returned', item: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
