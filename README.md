# MTG Inventory Manager

A modern web application for managing your Magic: The Gathering card collection and building decks.

## Features

- 📦 **Card Inventory Management**
  - Add cards from Scryfall database with real-time search
  - Track quantity, condition, foil status, and colors
  - View card images and current prices
  - Filter by color, search by name/type
  - Update prices in real-time from Scryfall

- 🎯 **Deck Builder**
  - Create multiple decks for different formats
  - Supported formats: Standard, Modern, Commander, Legacy, Vintage, and more
  - Format validation (deck size, sideboard limits)
  - Track deck value
  - Build decks only from cards in your inventory

- 📊 **Dashboard**
  - View collection statistics
  - Total collection value
  - Cards by color breakdown
  - Quick actions

- 💰 **Real-time Pricing**
  - Integrated with Scryfall API
  - Live price updates for both regular and foil cards
  - Automatic collection value calculation

## Tech Stack

- **Frontend**: React with React Router
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Card Data**: Scryfall API
- **Styling**: Custom CSS with modern dark theme

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for instructions on deploying to Render (free hosting).

**Quick Deploy**: Push to GitHub, connect to Render, and deploy - takes 10 minutes!

## Local Development



### Prerequisites

- Node.js (v14 or higher)
- npm

### Setup

1. Clone or download this repository

2. Install dependencies:
```bash
npm run install-all
```

This will install dependencies for both the backend and frontend.

### Running the Application

#### Development Mode (Recommended)

Run both backend and frontend simultaneously:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend development server on `http://localhost:3000`

The app will automatically open in your browser at `http://localhost:3000`.

#### Running Separately

**Backend only:**
```bash
npm run server
```

**Frontend only:**
```bash
npm run client
```

## Usage Guide

### Adding Cards to Inventory

1. Click "Add Card" in the navigation
2. Search for a card by name (e.g., "Lightning Bolt", "Black Lotus")
3. Select the card from search results
4. Configure:
   - Quantity
   - Foil status
   - Condition (Near Mint, Lightly Played, etc.)
5. Click "Add to Inventory"

### Managing Inventory

1. Go to "Inventory" page
2. Use filters to find specific cards:
   - Search by name or type
   - Filter by color
   - Sort by name, quantity, or price
3. Adjust quantities with +/- buttons
4. Delete cards you no longer own
5. Click "Update Prices" to refresh all card prices

### Building Decks

1. Go to "Decks" page
2. Click "New Deck"
3. Enter deck name, format, and description
4. Click into the deck to start building
5. Add cards from your inventory:
   - Use search and color filters
   - Click "+M" to add to mainboard
   - Click "+S" to add to sideboard (if format allows)
6. The deck builder shows:
   - Format validation status
   - Card counts
   - Total deck value

### Formats Supported

- **Standard**: 60+ card minimum, 15 card sideboard, 4 copies max
- **Modern**: 60+ card minimum, 15 card sideboard, 4 copies max
- **Commander**: Exactly 100 cards, 1 copy max (singleton)
- **Legacy**: 60+ card minimum, 15 card sideboard, 4 copies max
- **Vintage**: 60+ card minimum, 15 card sideboard, 4 copies max
- **Pioneer**: 60+ card minimum, 15 card sideboard, 4 copies max
- **Pauper**: 60+ card minimum, 15 card sideboard, 4 copies max
- **Casual**: No restrictions

## Database

The application uses SQLite with a local database file (`backend/mtg.db`) that is automatically created on first run. Your data persists between sessions.

### Database Schema

- **inventory**: Stores your card collection
- **decks**: Stores deck metadata
- **deck_cards**: Links cards to decks with quantities

## API Endpoints

### Inventory
- `GET /api/inventory` - Get all cards in inventory
- `GET /api/inventory/:id` - Get single card
- `POST /api/inventory` - Add card to inventory
- `PUT /api/inventory/:id` - Update card details
- `DELETE /api/inventory/:id` - Remove card
- `POST /api/inventory/update-prices` - Update all prices

### Decks
- `GET /api/decks` - Get all decks
- `GET /api/decks/:id` - Get deck with cards
- `POST /api/decks` - Create new deck
- `PUT /api/decks/:id` - Update deck
- `DELETE /api/decks/:id` - Delete deck
- `POST /api/decks/:id/cards` - Add card to deck
- `DELETE /api/decks/:deckId/cards/:cardId` - Remove card from deck

### Cards (Scryfall)
- `GET /api/cards/search?q=query` - Search for cards
- `GET /api/cards/named?name=cardname` - Get card by name

### Statistics
- `GET /api/stats` - Get collection statistics

## Troubleshooting

### Port Already in Use

If port 5000 or 3000 is already in use:

```bash
# Change backend port
PORT=5001 npm run server

# Frontend proxy will need to be updated in client/package.json
```

### Database Issues

If you encounter database errors, delete `backend/mtg.db` and restart the server. A fresh database will be created.

### Scryfall API Rate Limiting

The Scryfall API requests a delay of 50-100ms between requests. The price update feature respects this limit automatically.

## Future Enhancements

Potential features to add:
- Export deck lists to various formats (Arena, MTGO, text)
- Import collection from CSV
- Advanced statistics and charts
- Card trading/wishlist features
- Multi-user support with authentication
- Mobile app version
- Card condition images
- Purchase history tracking

## Credits

- Card data and images provided by [Scryfall](https://scryfall.com/)
- Built with React and Express
- Dark theme inspired by modern MTG Arena UI

## License

This is a personal project for managing your MTG collection. Card data is provided by Scryfall under their terms of service.

---

Enjoy managing your Magic: The Gathering collection! 🎴✨
