import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'

export default function Purchases({ user }){
  const [list, setList] = useState([])
  const [form, setForm] = useState({ vendor:'', date:'', items:[{description:'',qty:1,price:0}] })
  const [error, setError] = useState(null)

  useEffect(()=>{ fetchList() }, [])
  const fetchList = async ()=>{
    const res = await fetch(`${API_BASE}/api/data/all`, { credentials:'include' })
    if (!res.ok) return
    const data = await res.json();
    // purchases stored with title prefix purchase:
    setList(data.filter(d=> d.title && d.title.startsWith('purchase:')).map(d=> ({ ...d, info: JSON.parse(d.content || '{}') })))
  }

  const handleCreate = async (e)=>{
    e.preventDefault(); setError(null)
    if (!user) return setError('Please login to add purchases')
    try{
      const payload = { title: `purchase:${form.vendor}`, content: JSON.stringify(form) }
      const res = await fetch(`${API_BASE}/api/data/create`, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(payload) })
      if (!res.ok) return setError('Create failed')
      setForm({ vendor:'', date:'', items:[{description:'',qty:1,price:0}] })
      fetchList()
    }catch(err){ setError('Server error') }
  }

  return (
    <div className="fade-in">
      <div className="topbar"><h2>Purchases</h2></div>
      <div className="cards">
        <div className="card">
          <h4>Add Purchase</h4>
          <form onSubmit={handleCreate}>
            <div className="form-field"><label>Vendor</label><input value={form.vendor} onChange={e=>setForm({...form, vendor:e.target.value})} /></div>
            <div className="form-field"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} /></div>
            <div className="panel">
              <h4 className="muted">Items</h4>
              {form.items.map((it,idx)=>(
                <div key={idx} style={{display:'flex',gap:8,marginTop:8}}>
                  <input placeholder="Description" value={it.description} onChange={e=>{ const copy=[...form.items]; copy[idx].description = e.target.value; setForm({...form, items: copy}) }} />
                  <input type="number" placeholder="Qty" value={it.qty} onChange={e=>{ const copy=[...form.items]; copy[idx].qty = Number(e.target.value); setForm({...form, items: copy}) }} style={{width:70}} />
                  <input type="number" placeholder="Price" value={it.price} onChange={e=>{ const copy=[...form.items]; copy[idx].price = Number(e.target.value); setForm({...form, items: copy}) }} style={{width:90}} />
                </div>
              ))}
            </div>
            {error && <p className="error">{error}</p>}
            <div style={{marginTop:12}}><button className="btn">Save Purchase</button></div>
          </form>
        </div>

        <div className="card">
          <h4>Purchase List</h4>
          <ul className="data-list">
            {list.map(it=> (
              <li key={it._id} className="data-item">
                <div>
                  <div style={{fontWeight:700}}>{it.info.vendor || it.title}</div>
                  <div className="meta">Items: {(it.info.items||[]).length}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className="meta">{it.info.date}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
