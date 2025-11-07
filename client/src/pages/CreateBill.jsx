import React, { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'

export default function CreateBill(){
  const [form, setForm] = useState({ client:'', items:[{description:'',qty:1,price:0,tax:0}] })
  const [clients, setClients] = useState([])
  useEffect(()=>{ fetchClients() }, [])
  const fetchClients = async ()=>{ const r = await fetch(`${API_BASE}/api/clients/all`, { credentials:'include' }); if(r.ok){ setClients(await r.json()) } }
  const addItem = ()=> setForm(f=> ({ ...f, items:[...f.items,{description:'',qty:1,price:0,tax:0}] }))
  const removeItem = (i)=> setForm(f => ({ ...f, items: f.items.filter((_,idx)=>idx!==i) }))
  const totals = ()=>{
    const sub = form.items.reduce((s,it)=> s + ((Number(it.qty)||0)*(Number(it.price)||0)), 0)
    const tax = form.items.reduce((s,it)=> s + (((Number(it.qty)||0)*(Number(it.price)||0)) * (Number(it.tax)||0)/100), 0)
    return { sub, tax, total: sub+tax }
  }
  const handleCreate = async (e)=>{ e.preventDefault(); const res = await fetch(`${API_BASE}/api/invoices/create`, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(form) }); if(res.ok){ alert('Bill created'); setForm({ client:'', items:[{description:'',qty:1,price:0,tax:0}] }) } else { const d = await res.json().catch(()=>({})); alert('Create failed: ' + (d.message || res.statusText)) } }
  return (
    <div className="fade-in">
      <div className="topbar"><h2>Create Bill</h2></div>
      <div className="cards">
        <div className="card">
          <h4>New Bill</h4>
          <form onSubmit={handleCreate}>
            <div className="form-field"><label>Client</label>
              <select value={form.client} onChange={e=>setForm({...form, client:e.target.value})}>
                <option value="">Select client</option>
                {clients.map(c=> <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="panel">
              <h4 className="muted">Items</h4>
              {form.items.map((it,idx)=>(
                <div key={idx} className="item-row">
                  <input placeholder="Description" value={it.description} onChange={e=>{ const copy = [...form.items]; copy[idx].description = e.target.value; setForm({...form, items: copy}) }} />
                  <input type="number" placeholder="Qty" value={it.qty} onChange={e=>{ const copy = [...form.items]; copy[idx].qty = Number(e.target.value); setForm({...form, items: copy}) }} className="qty" />
                  <input type="number" placeholder="Price" value={it.price} onChange={e=>{ const copy = [...form.items]; copy[idx].price = Number(e.target.value); setForm({...form, items: copy}) }} className="price" />
                  <input type="number" placeholder="Tax%" value={it.tax} onChange={e=>{ const copy = [...form.items]; copy[idx].tax = Number(e.target.value); setForm({...form, items: copy}) }} className="tax" />
                  <div className="line-total">₹{(((Number(it.qty)||0)*(Number(it.price)||0)) + (((Number(it.qty)||0)*(Number(it.price)||0))*(Number(it.tax)||0)/100)).toFixed(2)}</div>
                  <button type="button" className="remove-item" onClick={()=>removeItem(idx)}>✕</button>
                </div>
              ))}
            </div>
            <div style={{marginTop:12}}>
              <button className="btn" type="button" onClick={addItem}>Add item</button>
              <button className="btn" type="submit" style={{marginLeft:8}}>Create Bill</button>
              <div style={{marginTop:12,textAlign:'right'}}>
                {(() => { const t = totals(); return (<div><div className="muted">Subtotal: ₹{t.sub.toFixed(2)}</div><div className="muted">Tax: ₹{t.tax.toFixed(2)}</div><div style={{fontWeight:800}}>Total: ₹{t.total.toFixed(2)}</div></div>) })()}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
