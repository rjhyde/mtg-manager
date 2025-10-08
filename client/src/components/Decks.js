import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Decks.css';

function Decks() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckFormat, setNewDeckFormat] = useState('Standard');
  const [newDeckDescription, setNewDeckDescription] = useState('');

  const formats = [
    'Standard',
    'Pioneer',
    'Modern',
    'Legacy',
    'Vintage',
    'Commander',
    'Pauper',
    'Historic',
    'Alchemy',
    'Casual'
  ];

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      const response = await axios.get('/api/decks');
      setDecks(response.data);
    } catch (error) {
      console.error('Error loading decks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDeck = async (e) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;

    try {
      await axios.post('/api/decks', {
        name: newDeckName,
        format: newDeckFormat,
        description: newDeckDescription
      });
      
      setNewDeckName('');
      setNewDeckFormat('Standard');
      setNewDeckDescription('');
      setShowNewDeck(false);
      await loadDecks();
    } catch (error) {
      console.error('Error creating deck:', error);
      alert('Error creating deck');
    }
  };

  const deleteDeck = async (id) => {
    if (!window.confirm('Are you sure you want to delete this deck?')) return;

    try {
      await axios.delete(`/api/decks/${id}`);
      await loadDecks();
    } catch (error) {
      console.error('Error deleting deck:', error);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="decks">
      <div className="flex-between mb-3">
        <h1 className="page-title">My Decks</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowNewDeck(!showNewDeck)}
        >
          {showNewDeck ? '✕ Cancel' : '+ New Deck'}
        </button>
      </div>

      {showNewDeck && (
        <div className="card mb-3">
          <h2 className="section-title">Create New Deck</h2>
          <form onSubmit={createDeck}>
            <div className="form-group">
              <label>Deck Name</label>
              <input
                type="text"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                placeholder="e.g., Mono Red Aggro"
                required
              />
            </div>

            <div className="form-group">
              <label>Format</label>
              <select 
                value={newDeckFormat}
                onChange={(e) => setNewDeckFormat(e.target.value)}
              >
                {formats.map(format => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                value={newDeckDescription}
                onChange={(e) => setNewDeckDescription(e.target.value)}
                placeholder="Describe your deck strategy..."
                rows="3"
              />
            </div>

            <button type="submit" className="btn btn-success">
              Create Deck
            </button>
          </form>
        </div>
      )}

      {decks.length === 0 ? (
        <div className="card text-center">
          <p className="empty-state">
            No decks yet. Create your first deck to get started!
          </p>
        </div>
      ) : (
        <div className="decks-grid">
          {decks.map(deck => (
            <div key={deck.id} className="deck-card">
              <div className="deck-header">
                <h3 className="deck-name">
                  <Link to={`/decks/${deck.id}`}>{deck.name}</Link>
                </h3>
                <span className="deck-format">{deck.format}</span>
              </div>

              {deck.description && (
                <p className="deck-description">{deck.description}</p>
              )}

              <div className="deck-meta">
                <span>Created: {new Date(deck.created_date).toLocaleDateString()}</span>
              </div>

              <div className="deck-actions">
                <Link to={`/decks/${deck.id}`} className="btn btn-primary">
                  📝 Edit Deck
                </Link>
                <button 
                  className="btn btn-danger"
                  onClick={() => deleteDeck(deck.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Decks;
