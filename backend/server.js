const express = require('express');
const cors = require('cors');
const initSqlJs = require('sql.js');
const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Initialize Database
let db;
const dbPath = path.join(__dirname, 'mtg.db');

async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Try to load existing database
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      set_code TEXT,
      set_name TEXT,
      collector_number TEXT,
      quantity INTEGER DEFAULT 1,
      foil INTEGER DEFAULT 0,
      condition TEXT DEFAULT 'Near Mint',
      colors TEXT,
      mana_cost TEXT,
      type_line TEXT,
      rarity TEXT,
      image_url TEXT,
      scryfall_id TEXT,
      price_usd REAL,
      price_usd_foil REAL,
      last_price_update TEXT,
      added_date TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      format TEXT,
      description TEXT,
      created_date TEXT,
      updated_date TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS deck_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id INTEGER NOT NULL,
      inventory_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      category TEXT DEFAULT 'mainboard'
    );
  `);

  saveDatabase();
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function resultToArray(result) {
  if (result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

// Scryfall API helper
async function searchScryfall(query) {
  const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Card not found');
  }
  return await response.json();
}

async function getCardByName(name) {
  const url = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Card not found');
  }
  return await response.json();
}

async function getCardById(scryfallId) {
  const url = `https://api.scryfall.com/cards/${scryfallId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Card not found');
  }
  return await response.json();
}

// Routes

// Search Scryfall for cards
app.get('/api/cards/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter required' });
    }
    const data = await searchScryfall(q);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get card details by name
app.get('/api/cards/named', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ error: 'Name parameter required' });
    }
    const card = await getCardByName(name);
    res.json(card);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all inventory
