import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Inventory.css';

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [updatingPrices, setUpdatingPrices] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const response = await axios.get('/api/inventory');
      setInventory(response.data);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrices = async () => {
    setUpdatingPrices(true);
    try {
      await axios.post('/api/inventory/update-prices');
      await loadInventory();
      alert('Prices updated successfully!');
    } catch (error) {
      console.error('Error updating prices:', error);
      alert('Error updating prices');
    } finally {
      setUpdatingPrices(false);
    }
  };

  const deleteCard = async (id) => {
    if (!window.confirm('Are you sure you want to delete this card?')) return;
    
    try {
      await axios.delete(`/api/inventory/${id}`);
      await loadInventory();
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const updateQuantity = async (id, newQuantity) => {
    if (newQuantity < 0) return;
    
    try {
      await axios.put(`/api/inventory/${id}`, { quantity: newQuantity });
      await loadInventory();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const filteredInventory = inventory
    .filter(card => {
      const matchesSearch = card.name.toLowerCase().includes(filter.toLowerCase()) ||
                           card.type_line?.toLowerCase().includes(filter.toLowerCase());
      const matchesColor = colorFilter === 'all' || 
                          (colorFilter === 'colorless' && !card.colors) ||
                          (card.colors && card.colors.includes(colorFilter));
      return matchesSearch && matchesColor;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'quantity') return b.quantity - a.quantity;
      if (sortBy === 'price') {
        const priceA = a.foil ? (a.price_usd_foil || 0) : (a.price_usd || 0);
        const priceB = b.foil ? (b.price_usd_foil || 0) : (b.price_usd || 0);
        return priceB - priceA;
      }
      return 0;
    });

  const totalValue = filteredInventory.reduce((sum, card) => {
    const price = card.foil ? (card.price_usd_foil || 0) : (card.price_usd || 0);
    return sum + (price * card.quantity);
  }, 0);

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="inventory">
      <div className="flex-between mb-3">
        <h1 className="page-title">Inventory</h1>
        <button 
          className="btn btn-primary" 
          onClick={updatePrices}
          disabled={updatingPrices}
        >
          {updatingPrices ? 'Updating...' : '🔄 Update Prices'}
        </button>
      </div>

      <div className="card mb-3">
        <div className="filters">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search cards..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-group">
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

          <div className="filter-group">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Sort by Name</option>
              <option value="quantity">Sort by Quantity</option>
              <option value="price">Sort by Price</option>
            </select>
          </div>
        </div>

        <div className="inventory-stats">
          <span>{filteredInventory.length} cards</span>
          <span className="stat-divider">•</span>
          <span>Total Value: ${totalValue.toFixed(2)}</span>
        </div>
      </div>

      {filteredInventory.length === 0 ? (
        <div className="card text-center">
          <p className="empty-state">No cards found. Start by adding cards to your inventory!</p>
        </div>
      ) : (
        <div className="inventory-grid">
          {filteredInventory.map(card => (
            <div key={card.id} className="inventory-card">
              {card.image_url && (
                <div className="card-image-container">
                  <img src={card.image_url} alt={card.name} className="card-image" />
                </div>
              )}
              
              <div className="card-details">
                <h3 className="card-name">
                  {card.name}
                  {card.foil === 1 && <span className="foil-badge">✨ Foil</span>}
                </h3>
                
                <div className="card-info">
                  <span className="card-set">{card.set_name}</span>
                  {card.colors && (
                    <div className="card-colors">
                      {card.colors.split(',').map((color, idx) => (
                        <span key={idx} className={`color-badge color-${color}`}></span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card-meta">
                  <span className="rarity rarity-${card.rarity}">{card.rarity}</span>
                  <span className="condition">{card.condition}</span>
                </div>

                <div className="card-price">
                  {card.foil ? 
                    (card.price_usd_foil ? `$${card.price_usd_foil}` : 'N/A') :
                    (card.price_usd ? `$${card.price_usd}` : 'N/A')
                  }
                </div>

                <div className="card-actions">
                  <div className="quantity-controls">
                    <button 
                      className="qty-btn"
                      onClick={() => updateQuantity(card.id, card.quantity - 1)}
                    >
                      -
                    </button>
                    <span className="quantity">{card.quantity}</span>
                    <button 
                      className="qty-btn"
                      onClick={() => updateQuantity(card.id, card.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  
                  <button 
                    className="btn-delete"
                    onClick={() => deleteCard(card.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Inventory;
