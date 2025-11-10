import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function Login({ setUser }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.email || !form.password) return setError('Email and password required');

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      let data = null;
      try { data = await res.json(); } catch (e) { data = null }
      if (!res.ok) {
        const msg = (data && data.message) || `Login failed (${res.status})`;
        console.error('Login failed response:', res.status, data);
        return setError(msg);
      }

      // login returned ok. server returns user object in body sometimes - use it if present
      if (data && data.user) {
        setUser(data.user);
      } else {
        // fetch user profile as fallback
        const me = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
        if (me.ok) {
          const meData = await me.json();
          setUser(meData);
        } else {
          console.warn('Profile fetch after login failed', me.status);
        }
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Login request error', err);
      setError('Server error: ' + (err.message || err));
    }
  };

  const checkServer = async ()=>{
    try{
      const r = await fetch(`${API_BASE}/api/health`);
      const j = await r.json().catch(()=>null);
      if(!r.ok) setError(`Health check failed (${r.status})`)
      else setError(`Server OK - mongoState=${j && j.mongoState}`)
    }catch(e){ setError('Health check error: '+e.message) }
  }

  return (
    <div className="auth-card">
      <h2>Log in</h2>
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input name="email" value={form.email} onChange={handleChange} />
        <label>Password</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} />
        {error && <p className="error">{error}</p>}
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button type="submit">Log in</button>
          <button type="button" onClick={checkServer} className="btn secondary">Check server</button>
        </div>
      </form>
    </div>
  )
}
