import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get('/api/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  const colorMap = {
    'W': 'White',
    'U': 'Blue',
    'B': 'Black',
    'R': 'Red',
    'G': 'Green',
    '': 'Colorless'
  };

  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.totalCards || 0}</div>
            <div className="stat-label">Total Cards</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎴</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.uniqueCards || 0}</div>
            <div className="stat-label">Unique Cards</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">${(stats?.totalValue || 0).toFixed(2)}</div>
            <div className="stat-label">Collection Value</div>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <h2 className="section-title">Cards by Color</h2>
        <div className="color-breakdown">
          {stats?.byColor?.map((item) => (
            <div key={item.colors} className="color-item">
              <div className="color-badges">
                {item.colors ? (
                  item.colors.split(',').map((color, idx) => (
                    <span key={idx} className={`color-badge color-${color}`} title={colorMap[color] || color}></span>
                  ))
                ) : (
                  <span className="color-badge color-C" title="Colorless"></span>
                )}
              </div>
              <div className="color-count">{item.count} cards</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mt-4">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions">
          <a href="/add-card" className="action-btn">
            <span className="action-icon">➕</span>
            <span>Add Cards to Inventory</span>
          </a>
          <a href="/inventory" className="action-btn">
            <span className="action-icon">📋</span>
            <span>View Inventory</span>
          </a>
          <a href="/decks" className="action-btn">
            <span className="action-icon">🎯</span>
            <span>Build a Deck</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
