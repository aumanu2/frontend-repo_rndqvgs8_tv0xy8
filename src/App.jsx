import { useEffect, useMemo, useState } from 'react'

const API = import.meta.env.VITE_BACKEND_URL || ''

function useUser() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const register = async (name, email, password) => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Register failed')
      setUser(data)
      return data
    } finally { setLoading(false) }
  }
  const login = async (email, password) => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Login failed')
      setUser(data)
      return data
    } finally { setLoading(false) }
  }
  return { user, setUser, register, login, loading }
}

function App() {
  const { user, register, login, loading } = useUser()
  const [authMode, setAuthMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [foods, setFoods] = useState([])
  const [recs, setRecs] = useState([])
  const [message, setMessage] = useState('')
  const [chat, setChat] = useState(null)

  useEffect(() => {
    if (!API) return
    fetch(`${API}/foods`).then(r=>r.json()).then(setFoods).catch(()=>{})
  }, [])

  useEffect(() => {
    if (!user) return
    fetch(`${API}/recommendations/${user.id}`).then(r=>r.json()).then(d=>setRecs(d.items || [])).catch(()=>{})
  }, [user])

  const handleSeed = async () => {
    await fetch(`${API}/seed`, { method: 'POST' })
    const list = await (await fetch(`${API}/foods`)).json()
    setFoods(list)
  }

  const handleConsume = async (foodId) => {
    if (!user) return alert('Login first')
    await fetch(`${API}/consumptions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id, food_id: foodId, portion_size: 1 }) })
    const a = await (await fetch(`${API}/analytics/nutrition/${user.id}`)).json()
    console.log(a)
    const rec = await (await fetch(`${API}/recommendations/${user.id}`)).json()
    setRecs(rec.items || [])
  }

  const doChat = async () => {
    if (!user) return alert('Login first')
    const res = await fetch(`${API}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id, message }) })
    const data = await res.json()
    setChat(data)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800">HLife</h1>
        <p className="text-gray-600 mb-6">Nutrition tracking, smart recommendations, and an AI assistant.</p>

        {!user && (
          <div className="bg-white rounded-xl shadow p-4 mb-6">
            <div className="flex gap-4 mb-3">
              <button className={`px-3 py-1 rounded ${authMode==='login'?'bg-blue-600 text-white':'bg-gray-100'}`} onClick={()=>setAuthMode('login')}>Login</button>
              <button className={`px-3 py-1 rounded ${authMode==='register'?'bg-blue-600 text-white':'bg-gray-100'}`} onClick={()=>setAuthMode('register')}>Register</button>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {authMode==='register' && (
                <input className="border rounded px-3 py-2" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
              )}
              <input className="border rounded px-3 py-2" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
              <input className="border rounded px-3 py-2" placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
              <button disabled={loading} className="bg-blue-600 text-white rounded px-4 py-2" onClick={()=> authMode==='login' ? login(form.email, form.password) : register(form.name, form.email, form.password)}>
                {loading? 'Please wait...': (authMode==='login' ? 'Login' : 'Create account')}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <button className="bg-emerald-600 text-white px-3 py-2 rounded" onClick={handleSeed}>Seed sample foods</button>
          {user && <span className="text-sm text-gray-600">Logged in as {user.email}</span>}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold mb-3">Foods</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {foods.map(f=> (
                <div key={f.id} className="border rounded p-3">
                  <div className="font-medium">{f.name}</div>
                  <div className="text-xs text-gray-500">{f.description}</div>
                  <div className="text-xs mt-1">Calories: {f.nutrients?.calories} · Protein: {f.nutrients?.protein}g</div>
                  <button className="mt-2 text-sm bg-blue-600 text-white px-2 py-1 rounded" onClick={()=>handleConsume(f.id)}>Log consumption</button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold mb-3">Recommendations</h2>
            <div className="flex flex-col gap-2">
              {recs.map(r=> (
                <div key={r.id} className="border rounded p-3">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-gray-500">{r.description}</div>
                </div>
              ))}
              {recs.length===0 && <div className="text-sm text-gray-500">No recommendations yet. Seed foods and login to generate.</div>}
            </div>

            <div className="mt-4">
              <h3 className="font-medium mb-2">AI Nutrition Assistant</h3>
              <div className="flex gap-2">
                <input className="border flex-1 rounded px-3 py-2" placeholder="Ask about nutrition..." value={message} onChange={e=>setMessage(e.target.value)} />
                <button className="bg-purple-600 text-white px-3 py-2 rounded" onClick={doChat}>Ask</button>
              </div>
              {chat && (
                <div className="mt-3 text-sm">
                  <div className="font-medium">Assistant:</div>
                  <p className="text-gray-700">{chat.reply}</p>
                  {chat.suggestions?.length>0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">Suggested meals:</div>
                      <ul className="list-disc ml-5 text-sm">
                        {chat.suggestions.map(s=> <li key={s.id}>{s.name}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default App
