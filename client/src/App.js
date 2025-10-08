import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Inventory from './components/Inventory';
import Decks from './components/Decks';
import DeckBuilder from './components/DeckBuilder';
import AddCard from './components/AddCard';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-logo">
              <span className="mana-symbols">⚔️</span> MTG Manager
            </h1>
            <ul className="nav-menu">
              <li className="nav-item">
                <Link to="/" className="nav-link">Dashboard</Link>
              </li>
              <li className="nav-item">
                <Link to="/inventory" className="nav-link">Inventory</Link>
              </li>
              <li className="nav-item">
                <Link to="/decks" className="nav-link">Decks</Link>
              </li>
              <li className="nav-item">
                <Link to="/add-card" className="nav-link add-card-btn">+ Add Card</Link>
              </li>
            </ul>
          </div>
        </nav>

        <div className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/decks" element={<Decks />} />
            <Route path="/decks/:id" element={<DeckBuilder />} />
            <Route path="/add-card" element={<AddCard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;