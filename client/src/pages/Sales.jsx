import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'

export default function Sales(){
  const [invoices, setInvoices] = useState([])
  useEffect(()=>{ fetchList() }, [])
  const fetchList = async ()=>{
    const res = await fetch(`${API_BASE}/api/invoices/all`, { credentials:'include' })
    if (!res.ok) return
    const data = await res.json(); setInvoices(data)
  }
  return (
    <div className="fade-in">
      <div className="topbar"><h2>Sales</h2></div>
      <div className="cards">
        <div className="card">
          <h4>Recent Sales</h4>
          <ul className="data-list">
            {invoices.map(inv=> (
              <li key={inv._id} className="data-item">
                <div>
                  <div style={{fontWeight:700}}>{inv.invoiceNumber}</div>
                  <div className="meta">Client: {inv.client ? (inv.client.name || inv.client) : '—'}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:700}}>₹{inv.total?.toFixed(2)||'0.00'}</div>
                  <div className="meta">{new Date(inv.date).toLocaleDateString()}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
