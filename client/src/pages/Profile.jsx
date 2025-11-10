import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

export default function Profile({ user: initialUser }){
  const [user, setUser] = useState(initialUser || null)
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    if (!initialUser){
      setLoading(true)
      fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' })
        .then(r=> r.ok ? r.json() : Promise.reject())
        .then(d=> setUser(d))
        .catch(()=> setUser(null))
        .finally(()=> setLoading(false))
    }
  }, [])

  if (loading) return <div className="card">Loading...</div>
  if (!user) return <div className="card">Not signed in.</div>

  return (
    <div className="fade-in">
      <div className="topbar"><h2>My Profile</h2></div>
      <div className="cards">
        <div className="card">
          <h4>Personal Details</h4>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>ID:</strong> {user._id}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p className="muted">Created at: {user.createdAt || user.updatedAt || '—'}</p>
        </div>
        <div className="card">
          <h4>My Data</h4>
          <p className="muted">This section will list your invoices, purchases and documents tied to your account.</p>
          <p>If you want, I can wire this to show invoices created by your account.</p>
        </div>
      </div>
    </div>
  )
}
