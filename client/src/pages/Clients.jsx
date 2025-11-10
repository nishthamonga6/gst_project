import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

export default function Clients(){
  const [list, setList] = useState([])
  const [form, setForm] = useState({ name:'', gstin:'', pan:'', email:'', phone:'', address:'' })
  const [error, setError] = useState(null)

  useEffect(()=>{ fetchList() }, [])
  const fetchList = async ()=>{
    const res = await fetch(`${API_BASE}/api/clients/all`, { credentials:'include' })
    if (!res.ok) return
    const data = await res.json(); setList(data)
  }

  const handleCreate = async (e)=>{
    e.preventDefault(); setError(null)
    try{
      const res = await fetch(`${API_BASE}/api/clients/create`, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(form) })
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) return setError('Please login to add clients')
        return setError(data.message||'Create failed')
      }
      setForm({ name:'', gstin:'', pan:'', email:'', phone:'', address:'' })
      fetchList()
    }catch(err){ setError('Server error') }
  }

  return (
    <div className="fade-in">
      <div className="topbar"><h2>Clients / Vendors</h2></div>
      <div className="cards">
        <div className="card">
          <h4>Add Client / Vendor</h4>
          <form onSubmit={handleCreate}>
            <div className="form-field"><label>Name</label><input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} /></div>
            <div className="form-field"><label>GSTIN</label><input value={form.gstin} onChange={e=>setForm({...form, gstin:e.target.value})} /></div>
            <div className="form-field"><label>PAN</label><input value={form.pan} onChange={e=>setForm({...form, pan:e.target.value})} /></div>
            <div className="form-field"><label>Email</label><input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} /></div>
            <div className="form-field"><label>Phone</label><input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} /></div>
            <div className="form-field"><label>Address</label><textarea value={form.address} onChange={e=>setForm({...form, address:e.target.value})} /></div>
            {error && <p className="error">{error}</p>}
            <div style={{marginTop:12}}><button className="btn">Save</button></div>
          </form>
        </div>
        <div className="card">
          <h4>Client list</h4>
          <ul className="data-list">
            {list.map(c=> (
              <li key={c._id} className="data-item">
                <div>
                  <div style={{fontWeight:700}}>{c.name}</div>
                  <div className="muted">GSTIN: {c.gstin || '-'}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className="muted">{c.email || c.phone}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
