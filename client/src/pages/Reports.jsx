import React from 'react'

export default function Reports(){
  return (
    <div className="fade-in">
      <div className="topbar"><h2>Reports</h2></div>
      <div className="report-panel">
        <div>
          <div className="small-card">
            <h4>Sales Overview</h4>
            <p className="muted">Summary charts and KPIs will appear here.</p>
          </div>
          <div style={{height:12}} />
          <div className="small-card">
            <h4>Tax Summary</h4>
            <p className="muted">GST collected / paid snapshots.</p>
          </div>
        </div>
        <div>
          <div className="small-card">
            <h4>Quick Actions</h4>
            <p className="muted">Export CSV, Generate report, or request AI insights.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
