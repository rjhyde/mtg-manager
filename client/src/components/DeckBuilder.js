import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './DeckBuilder.css';

function DeckBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('all');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    try {
      const [deckResponse, inventoryResponse] = await Promise.all([
        axios.get(`/api/decks/${id}`),
        axios.get('/api/inventory')
      ]);
      setDeck(deckResponse.data);
      setInventory(inventoryResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCardToDeck = async (inventoryId, category = 'mainboard') => {
    try {
      await axios.post(`/api/decks/${id}/cards`, {
        inventory_id: inventoryId,
        quantity: 1,
        category
      });
      await loadData();
    } catch (error) {
      console.error('Error adding card to deck:', error);
    }
  };

  const removeCardFromDeck = async (deckCardId) => {
    try {
      await axios.delete(`/api/decks/${id}/cards/${deckCardId}`);
      await loadData();
    } catch (error) {
      console.error('Error removing card from deck:', error);
    }
  };

  const filteredInventory = inventory.filter(card => {
    // Don't show cards already in deck
    const alreadyInDeck = deck?.cards?.some(dc => dc.inventory_id === card.id);
    if (alreadyInDeck) return false;

    const matchesSearch = card.name.toLowerCase().includes(filter.toLowerCase()) ||
                         card.type_line?.toLowerCase().includes(filter.toLowerCase());
    const matchesColor = colorFilter === 'all' || 
                        (colorFilter === 'colorless' && !card.colors) ||
                        (card.colors && card.colors.includes(colorFilter));
    return matchesSearch && matchesColor;
  });

  const mainboard = deck?.cards?.filter(c => c.category === 'mainboard') || [];
  const sideboard = deck?.cards?.filter(c => c.category === 'sideboard') || [];
  
  const mainboardCount = mainboard.reduce((sum, c) => sum + c.quantity, 0);
  const sideboardCount = sideboard.reduce((sum, c) => sum + c.quantity, 0);

  const deckValue = deck?.cards?.reduce((sum, card) => {
    const price = card.foil ? (card.price_usd_foil || 0) : (card.price_usd || 0);
    return sum + (price * card.quantity);
  }, 0) || 0;

  // Format validation
  const formatRules = {
    'Standard': { minDeck: 60, maxDeck: Infinity, sideboard: 15, maxCopies: 4 },
    'Pioneer': { minDeck: 60, maxDeck: Infinity, sideboard: 15, maxCopies: 4 },
    'Modern': { minDeck: 60, maxDeck: Infinity, sideboard: 15, maxCopies: 4 },
    'Legacy': { minDeck: 60, maxDeck: Infinity, sideboard: 15, maxCopies: 4 },
    'Vintage': { minDeck: 60, maxDeck: Infinity, sideboard: 15, maxCopies: 4 },
    'Commander': { minDeck: 100, maxDeck: 100, sideboard: 0, maxCopies: 1 },
    'Pauper': { minDeck: 60, maxDeck: Infinity, sideboard: 15, maxCopies: 4 },
    'Historic': { minDeck: 60, maxDeck: Infinity, sideboard: 15, maxCopies: 4 },
    'Alchemy': { minDeck: 60, maxDeck: Infinity, sideboard: 15, maxCopies: 4 },
    'Casual': { minDeck: 0, maxDeck: Infinity, sideboard: Infinity, maxCopies: Infinity }
  };

  const rules = formatRules[deck?.format] || formatRules['Casual'];
  const isValidDeckSize = mainboardCount >= rules.minDeck && mainboardCount <= rules.maxDeck;
  const isValidSideboard = sideboardCount <= rules.sideboard;

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!deck) {
    return <div className="card">Deck not found</div>;
  }

  return (
    <div className="deck-builder">
      <div className="deck-header-section">
        <button className="btn btn-secondary" onClick={() => navigate('/decks')}>
          ← Back to Decks
        </button>
        <h1 className="page-title">{deck.name}</h1>
        <span className="format-badge">{deck.format}</span>
      </div>

      <div className="deck-stats-bar">
        <div className="stat">
          <span className="stat-label">Mainboard:</span>
          <span className={`stat-value ${isValidDeckSize ? 'valid' : 'invalid'}`}>
            {mainboardCount} / {rules.minDeck}{rules.maxDeck !== Infinity && `-${rules.maxDeck}`}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Sideboard:</span>
          <span className={`stat-value ${isValidSideboard ? 'valid' : 'invalid'}`}>
            {sideboardCount} / {rules.sideboard}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Value:</span>
          <span className="stat-value">${deckValue.toFixed(2)}</span>
        </div>
      </div>

      <div className="deck-builder-content">
        {/* Deck List */}
        <div className="deck-list-section">
          <div className="card">
            <h2 className="section-title">Mainboard ({mainboardCount})</h2>
            {mainboard.length === 0 ? (
              <p className="empty-message">No cards in mainboard yet</p>
            ) : (
              <div className="deck-list">
                {mainboard.map(card => (
                  <div key={card.id} className="deck-list-item">
                    <span className="card-quantity">{card.quantity}x</span>
                    <span className="card-name">{card.name}</span>
                    <span className="card-price">
                      ${(card.foil ? (card.price_usd_foil || 0) : (card.price_usd || 0)).toFixed(2)}
                    </span>
                    <button 
                      className="remove-btn"
                      onClick={() => removeCardFromDeck(card.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {rules.sideboard > 0 && (
            <div className="card mt-3">
              <h2 className="section-title">Sideboard ({sideboardCount})</h2>
              {sideboard.length === 0 ? (
                <p className="empty-message">No cards in sideboard yet</p>
              ) : (
                <div className="deck-list">
                  {sideboard.map(card => (
                    <div key={card.id} className="deck-list-item">
                      <span className="card-quantity">{card.quantity}x</span>
                      <span className="card-name">{card.name}</span>
                      <span className="card-price">
                        ${(card.foil ? (card.price_usd_foil || 0) : (card.price_usd || 0)).toFixed(2)}
                      </span>
                      <button 
                        className="remove-btn"
                        onClick={() => removeCardFromDeck(card.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Available Cards */}
        <div className="available-cards-section">
          <div className="card">
            <h2 className="section-title">Add Cards from Inventory</h2>
            
            <div className="filters-compact">
              <input
                type="text"
                placeholder="Search..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="search-input"
              />
              
              <select value={colorFilter} onChange={(e) => setColorFilter(e.target.value)}>
                <option value="all">All Colors</option>
                <option value="W">White</option>
                <option value="U">Blue</option>
                <option value="B">Black</option>
                <option value="R">Red</option>
                <option value="G">Green</option>
                <option value="colorless">Colorless</option>
              </select>
            </div>

            <div className="available-cards-list">
              {filteredInventory.length === 0 ? (
                <p className="empty-message">No cards available</p>
              ) : (
                filteredInventory.map(card => (
                  <div key={card.id} className="available-card-item">
                    <div className="available-card-info">
                      {card.image_url && (
                        <img 
                          src={card.image_url} 
                          alt={card.name}
                          className="card-thumbnail"
                        />
                      )}
                      <div className="available-card-details">
                        <div className="available-card-name">{card.name}</div>
                        <div className="available-card-meta">
                          {card.type_line} • {card.quantity} available
                        </div>
                      </div>
                    </div>
                    <div className="add-buttons">
                      <button 
                        className="btn-add-main"
                        onClick={() => addCardToDeck(card.id, 'mainboard')}
                        title="Add to mainboard"
                      >
                        +M
                      </button>
                      {rules.sideboard > 0 && (
                        <button 
                          className="btn-add-side"
                          onClick={() => addCardToDeck(card.id, 'sideboard')}
                          title="Add to sideboard"
                        >
                          +S
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeckBuilder;
