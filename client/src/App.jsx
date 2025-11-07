import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import AIChat from './pages/AIChat'
import Invoices from './pages/Invoices'
import Clients from './pages/Clients'
import Purchases from './pages/Purchases'
import Reports from './pages/Reports'
import Setup from './pages/Setup'
import Sales from './pages/Sales'
import Inventory from './pages/Inventory'
import CreateBill from './pages/CreateBill'
import ChatModal from './components/ChatModal'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001';

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // try to fetch current user
    fetch(`${API_BASE}/api/auth/me`, {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">M</div>
          <h1>Magnus Pharma</h1>
        </div>
        <nav className="nav-links">
          <Link to="/dashboard">📊 Dashboard</Link>
          <Link to="/invoices">🧾 Invoices</Link>
          <Link to="/clients">👥 Clients</Link>
          <Link to="/sales">💰 Sales</Link>
          <Link to="/inventory">📦 Inventory</Link>
          <Link to="/create-bill">➕ Create Bill</Link>
          <Link to="/ai">🤖 AI Assistant</Link>
          <Link to="/reports">📈 Reports</Link>
          <Link to="/setup">⚙️ Setup</Link>
        </nav>
      </aside>

      <main className="main">
        <div className="header">
          <div className="title">GST Dashboard</div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <button className="btn-danger" onClick={async ()=>{ await fetch((import.meta.env.VITE_API_BASE||'http://localhost:5000') + '/api/admin/clear',{method:'POST',credentials:'include'}).catch(()=>{}); alert('Clear request sent') }}>Clear All Data</button>
            {user ? (
              <>
                <div style={{color:'#0f1724',fontWeight:700}}>{user.name || user.email}</div>
                <button className="btn secondary" onClick={async ()=>{ await fetch((import.meta.env.VITE_API_BASE||'http://localhost:5000') + '/api/auth/logout',{method:'POST',credentials:'include'}); setUser(null); window.location='/login' }}>Logout</button>
              </>
            ) : (
              <>
                <a href="/login" className="btn secondary">Login</a>
                <a href="/signup" className="btn" style={{marginLeft:6}}>Signup</a>
              </>
            )}
          </div>
        </div>

        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard user={user} setUser={setUser} />} />
          <Route path="/invoices" element={<Invoices user={user} />} />
          <Route path="/clients" element={<Clients user={user} />} />
          <Route path="/ai" element={<AIChat user={user} />} />
          <Route path="/sales" element={<Sales user={user} />} />
          <Route path="/inventory" element={<Inventory user={user} />} />
          <Route path="/create-bill" element={<CreateBill user={user} />} />
          <Route path="/purchases" element={<Purchases user={user} />} />
          <Route path="/reports" element={<Reports user={user} />} />
          <Route path="/setup" element={<Setup user={user} />} />
        </Routes>
      </main>

      {/* Floating AI assistant button + modal */}
      <ChatModal />
    </div>
  )
}

export default App
