import React from 'react'

export default function Setup(){
  return (
    <div className="fade-in">
      <div className="topbar"><h2>Setup</h2></div>
      <div className="cards">
        <div className="card">
          <h4>Company Settings</h4>
          <p className="muted">Configure company details, GSTIN, invoice header and tax preferences.</p>
        </div>
        <div className="card">
          <h4>Integration</h4>
          <p className="muted">OpenAI setup, email settings, backups and exports.</p>
        </div>
      </div>
    </div>
  )
}
