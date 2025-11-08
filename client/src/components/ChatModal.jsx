import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'

export default function ChatModal(){
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bodyRef = useRef()

  useEffect(()=>{ if(bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight }, [messages, open])

  const send = async () => {
    if (!input) return
    const userMsg = { role: 'user', content: input }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)
    try{
      // show typing placeholder immediately
      const placeholder = { role: 'assistant', content: '…', meta: { typing: true } }
      setMessages(m => [...m, placeholder])

      const res = await fetch(`${API_BASE}/api/ai/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ message: input }) })

      if (!res.ok) {
        // handle unauthorized separately
        if (res.status === 401 || res.status === 403) {
          setMessages(m => {
            const copy = [...m]
            for (let j = copy.length - 1; j >= 0; j--) {
              if (copy[j].role === 'assistant') { copy[j] = { ...copy[j], content: 'Please login to use the AI assistant.', meta: { typing: false } }; break }
            }
            return copy
          })
          setLoading(false)
          return
        }
        // other errors
        const text = await res.text().catch(()=> '')
        setMessages(m => {
          const copy = [...m]
          for (let j = copy.length - 1; j >= 0; j--) {
            if (copy[j].role === 'assistant') { copy[j] = { ...copy[j], content: 'AI error: ' + (text || res.statusText || 'unknown'), meta: { typing: false } }; break }
          }
          return copy
        })
        setLoading(false)
        return
      }

      const data = await res.json().catch(()=>({}))
      const full = data.content || 'No response'

      // progressively replace the last assistant message
      let current = ''
      for (let i = 0; i < full.length; i++){
        current += full[i]
        setMessages(m => {
          const copy = [...m]
          for(let j = copy.length-1;j>=0;j--){ if(copy[j].role==='assistant'){ copy[j] = { ...copy[j], content: current, meta: { typing: false } }; break } }
          return copy
        })
        await new Promise(r => setTimeout(r, 10))
      }
    }catch(e){
      setMessages(m => {
        const copy = [...m]
        for(let j = copy.length-1;j>=0;j--){ if(copy[j].role==='assistant'){ copy[j] = { ...copy[j], content: 'Error: could not reach AI', meta: { typing: false } }; break } }
        return copy
      })
    }
    setLoading(false)
  }

  return (
    <>
      <button className="ai-fab" onClick={()=>setOpen(o=>!o)} title="Open AI Assistant">AI</button>
      <AnimatePresence>
        {open && (
          <motion.div className="chat-modal" initial={{opacity:0,scale:0.96, y:8}} animate={{opacity:1,scale:1, y:0}} exit={{opacity:0,scale:0.96, y:8}} transition={{duration:0.18}}>
              <div className="chat-header">
                <div className="left">
                  <div className="avatar">AI</div>
                  <div>
                    <strong>AI Assistant</strong>
                    <div style={{fontSize:12,color:'#6b7280'}}>Ask questions, analyze data, or get suggestions</div>
                  </div>
                </div>
              <div>
                <button onClick={()=>{ setMessages([]) }} style={{marginRight:8}}>Clear</button>
                <button onClick={()=>setOpen(false)} style={{background:'transparent',border:'none',cursor:'pointer'}}>✕</button>
              </div>
            </div>
            <div className="chat-body" ref={bodyRef}>
              {messages.length===0 && (
                <div style={{padding:12,color:'#6b7280'}}>No messages yet. Try asking "Show invoices above 10000"</div>
              )}
              {messages.map((m,i)=> (
                <div key={i} className={`msg ${m.role==='user' ? 'user' : 'bot'}`}>
                  <div className="bubble">
                    {m.meta && m.meta.typing ? (
                      <span className="typing-dots"><span></span><span></span><span></span></span>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <div style={{display:'flex',gap:8}}>
                <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask about invoices, GST, or site data..." style={{flex:1,padding:10,borderRadius:8,border:'1px solid #edf2f7'}} />
                <button onClick={send} disabled={loading} style={{background:'#0b5fff',color:'#fff',padding:'8px 12px',borderRadius:8,border:'none'}}>Send</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