app.get('/api/inventory', (req, res) => {
  try {
    const result = db.exec('SELECT * FROM inventory ORDER BY name');
    const cards = resultToArray(result);
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single inventory item
app.get('/api/inventory/:id', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM inventory WHERE id = ?');
    stmt.bind([parseInt(req.params.id)]);
    const result = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      result.push(row);
    }
    stmt.free();
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add card to inventory
app.post('/api/inventory', async (req, res) => {
  try {
    const { scryfall_id, quantity, foil, condition } = req.body;
    
    // Fetch card data from Scryfall
    const card = await getCardById(scryfall_id);
    
    // Check if card already exists
    const stmt = db.prepare('SELECT * FROM inventory WHERE scryfall_id = ? AND foil = ?');
    stmt.bind([scryfall_id, foil ? 1 : 0]);
    const existing = [];
    while (stmt.step()) {
      existing.push(stmt.getAsObject());
    }
    stmt.free();
    
    if (existing.length > 0) {
      // Update quantity
      const newQuantity = existing[0].quantity + (quantity || 1);
      const updateStmt = db.prepare('UPDATE inventory SET quantity = ? WHERE id = ?');
      updateStmt.bind([newQuantity, existing[0].id]);
      updateStmt.step();
      updateStmt.free();
      saveDatabase();
      
      const resultStmt = db.prepare('SELECT * FROM inventory WHERE id = ?');
      resultStmt.bind([existing[0].id]);
      const updated = [];
      while (resultStmt.step()) {
        updated.push(resultStmt.getAsObject());
      }
      resultStmt.free();
      return res.json(updated[0]);
    }
    
    // Insert new card
    const colors = card.colors ? card.colors.join(',') : '';
    const imageUrl = card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || '';
    const now = new Date().toISOString();
    
    const insertStmt = db.prepare(`
      INSERT INTO inventory (
        name, set_code, set_name, collector_number, quantity, foil, condition,
        colors, mana_cost, type_line, rarity, image_url, scryfall_id,
        price_usd, price_usd_foil, last_price_update, added_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertStmt.bind([
      card.name,
      card.set,
      card.set_name,
      card.collector_number,
      quantity || 1,
      foil ? 1 : 0,
      condition || 'Near Mint',
      colors,
      card.mana_cost || '',
      card.type_line,
      card.rarity,
      imageUrl,
      card.id,
      parseFloat(card.prices?.usd) || null,
      parseFloat(card.prices?.usd_foil) || null,
      now,
      now
    ]);
    insertStmt.step();
    insertStmt.free();
    saveDatabase();
    
    // Get the inserted card
    const result = db.exec('SELECT * FROM inventory ORDER BY id DESC LIMIT 1');
    const newCard = resultToArray(result)[0];
    res.json(newCard);
  } catch (error) {
    console.error('Error adding card:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update inventory item
app.put('/api/inventory/:id', (req, res) => {
  try {
    const { quantity, foil, condition } = req.body;
    const updates = [];
    const values = [];
    
    if (quantity !== undefined) {
      updates.push('quantity = ?');
      values.push(quantity);
    }
    if (foil !== undefined) {
      updates.push('foil = ?');
      values.push(foil ? 1 : 0);
    }
    if (condition !== undefined) {
      updates.push('condition = ?');
      values.push(condition);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    values.push(parseInt(req.params.id));
    const stmt = db.prepare(`UPDATE inventory SET ${updates.join(', ')} WHERE id = ?`);
    stmt.bind(values);
    stmt.step();
    stmt.free();
    saveDatabase();
    
    const resultStmt = db.prepare('SELECT * FROM inventory WHERE id = ?');
    resultStmt.bind([parseInt(req.params.id)]);
    const updated = [];
    while (resultStmt.step()) {
      updated.push(resultStmt.getAsObject());
    }
    resultStmt.free();
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete inventory item
app.delete('/api/inventory/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM inventory WHERE id = ?');
    stmt.bind([parseInt(req.params.id)]);
    stmt.step();
    stmt.free();
    saveDatabase();
    res.json({ message: 'Card deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update prices for all inventory
app.post('/api/inventory/update-prices', async (req, res) => {
  try {
    const result = db.exec('SELECT id, scryfall_id FROM inventory');
    const cards = resultToArray(result);
    
    if (cards.length === 0) {
      return res.json({ message: 'No cards to update' });
    }
    
    let updated = 0;
    
    for (const card of cards) {
      try {
        const scryfallCard = await getCardById(card.scryfall_id);
        const now = new Date().toISOString();
        const stmt = db.prepare(`
          UPDATE inventory 
          SET price_usd = ?, price_usd_foil = ?, last_price_update = ?
          WHERE id = ?
        `);
        stmt.bind([
          parseFloat(scryfallCard.prices?.usd) || null,
          parseFloat(scryfallCard.prices?.usd_foil) || null,
          now,
          card.id
        ]);
        stmt.step();
        stmt.free();
        updated++;
        // Rate limiting - Scryfall requests 50-100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to update price for card ${card.id}:`, error.message);
      }
    }
    
    saveDatabase();
    res.json({ message: `Updated prices for ${updated} cards` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all decks
app.get('/api/decks', (req, res) => {
  try {
    const result = db.exec('SELECT * FROM decks ORDER BY updated_date DESC');
    const decks = resultToArray(result);
    res.json(decks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single deck with cards
app.get('/api/decks/:id', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM decks WHERE id = ?');
    stmt.bind([parseInt(req.params.id)]);
    const deckResult = [];
    while (stmt.step()) {
      deckResult.push(stmt.getAsObject());
    }
    stmt.free();
    
    if (deckResult.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    const deck = deckResult[0];
    
    const cardsStmt = db.prepare(`
      SELECT dc.id, dc.deck_id, dc.inventory_id, dc.quantity, dc.category,
             i.name, i.set_code, i.set_name, i.collector_number, i.foil, i.condition,
             i.colors, i.mana_cost, i.type_line, i.rarity, i.image_url, i.scryfall_id,
             i.price_usd, i.price_usd_foil
      FROM deck_cards dc 
      JOIN inventory i ON dc.inventory_id = i.id 
      WHERE dc.deck_id = ?
    `);
    cardsStmt.bind([parseInt(req.params.id)]);
    
    const cards = [];
    while (cardsStmt.step()) {
      cards.push(cardsStmt.getAsObject());
    }
    cardsStmt.free();
    
    deck.cards = cards;
    res.json(deck);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create deck
app.post('/api/decks', (req, res) => {
  try {
    const { name, format, description } = req.body;
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO decks (name, format, description, created_date, updated_date) 
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.bind([name, format || '', description || '', now, now]);
    stmt.step();
    stmt.free();
    saveDatabase();
    
    const result = db.exec('SELECT * FROM decks ORDER BY id DESC LIMIT 1');
    const newDeck = resultToArray(result)[0];
    res.json(newDeck);
  } catch (error) {
    console.error('Error creating deck:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update deck
app.put('/api/decks/:id', (req, res) => {
  try {
    const { name, format, description } = req.body;
    const now = new Date().toISOString();
    
    // Get current values
    const getStmt = db.prepare('SELECT * FROM decks WHERE id = ?');
    getStmt.bind([parseInt(req.params.id)]);
    const current = [];
    while (getStmt.step()) {
      current.push(getStmt.getAsObject());
    }
    getStmt.free();
    
    if (current.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    const updateStmt = db.prepare(`
      UPDATE decks 
      SET name = ?, format = ?, description = ?, updated_date = ?
      WHERE id = ?
    `);
    updateStmt.bind([
      name || current[0].name,
      format || current[0].format,
      description || current[0].description,
      now,
      parseInt(req.params.id)
    ]);
    updateStmt.step();
    updateStmt.free();
    saveDatabase();
    
    const resultStmt = db.prepare('SELECT * FROM decks WHERE id = ?');
    resultStmt.bind([parseInt(req.params.id)]);
    const updated = [];
    while (resultStmt.step()) {
      updated.push(resultStmt.getAsObject());
    }
    resultStmt.free();
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete deck
app.delete('/api/decks/:id', (req, res) => {
  try {
    // Delete deck cards first
    const deleteCardsStmt = db.prepare('DELETE FROM deck_cards WHERE deck_id = ?');
    deleteCardsStmt.bind([parseInt(req.params.id)]);
    deleteCardsStmt.step();
    deleteCardsStmt.free();
    
    // Delete deck
    const stmt = db.prepare('DELETE FROM decks WHERE id = ?');
    stmt.bind([parseInt(req.params.id)]);
    stmt.step();
    stmt.free();
    saveDatabase();
    res.json({ message: 'Deck deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add card to deck
app.post('/api/decks/:id/cards', (req, res) => {
  try {
    const { inventory_id, quantity, category } = req.body;
    const deckId = parseInt(req.params.id);
    
    // Check if card is already in deck
    const checkStmt = db.prepare(`
      SELECT * FROM deck_cards 
      WHERE deck_id = ? AND inventory_id = ? AND category = ?
    `);
    checkStmt.bind([deckId, inventory_id, category || 'mainboard']);
    
    const existing = [];
    while (checkStmt.step()) {
      existing.push(checkStmt.getAsObject());
    }
    checkStmt.free();
    
    if (existing.length > 0) {
      // Update quantity
      const newQuantity = existing[0].quantity + (quantity || 1);
      const updateStmt = db.prepare('UPDATE deck_cards SET quantity = ? WHERE id = ?');
      updateStmt.bind([newQuantity, existing[0].id]);
      updateStmt.step();
      updateStmt.free();
    } else {
      // Insert new
      const insertStmt = db.prepare(`
        INSERT INTO deck_cards (deck_id, inventory_id, quantity, category) 
        VALUES (?, ?, ?, ?)
      `);
      insertStmt.bind([deckId, inventory_id, quantity || 1, category || 'mainboard']);
      insertStmt.step();
      insertStmt.free();
    }
    
    // Update deck timestamp
    const now = new Date().toISOString();
    const updateDeckStmt = db.prepare('UPDATE decks SET updated_date = ? WHERE id = ?');
    updateDeckStmt.bind([now, deckId]);
    updateDeckStmt.step();
    updateDeckStmt.free();
    
    saveDatabase();
    res.json({ message: 'Card added to deck' });
  } catch (error) {
    console.error('Error adding card to deck:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove card from deck
app.delete('/api/decks/:deckId/cards/:cardId', (req, res) => {
  try {
    const deckId = parseInt(req.params.deckId);
    const cardId = parseInt(req.params.cardId);
    
    const stmt = db.prepare('DELETE FROM deck_cards WHERE deck_id = ? AND id = ?');
    stmt.bind([deckId, cardId]);
    stmt.step();
    stmt.free();
    
    const now = new Date().toISOString();
    const updateStmt = db.prepare('UPDATE decks SET updated_date = ? WHERE id = ?');
    updateStmt.bind([now, deckId]);
    updateStmt.step();
    updateStmt.free();
    
    saveDatabase();
    res.json({ message: 'Card removed from deck' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory statistics
app.get('/api/stats', (req, res) => {
  try {
    const totalResult = db.exec('SELECT SUM(quantity) as total FROM inventory');
    const totalCards = resultToArray(totalResult)[0]?.total || 0;
    
    const uniqueResult = db.exec('SELECT COUNT(*) as count FROM inventory');
    const uniqueCards = resultToArray(uniqueResult)[0]?.count || 0;
    
    const valueResult = db.exec(`
      SELECT SUM(CASE WHEN foil = 1 THEN price_usd_foil ELSE price_usd END * quantity) as value 
      FROM inventory
    `);
    const totalValue = resultToArray(valueResult)[0]?.value || 0;
    
    const colorResult = db.exec(`
      SELECT colors, SUM(quantity) as count 
      FROM inventory 
      GROUP BY colors
    `);
    const byColor = resultToArray(colorResult);
    
    res.json({
      totalCards,
      uniqueCards,
      totalValue,
      byColor
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve React app for any other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});