import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001';

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
        let data = null
        try { data = await res.json() } catch(e){ data = null }
        if (!res.ok) return setError((data && data.message) || `Login failed (${res.status})`);

        // login returned ok. server returns user object in body sometimes - use it if present
        if (data && data.user) {
          setUser(data.user)
        } else {
          // fetch user profile as fallback
          const me = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
          if (me.ok) {
            const meData = await me.json();
            setUser(meData);
          }
        }
        navigate('/dashboard');
    } catch (err) {
      setError('Server error');
    }
  };

  return (
    <div className="auth-card">
      <h2>Log in</h2>
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input name="email" value={form.email} onChange={handleChange} />
        <label>Password</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} />
        {error && <p className="error">{error}</p>}
        <button type="submit">Log in</button>
      </form>
    </div>
  )
}
