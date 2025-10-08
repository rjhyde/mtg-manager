import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AddCard.css';

function AddCard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [foil, setFoil] = useState(false);
  const [condition, setCondition] = useState('Near Mint');
  const [adding, setAdding] = useState(false);

  const searchCards = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await axios.get('/api/cards/search', {
        params: { q: searchQuery }
      });
      setSearchResults(response.data.data || []);
    } catch (error) {
      console.error('Error searching cards:', error);
      alert('Error searching for cards. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const selectCard = (card) => {
    setSelectedCard(card);
    setSearchResults([]);
  };

  const addToInventory = async () => {
    if (!selectedCard) return;

    setAdding(true);
    try {
      await axios.post('/api/inventory', {
        scryfall_id: selectedCard.id,
        quantity,
        foil,
        condition
      });
      
      alert('Card added to inventory!');
      
      // Reset form
      setSelectedCard(null);
      setSearchQuery('');
      setQuantity(1);
      setFoil(false);
      setCondition('Near Mint');
      
      // Navigate to inventory
      navigate('/inventory');
    } catch (error) {
      console.error('Error adding card:', error);
      alert('Error adding card to inventory');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="add-card">
      <h1 className="page-title">Add Card to Inventory</h1>

      <div className="card">
        <form onSubmit={searchCards} className="search-form">
          <div className="search-group">
            <input
              type="text"
              placeholder="Search for a card (e.g., 'Black Lotus', 'Lightning Bolt', 'commander deck')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-large"
            />
            <button type="submit" className="btn btn-primary" disabled={searching}>
              {searching ? 'Searching...' : '🔍 Search'}
            </button>
          </div>
        </form>

        {searchResults.length > 0 && (
          <div className="search-results">
            <h3 className="results-title">Search Results ({searchResults.length})</h3>
            <div className="results-grid">
              {searchResults.map(card => (
                <div 
                  key={card.id} 
                  className="result-card"
                  onClick={() => selectCard(card)}
                >
                  <div className="result-image">
                    <img 
                      src={card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small} 
                      alt={card.name}
                    />
                  </div>
                  <div className="result-info">
                    <div className="result-name">{card.name}</div>
                    <div className="result-set">{card.set_name}</div>
                    <div className="result-price">
                      {card.prices?.usd ? `$${card.prices.usd}` : 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedCard && (
        <div className="card mt-3">
          <h2 className="section-title">Selected Card</h2>
          
          <div className="selected-card-container">
            <div className="selected-card-image">
              <img 
                src={selectedCard.image_uris?.normal || selectedCard.card_faces?.[0]?.image_uris?.normal} 
                alt={selectedCard.name}
              />
            </div>

            <div className="selected-card-form">
              <h3>{selectedCard.name}</h3>
              <p className="card-type">{selectedCard.type_line}</p>
              <p className="card-set-info">{selectedCard.set_name} • {selectedCard.rarity}</p>

              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={foil}
                    onChange={(e) => setFoil(e.target.checked)}
                    className="checkbox"
                  />
                  <span className="checkbox-label">Foil</span>
                </label>
              </div>

              <div className="form-group">
                <label>Condition</label>
                <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                  <option value="Near Mint">Near Mint</option>
                  <option value="Lightly Played">Lightly Played</option>
                  <option value="Moderately Played">Moderately Played</option>
                  <option value="Heavily Played">Heavily Played</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>

              <div className="price-info">
                <strong>Price: </strong>
                {foil ? 
                  (selectedCard.prices?.usd_foil ? `$${selectedCard.prices.usd_foil}` : 'N/A') :
                  (selectedCard.prices?.usd ? `$${selectedCard.prices.usd}` : 'N/A')
                }
              </div>

              <div className="form-actions">
                <button 
                  className="btn btn-success btn-lg"
                  onClick={addToInventory}
                  disabled={adding}
                >
                  {adding ? 'Adding...' : '✓ Add to Inventory'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setSelectedCard(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddCard;
