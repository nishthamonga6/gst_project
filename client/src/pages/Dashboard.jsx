import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001';

export default function Dashboard({ user, setUser }) {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ total:0, pending:0, filed:0, dueSoon:0, gstReceivable:0 })
  const [chartData, setChartData] = useState([])

  useEffect(()=>{
    // fetch profile
    fetch(`${API_BASE}/api/auth/me`, { credentials:'include' })
      .then(res=>res.ok?res.json():null)
      .then(d=>{ if (!d) navigate('/login'); else setUser(d) })
      .catch(()=>navigate('/login'))

    // fetch invoices summary (simple)
    fetch(`${API_BASE}/api/invoices/all`, { credentials:'include' }).then(r=>r.json()).then(invs=>{
      const total = invs.reduce((s,i)=>s + (i.total||0), 0)
      const pending = invs.filter(i=>i.status==='pending').length
      const filed = 0
      const dueSoon = invs.filter(i=>{ if(!i.dueDate) return false; const d=new Date(i.dueDate); const diff=(d - new Date())/(1000*60*60*24); return diff<=7 }).length
      const gstReceivable = invs.reduce((s,i)=>s + (i.totalTax||0), 0)
      setSummary({ total, pending, filed, dueSoon, gstReceivable })

      // chart by month
      const months = {}
      invs.forEach(inv=>{ const m = new Date(inv.date).toLocaleString('default',{month:'short','year':'numeric'}); months[m]=(months[m]||0)+ (inv.total||0) })
      const chart = Object.keys(months).map(k=>({ name:k, total: months[k] }))
      setChartData(chart)
    }).catch(()=>{})
  },[])

  return (
    <div className="fade-in">
      <div className="topbar" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <h2 style={{margin:0}}>Dashboard</h2>
      </div>

      <div className="container">
        <div className="cards">
          <div className="card green">
            <h4>Total Sales</h4>
            <div className="value"><span className="rupee">₹</span>{summary.total ? summary.total.toFixed(2) : '0.00'}</div>
          </div>
          <div className="card red">
            <h4>Total Purchases</h4>
            <div className="value"><span className="rupee">₹</span>{(summary.pending || 0).toFixed ? (0).toFixed(2) : '0.00'}</div>
          </div>
          <div className="card blue">
            <h4>Gross Profit</h4>
            <div className="value"><span className="rupee">₹</span>{(summary.gstReceivable || 0).toFixed ? (0).toFixed(2) : '0.00'}</div>
          </div>
          <div className="card gold">
            <h4>Inventory Value</h4>
            <div className="value"><span className="rupee">₹</span>0.00</div>
          </div>
        </div>

        <div style={{marginTop:14}}>
          <div className="panel expiry-panel">
            <div className="alerts-header" style={{padding:'18px 18px 0 18px'}}>
              <div>
                <h3>Expiry Alerts</h3>
                <p style={{marginTop:6,color:'#6b7280'}}>Products expiring within the next 30 days or already expired.</p>
              </div>
            </div>
            <div className="expiry-table-wrap">
              <div className="header-row" style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr'}}>
                <div className="col">Product Name</div>
                <div className="col">Batch No</div>
                <div className="col">Expiry Date</div>
                <div className="col">Days Left</div>
                <div className="col">Stock</div>
              </div>
              <div className="expiry-table-body">
                <div className="expiry-empty">No products are expiring soon.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
