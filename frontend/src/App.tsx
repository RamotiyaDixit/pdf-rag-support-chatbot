import { FormEvent, useEffect, useRef, useState } from 'react'
import { BookOpen, Bot, CheckCircle2, FileText, LoaderCircle, Paperclip, Send, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react'

type Source = { source: string; page: number; excerpt: string; score?: number }
type Message = { role: 'assistant' | 'user'; content: string; sources?: Source[]; abstained?: boolean }
type DocItem = { filename: string; chunks: number }
const API = '/api'
const starters = ['How do I get started?', 'What troubleshooting steps are documented?', 'How can I contact support?']

async function readError(response: Response) {
  try { const body = await response.json(); return body.detail || body.message || 'Request failed' }
  catch { return 'Request failed' }
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([{role:'assistant',content:'Hi! I answer using your team’s uploaded PDFs. Ask a question or upload a document to get started. I’ll cite the document and page for each answer.'}])
  const [question, setQuestion] = useState('')
  const [docs, setDocs] = useState<DocItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function refreshDocs() {
    try { const response = await fetch(`${API}/documents`); if (response.ok) setDocs(await response.json()) } catch { /* API status is shown on request */ }
  }
  useEffect(() => { void refreshDocs() }, [])
  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}) }, [messages, sending])

  async function submitQuestion(value = question) {
    const clean = value.trim()
    if (!clean || sending) return
    setQuestion(''); setNotice('')
    setMessages(prev => [...prev, {role:'user',content:clean}])
    setSending(true)
    try {
      const response = await fetch(`${API}/chat`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:clean})})
      if (!response.ok) throw new Error(await readError(response))
      const data = await response.json()
      setMessages(prev => [...prev,{role:'assistant',content:data.answer,sources:data.sources||[],abstained:data.abstained}])
    } catch (error) {
      setMessages(prev => [...prev,{role:'assistant',content:error instanceof Error ? error.message : 'Could not reach the API. Is Docker Compose running?',abstained:true}])
    } finally { setSending(false) }
  }

  async function uploadFile(event: FormEvent<HTMLInputElement>) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) { setNotice('Please choose a PDF file.'); return }
    setUploading(true); setNotice('')
    const body = new FormData(); body.append('file',file)
    try {
      const response = await fetch(`${API}/upload`,{method:'POST',body})
      if (!response.ok) throw new Error(await readError(response))
      const data = await response.json()
      setNotice(`${data.filename}: indexed ${data.chunks_indexed} chunks across ${data.pages_read} pages.`)
      await refreshDocs()
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Upload failed.') }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Sparkles size={21}/></div><div><strong>Atlas</strong><span>SUPPORT KNOWLEDGE</span></div></div>
      <div className="workspace-pill"><span className="status-dot"/> Internal workspace</div>
      <div className="side-section-label">WORKSPACE</div>
      <div className="side-nav active"><Bot size={17}/> Knowledge assistant</div>
      <div className="side-nav"><BookOpen size={17}/> Source library <span className="nav-count">{docs.length}</span></div>
      <div className="library-head"><span>YOUR DOCUMENTS</span><button onClick={()=>fileRef.current?.click()} title="Upload a PDF"><UploadCloud size={16}/></button></div>
      <div className="documents-list">{docs.length===0 ? <div className="empty-docs"><FileText size={20}/><span>No documents yet</span><small>Upload a PDF to build your knowledge base.</small></div> : docs.map(doc=><div className="doc-row" key={doc.filename}><FileText size={16}/><div className="doc-meta"><span title={doc.filename}>{doc.filename}</span><small>{doc.chunks} chunks indexed</small></div><CheckCircle2 size={14} className="doc-check"/></div>)}</div>
      <div className="sidebar-bottom"><div className="secure-card"><ShieldCheck size={18}/><div><b>Grounded answers</b><p>Responses use retrieved source passages and include page citations.</p></div></div><div className="user-chip"><div className="avatar">S</div><div><b>Support team</b><small>Knowledge workspace</small></div><span className="online-dot"/></div></div>
    </aside>
    <main className="main-panel">
      <header className="topbar"><div className="breadcrumbs"><span>Workspace</span><span className="crumb-sep">/</span><b>Knowledge assistant</b></div><div className="top-actions"><span className="model-badge"><span className="green-dot"/> RAG pipeline active</span><button className="upload-btn" onClick={()=>fileRef.current?.click()}><UploadCloud size={16}/> Upload PDF</button></div></header>
      <section className="chat-layout">
        <div className="intro"><div className="eyebrow"><span className="eyebrow-icon"><Sparkles size={13}/></span> INTERNAL KNOWLEDGE, INSTANTLY</div><h1>Your support knowledge,<br/><em>one question away.</em></h1><p>Ask in plain language. Get clear answers from your team's documents, with sources you can verify.</p></div>
        <div className="message-list">{messages.map((message,index)=><div className={`message ${message.role}`} key={index}>
          {message.role==='assistant'&&<div className="message-avatar"><Bot size={17}/></div>}
          <div className="message-body"><div className="message-author">{message.role==='assistant'?'ATLAS ASSISTANT':'YOU'}{message.abstained&&<span className="abstain-tag">Unable to verify</span>}</div><div className="message-text">{message.content}</div>
          {!!message.sources?.length&&<div className="source-panel"><div className="source-title"><BookOpen size={15}/> SOURCES USED <span>{message.sources.length}</span></div><div className="source-grid">{message.sources.map((source,i)=><div className="source-card" key={`${source.source}-${source.page}-${i}`}><div className="source-file"><FileText size={15}/><span>{source.source}</span><b>p. {source.page}</b></div><p>{source.excerpt}</p></div>)}</div></div>}
          </div></div>)}
          {sending&&<div className="message assistant"><div className="message-avatar"><Bot size={17}/></div><div className="message-body"><div className="message-author">ATLAS ASSISTANT</div><div className="thinking"><LoaderCircle size={16} className="spin"/> Searching your documents and drafting a cited answer…</div></div></div>}
          <div ref={endRef}/>
        </div>
        {messages.length===1&&<div className="starter-row">{starters.map(starter=><button key={starter} onClick={()=>void submitQuestion(starter)}>{starter}<span>↗</span></button>)}</div>}
        <div className="composer-wrap"><form className="composer" onSubmit={event=>{event.preventDefault();void submitQuestion()}}><button type="button" className="attach-btn" onClick={()=>fileRef.current?.click()} title="Attach PDF" disabled={uploading}><Paperclip size={18}/></button><input value={question} onChange={event=>setQuestion(event.target.value)} placeholder="Ask a question about your internal documents..." aria-label="Your question"/><button type="submit" className="send-btn" disabled={!question.trim()||sending}><Send size={17}/></button></form><div className="composer-footer"><span>{notice||'Answers are grounded in your uploaded documents. Always verify important details.'}</span><span className="powered">OPENAI + QDRANT</span></div></div>
        <input ref={fileRef} type="file" accept=".pdf,application/pdf" hidden onChange={event=>void uploadFile(event)}/>
        {uploading&&<div className="upload-progress"><LoaderCircle size={15} className="spin"/> Uploading and indexing PDF…</div>}
      </section>
    </main>
  </div>
}
