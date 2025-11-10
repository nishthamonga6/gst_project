import React, { useState, useEffect, useRef } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

export default function AIChat(){
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [chatId, setChatId] = useState(null)
  const [loading, setLoading] = useState(false)
  const messagesRef = useRef()

  useEffect(()=>{ messagesRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!input) return
    const payload = { message: input, conversationId: chatId }
    setMessages(s => [...s, { role: 'user', content: input }])
    setInput('')
    setLoading(true)
    try{
      const res = await fetch(`${API_BASE}/api/ai/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) })
      const data = await res.json()
      if (data.chatId) setChatId(data.chatId)
      setMessages(s => [...s, { role: 'assistant', content: data.content }])
    }catch(e){
      setMessages(s => [...s, { role: 'assistant', content: 'Error: could not reach AI' }])
    }
    setLoading(false)
  }

  const quick = (q) => { setInput(q); }

  return (
    <div className="app min-h-screen p-6">
      <div className="max-w-3xl mx-auto bg-white shadow rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          <p className="text-sm text-gray-500">Ask questions about GST, invoices, returns, or upload documents to extract.</p>
        </div>
        <div className="p-4" style={{height: '60vh', overflowY: 'auto'}}>
          {messages.map((m, idx) => (
            <div key={idx} className={`mb-3 ${m.role==='user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block px-4 py-2 rounded ${m.role==='user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-black'}`}>
                {m.content}
              </div>
            </div>
          ))}
          <div ref={messagesRef}></div>
        </div>
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input value={input} onChange={e=>setInput(e.target.value)} className="flex-1 p-2 border rounded" placeholder="Ask the AI..." />
            <button onClick={send} className="px-4 py-2 bg-blue-600 text-white rounded">Send</button>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={()=>quick('How do I calculate CGST and SGST for intra-state invoices?')} className="px-3 py-1 bg-gray-100 rounded">Suggested: GST calc</button>
            <button onClick={()=>quick('Show invoices above 10000 last month')} className="px-3 py-1 bg-gray-100 rounded">Suggested: Query invoices</button>
          </div>
        </div>
      </div>
    </div>
  )
}
