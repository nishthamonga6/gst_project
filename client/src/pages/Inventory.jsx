import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'

export default function Inventory(){
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ name:'', batch:'', expiry:'', stock:0 })
  useEffect(()=>{ fetchList() }, [])
  const fetchList = async ()=>{
    const res = await fetch(`${API_BASE}/api/data/all`, { credentials:'include' })
    if (!res.ok) return
    const data = await res.json();
    // filter inventory entries by title prefix
    setItems(data.filter(d=> d.title && d.title.startsWith('inventory:')).map(d=> ({ ...d, info: JSON.parse(d.content || '{}') })))
  }
  const handleCreate = async (e)=>{
    e.preventDefault()
    const payload = { title: `inventory:${form.name}`, content: JSON.stringify(form) }
    const res = await fetch(`${API_BASE}/api/data/create`, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(payload) })
    if (res.ok){ setForm({ name:'', batch:'', expiry:'', stock:0 }); fetchList() }
  }
  return (
    <div className="fade-in">
      <div className="topbar"><h2>Inventory</h2></div>
      <div className="cards">
        <div className="card">
          <h4>Add Inventory Item</h4>
          <form onSubmit={handleCreate}>
            <div className="form-field"><label>Name</label><input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} /></div>
            <div className="form-field"><label>Batch</label><input value={form.batch} onChange={e=>setForm({...form, batch:e.target.value})} /></div>
            <div className="form-field"><label>Expiry</label><input type="date" value={form.expiry} onChange={e=>setForm({...form, expiry:e.target.value})} /></div>
            <div className="form-field"><label>Stock</label><input type="number" value={form.stock} onChange={e=>setForm({...form, stock:Number(e.target.value)})} /></div>
            <div style={{marginTop:12}}><button className="btn">Add</button></div>
          </form>
        </div>
        <div className="card">
          <h4>Stock</h4>
          <ul className="data-list">
            {items.map(it=> (
              <li key={it._id} className="data-item">
                <div>
                  <div style={{fontWeight:700}}>{it.info.name}</div>
                  <div className="meta">Batch: {it.info.batch} • Expiry: {it.info.expiry}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:700}}>{it.info.stock}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
