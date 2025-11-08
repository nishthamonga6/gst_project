import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.email || !form.password) return setError('All fields required');

    try {
        const res = await fetch(`${API_BASE}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        let data = null
        try { data = await res.json() } catch(e){ data = null }
        if (!res.ok) return setError((data && data.message) || `Signup failed (${res.status})`);

        // auto-login after signup: call login endpoint to set cookie and user
        const loginResp = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({ email: form.email, password: form.password })
        });
        if (loginResp.ok) {
          const loginData = await loginResp.json().catch(()=>null)
          if (loginData && loginData.user) setUser && setUser(loginData.user)
          else {
            const me = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
            if (me.ok){ const meData = await me.json(); setUser && setUser(meData) }
          }
          navigate('/dashboard')
        } else {
          navigate('/login');
        }
    } catch (err) {
      setError('Server error');
    }
  };

  return (
    <div className="auth-card">
      <h2>Create account</h2>
      <form onSubmit={handleSubmit}>
        <label>Name</label>
        <input name="name" value={form.name} onChange={handleChange} />
        <label>Email</label>
        <input name="email" value={form.email} onChange={handleChange} />
        <label>Password</label>
        <input name="password" type="password" value={form.password} onChange={handleChange} />
        {error && <p className="error">{error}</p>}
        <button type="submit">Sign up</button>
      </form>
    </div>
  )
}
