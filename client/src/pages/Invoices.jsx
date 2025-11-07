import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'

export default function Invoices(){
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ client:'', dueDate:'', items: [{ description:'', hsn:'', quantity:1, unitPrice:0, taxRate:0 }] })
  const [error, setError] = useState(null)

  useEffect(()=>{ fetchList() }, [])

  const fetchList = async ()=>{
    const res = await fetch(`${API_BASE}/api/invoices/all`, { credentials: 'include' })
    if (!res.ok) return
    const data = await res.json(); setItems(data)
  }

  const addItem = ()=> setForm(f => ({ ...f, items: [...f.items, { description:'', hsn:'', quantity:1, unitPrice:0, taxRate:0 }] }))
  const updateItem = (i, key, val)=>{
    setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [key]: val }; return { ...f, items } })
  }
  const removeItem = (i)=> setForm(f => ({ ...f, items: f.items.filter((_,idx)=>idx!==i) }))

  const computeTotals = ()=>{
    const sub = form.items.reduce((s,it)=> s + ((Number(it.quantity)||0) * (Number(it.unitPrice)||0)), 0)
    const tax = form.items.reduce((s,it)=> s + (((Number(it.quantity)||0) * (Number(it.unitPrice)||0)) * (Number(it.taxRate)||0)/100), 0)
    return { subTotal: sub, totalTax: tax, total: sub + tax }
  }

  const handleCreate = async (e) =>{
    e.preventDefault(); setError(null)
    if (!form.client) return setError('Select client')
    try{
      const res = await fetch(`${API_BASE}/api/invoices/create`, { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) return setError('Please login to create invoices')
        return setError(data.message || 'Create failed')
      }
      setForm({ client:'', dueDate:'', items: [{ description:'', hsn:'', quantity:1, unitPrice:0, taxRate:0 }] })
      fetchList()
    }catch(err){ setError('Server error') }
  }

  return (
    <div className="fade-in">
      <div className="topbar"><h2>Invoices</h2></div>
      <div className="cards">
        <div className="card">
          <h4>Create Invoice</h4>
          <form onSubmit={handleCreate}>
            <div className="form-field"><label>Client (id)</label><input value={form.client} onChange={e=>setForm({...form, client:e.target.value})} placeholder="Client ID (use client list)" /></div>
            <div className="form-field"><label>Due date</label><input type="date" value={form.dueDate} onChange={e=>setForm({...form, dueDate:e.target.value})} /></div>
            <div className="panel" style={{marginTop:10}}>
              <h4 className="muted">Items</h4>
                {form.items.map((it, idx)=>(
                  <div key={idx} className="item-row">
                    <input placeholder="Description" value={it.description} onChange={e=>updateItem(idx,'description',e.target.value)} />
                    <input placeholder="HSN" value={it.hsn} onChange={e=>updateItem(idx,'hsn',e.target.value)} className="small" />
                    <input type="number" placeholder="Qty" value={it.quantity} onChange={e=>updateItem(idx,'quantity',Number(e.target.value))} className="qty" />
                    <input type="number" placeholder="Unit" value={it.unitPrice} onChange={e=>updateItem(idx,'unitPrice',Number(e.target.value))} className="price" />
                    <input type="number" placeholder="Tax%" value={it.taxRate} onChange={e=>updateItem(idx,'taxRate',Number(e.target.value))} className="tax" />
                    <div className="line-total">₹{(((Number(it.quantity)||0)*(Number(it.unitPrice)||0)) + (((Number(it.quantity)||0)*(Number(it.unitPrice)||0))*(Number(it.taxRate)||0)/100)).toFixed(2)}</div>
                    <button type="button" className="remove-item" onClick={()=>removeItem(idx)}>✕</button>
                  </div>
                ))}
              <div style={{marginTop:8}}><button type="button" onClick={addItem} className="btn secondary">Add item</button></div>
            </div>
              <div style={{marginTop:12,textAlign:'right'}}>
                {(() => { const t = computeTotals(); return (<div><div className="muted">Subtotal: ₹{t.subTotal.toFixed(2)}</div><div className="muted">Tax: ₹{t.totalTax.toFixed(2)}</div><div style={{fontWeight:800}}>Total: ₹{t.total.toFixed(2)}</div></div>) })()}
              </div>
            {error && <p className="error">{error}</p>}
            <div style={{marginTop:12}}><button className="btn">Create</button></div>
          </form>
        </div>
        <div className="card">
          <h4>Invoice list</h4>
          <ul className="data-list">
            {items.map(it=> (
              <li key={it._id} className="data-item">
                <div>
                  <div style={{fontWeight:700}}>{it.invoiceNumber}</div>
                  <div className="muted">Client: {it.client ? (it.client.name || it.client) : '—'}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:700}}>₹{it.total?.toFixed(2)||'0.00'}</div>
                  <div className="muted">{new Date(it.date).toLocaleDateString()}</div>
                  <div style={{marginTop:8,display:'flex',gap:8,justifyContent:'flex-end'}}>
                    <button className="btn secondary" onClick={()=>{ const data = JSON.stringify(it, null, 2); const blob = new Blob([data], {type:'application/json'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download = `invoice-${it.invoiceNumber || it._id}.json`; a.click(); URL.revokeObjectURL(url); }}>Download JSON</button>
                    <button className="btn secondary" onClick={()=>{
                      // CSV simple export
                      const rows = [['Description','HSN','Qty','Unit Price','Tax%','Line Total']]
                      (it.items||[]).forEach(itm=> rows.push([itm.description||'', itm.hsn||'', itm.quantity||'', itm.unitPrice||'', itm.taxRate||'', ((itm.quantity||0)*(itm.unitPrice||0)).toFixed(2)]))
                      const csv = rows.map(r=> r.map(c=> '"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n')
                      const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download = `invoice-${it.invoiceNumber || it._id}.csv`; a.click(); URL.revokeObjectURL(url);
                    }}>Download CSV</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div style={{marginTop:12}}>
            <button className="btn" onClick={()=>{
              // export all invoices (client-side) from server/data or fetched list
              const data = JSON.stringify(items, null, 2); const blob = new Blob([data], {type:'application/json'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download = `invoices-all.json`; a.click(); URL.revokeObjectURL(url);
            }}>Export All</button>
          </div>
        </div>
      </div>
    </div>
  )
}
