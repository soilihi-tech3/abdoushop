'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

// ── API CLIENT ──────────────────────────────────────────────
const _req = async (url, options = {}) => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, credentials: 'include', ...options, body: options.body ? JSON.stringify(options.body) : undefined })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erreur serveur')
  return data
}
const API = {
  login: (e,p) => _req('/api/auth', { method: 'POST', body: { email: e, password: p } }),
  logout: () => _req('/api/auth', { method: 'DELETE' }),
  getMe: () => _req('/api/auth'),
  getProducts: () => _req('/api/products'),
  createProduct: d => _req('/api/products', { method: 'POST', body: d }),
  updateProduct: (id,d) => _req(`/api/products/${id}`, { method: 'PUT', body: d }),
  deleteProduct: id => _req(`/api/products/${id}`, { method: 'DELETE' }),
  getCategories: () => _req('/api/categories'),
  createCategory: d => _req('/api/categories', { method: 'POST', body: d }),
  updateCategory: (id,d) => _req(`/api/categories/${id}`, { method: 'PUT', body: d }),
  deleteCategory: id => _req(`/api/categories/${id}`, { method: 'DELETE' }),
  getBrands: () => _req('/api/brands'),
  createBrand: d => _req('/api/brands', { method: 'POST', body: d }),
  updateBrand: (id,d) => _req(`/api/brands/${id}`, { method: 'PUT', body: d }),
  deleteBrand: id => _req(`/api/brands/${id}`, { method: 'DELETE' }),
  getSuppliers: () => _req('/api/suppliers'),
  createSupplier: d => _req('/api/suppliers', { method: 'POST', body: d }),
  updateSupplier: (id,d) => _req(`/api/suppliers/${id}`, { method: 'PUT', body: d }),
  deleteSupplier: id => _req(`/api/suppliers/${id}`, { method: 'DELETE' }),
  getEmployees: () => _req('/api/employees'),
  createEmployee: d => _req('/api/employees', { method: 'POST', body: d }),
  updateEmployee: (id,d) => _req(`/api/employees/${id}`, { method: 'PUT', body: d }),
  deleteEmployee: id => _req(`/api/employees/${id}`, { method: 'DELETE' }),
  getTransactions: (p={}) => { const qs = new URLSearchParams(p).toString(); return _req(`/api/transactions${qs?'?'+qs:''}`) },
  createTransaction: d => _req('/api/transactions', { method: 'POST', body: d }),
  getPurchases: () => _req('/api/purchases'),
  createPurchase: d => _req('/api/purchases', { method: 'POST', body: d }),
  deletePurchase: id => _req(`/api/purchases/${id}`, { method: 'DELETE' }),
  getSavings: () => _req('/api/savings'),
  createSaving: d => _req('/api/savings', { method: 'POST', body: d }),
  updateSaving: (id,d) => _req(`/api/savings/${id}`, { method: 'PUT', body: d }),
  deleteSaving: id => _req(`/api/savings/${id}`, { method: 'DELETE' }),
  getDashboard: () => _req('/api/dashboard'),
  getSettings: () => _req('/api/settings'),
  saveSettings: d => _req('/api/settings', { method: 'POST', body: d }),
}

// ── FORMATTERS ──────────────────────────────────────────────
const fmt = n => Number(n||0).toLocaleString('fr-FR') + ' FCFA'
const fmtD = d => new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})
const fmtDT = d => new Date(d).toLocaleString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})
const uid = () => Date.now() + Math.floor(Math.random()*9999)
const stockBadge = q => q===0?['bd br','Rupture']:q<=2?['bd bo','Faible']:['bd bg','En stock']
const prodEmoji = cat => cat==='Téléphone'?'📱':cat==='Ordinateur'?'💻':cat==='Tablette'?'📱':'🎧'
const payLabel = p => ({cash:'💵 Cash',orange:'🟠 Orange Money',wave:'🌊 Wave'}[p]||p)
const payNames = {cash:'Cash',orange:'Orange Money',wave:'Wave'}
const fmtPayment = (tx) => {
  if (tx.payment !== 'multi') return payNames[tx.payment] || tx.payment
  try {
    const d = typeof tx.payDetails === 'string' ? JSON.parse(tx.payDetails) : tx.payDetails
    if (!d) return 'Multi'
    const parts = []
    if (d.cash > 0) parts.push(`Cash: ${Number(d.cash).toLocaleString('fr-FR')} FCFA`)
    if (d.orange > 0) parts.push(`Orange: ${Number(d.orange).toLocaleString('fr-FR')} FCFA`)
    if (d.wave > 0) parts.push(`Wave: ${Number(d.wave).toLocaleString('fr-FR')} FCFA`)
    return parts.join(' + ') || 'Multi'
  } catch { return 'Multi' }
}
const fmtPaymentShort = (tx) => {
  if (tx.payment !== 'multi') return payNames[tx.payment] || tx.payment
  try {
    const d = typeof tx.payDetails === 'string' ? JSON.parse(tx.payDetails) : tx.payDetails
    if (!d) return 'Multi'
    const parts = []
    if (d.cash > 0) parts.push('Cash')
    if (d.orange > 0) parts.push('Orange')
    if (d.wave > 0) parts.push('Wave')
    return parts.join('+') || 'Multi'
  } catch { return 'Multi' }
}
const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

// ── PARTICLES ──────────────────────────────────────────────
function initParticles() {
  const cv = document.getElementById('pcv')
  if (!cv) return
  const ctx = cv.getContext('2d')
  let pts = []
  const sz = () => { cv.width = window.innerWidth; cv.height = window.innerHeight }
  sz(); window.addEventListener('resize', sz)
  for (let i = 0; i < 45; i++) pts.push({x:Math.random()*cv.width,y:Math.random()*cv.height,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,r:Math.random()*1.8+.4,o:Math.random()*.4+.08})
  function draw() {
    ctx.clearRect(0,0,cv.width,cv.height)
    pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>cv.width)p.vx*=-1;if(p.y<0||p.y>cv.height)p.vy*=-1;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(37,99,235,${p.o})`;ctx.fill()})
    pts.forEach((p,i)=>{for(let j=i+1;j<pts.length;j++){const dx=p.x-pts[j].x,dy=p.y-pts[j].y,d=Math.sqrt(dx*dx+dy*dy);if(d<90){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(37,99,235,${(1-d/90)*.12})`;ctx.lineWidth=.5;ctx.stroke()}}})
    requestAnimationFrame(draw)
  }
  draw()
}

// ── TOAST ──────────────────────────────────────────────────
function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast t-${t.type}`}>
          <i className={`fa ${t.type==='ok'?'fa-circle-check':t.type==='err'?'fa-circle-xmark':'fa-circle-info'}`} />
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}

// ── MAIN APP ───────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('dashboard')
  const [toasts, setToasts] = useState([])
  const [theme, setTheme] = useState('dark')
  const [sbCollapsed, setSbCollapsed] = useState(false)
  const [sbMobOpen, setSbMobOpen] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [employees, setEmployees] = useState([])
  const [transactions, setTransactions] = useState([])
  const [purchases, setPurchases] = useState([])
  const [savings, setSavings] = useState([])
  const [dashboard, setDashboard] = useState(null)

  const toast = useCallback((msg, type='inf') => {
    const id = Date.now()
    setToasts(t => [...t, {id,msg,type}])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  useEffect(() => {
    API.getMe().then(d => { setUser(d.user); setLoading(false) }).catch(() => setLoading(false))
    initParticles()
  }, [])

  useEffect(() => { if (user) loadAll() }, [user])

  const loadAll = async () => {
    const safe = fn => fn.catch(() => [])
    const safeObj = fn => fn.catch(() => ({}))
    const [p,c,b,s,e,t,pu,sa,d] = await Promise.all([
      safe(API.getProducts()), safe(API.getCategories()), safe(API.getBrands()), safe(API.getSuppliers()),
      safe(API.getEmployees()), safe(API.getTransactions()),
      safe(API.getPurchases()), safe(API.getSavings()), safeObj(API.getDashboard())
    ])
    setProducts(p); setCategories(c); setBrands(b); setSuppliers(s)
    setEmployees(e); setTransactions(t); setPurchases(pu); setSavings(sa); setDashboard(d)
  }

  const refresh = async (...keys) => {
    const m = {
      products: () => API.getProducts().then(setProducts),
      categories: () => API.getCategories().then(setCategories),
      brands: () => API.getBrands().then(setBrands),
      suppliers: () => API.getSuppliers().then(setSuppliers),
      employees: () => API.getEmployees().then(setEmployees),
      transactions: () => API.getTransactions().then(setTransactions),
      purchases: () => API.getPurchases().then(setPurchases),
      savings: () => API.getSavings().then(setSavings),
      dashboard: () => API.getDashboard().then(setDashboard),
    }
    await Promise.all(keys.map(k => m[k]?.()))
  }

  const handleLogin = async (email, password) => {
    const d = await API.login(email, password)
    setUser(d.user)
    toast(`Bienvenue ${d.user.name}!`, 'ok')
  }

  const handleLogout = async () => { await API.logout(); setUser(null); setPage('dashboard') }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.body.classList.toggle('light', next === 'light')
  }

  const goPage = (p) => { setPage(p); setSbMobOpen(false) }

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--bg)'}}>
      <div style={{textAlign:'center'}}>
        <div className="l-mark" style={{margin:'0 auto 16px'}}>FT</div>
        <div style={{color:'var(--muted)',fontSize:'.9rem'}}>Chargement…</div>
      </div>
    </div>
  )
  if (!user) return <LoginPage onLogin={handleLogin} />

  const titles = {dashboard:'Tableau de bord',pos:'Nouvelle vente',exchange:'Nouvel échange',products:'Catalogue Produits',history:'Historique',categories:'Catégories',brands:'Marques',suppliers:'Fournisseurs',employees:'Employés',purchases:'Achats',savings:'Épargne',settings:'Paramètres'}
  const isAdmin = user.role === 'admin'

  return (
    <div style={{height:'100vh',width:'100vw',overflow:'hidden'}}>
      <canvas id="pcv" />
      <div className={`sb-overlay${sbMobOpen?' show':''}`} onClick={() => setSbMobOpen(false)} />
      <div className="layout">
        {/* SIDEBAR */}
        <aside className={`sb${sbCollapsed?' collapsed':''}${sbMobOpen?' mob-open':''}`}>
          <div className="sb-logo">
            <div className="sb-icon">FT</div>
            <div className="sb-logo-text">FARTECH</div>
            <div className="sb-toggle" onClick={() => setSbCollapsed(v => !v)}><i className="fa fa-chevron-left" /></div>
          </div>
          <nav className="sb-nav">
            <div className="nav-lbl">Principal</div>
            {[['dashboard','fa-chart-pie','Tableau de bord'],['pos','fa-basket-shopping','Nouvelle vente'],['exchange','fa-arrows-rotate','Nouvel échange']].map(([id,ico,lbl]) => (
              <button key={id} className={`ni${page===id?' active':''}`} onClick={() => goPage(id)}>
                <i className={`fa ${ico} ni-ico`} /><span className="ni-label">{lbl}</span>
              </button>
            ))}
            <div className="nav-lbl">Catalogue</div>
            {[['products','fa-mobile-screen','Produits',false],['categories','fa-tags','Catégories',true],['brands','fa-award','Marques',true],['suppliers','fa-truck','Fournisseurs',true],['purchases','fa-cart-flatbed','Achats',true]].map(([id,ico,lbl,admin]) => (
              (!admin || isAdmin) && <button key={id} className={`ni${page===id?' active':''}`} onClick={() => goPage(id)}><i className={`fa ${ico} ni-ico`} /><span className="ni-label">{lbl}</span></button>
            ))}
            <div className="nav-lbl">Gestion</div>
            {[['history','fa-clock-rotate-left','Historique',false],['employees','fa-users','Employés',true],['savings','fa-piggy-bank','Épargne',true],['settings','fa-gear','Paramètres',true]].map(([id,ico,lbl,admin]) => (
              (!admin || isAdmin) && <button key={id} className={`ni${page===id?' active':''}`} onClick={() => goPage(id)}><i className={`fa ${ico} ni-ico`} /><span className="ni-label">{lbl}</span></button>
            ))}
          </nav>
          <div className="sb-foot">
            <div className="user-card" onClick={handleLogout}>
              <div className="uav">{(user.name||'').slice(0,2).toUpperCase()}</div>
              <div className="u-info"><div className="u-name">{user.name}</div><div className="u-role">{isAdmin?'Administrateur':'Employé'}</div></div>
              <i className="fa fa-right-from-bracket" style={{color:'var(--dim)',fontSize:'.8rem',flexShrink:0}} />
            </div>
          </div>
        </aside>
        {/* MAIN */}
        <main className="main">
          <div className="topbar">
            <div className="ib" onClick={() => setSbMobOpen(v=>!v)}><i className="fa fa-bars" /></div>
            <div className="tb-title">{titles[page]}</div>
            <div className="tb-acts">
              <div className="ib dot-notif"><i className="fa fa-bell" /></div>
              <div className="ib" onClick={toggleTheme}><i className="fa fa-circle-half-stroke" /></div>
              <div className="ib" onClick={handleLogout}><i className="fa fa-right-from-bracket" /></div>
            </div>
          </div>
          <div className="content">
            {page==='dashboard' && <DashboardPage data={dashboard} transactions={transactions} products={products} theme={theme} />}
            {page==='pos' && <POSPage products={products} categories={categories} brands={brands} transactions={transactions} user={user} toast={toast} onDone={async tx => { await refresh('products','transactions','dashboard'); setReceipt(tx) }} />}
            {page==='exchange' && <ExchangePage products={products} transactions={transactions} user={user} toast={toast} onDone={async tx => { await refresh('products','transactions','dashboard'); setReceipt(tx) }} />}
            {page==='products' && <ProductsPage products={products} categories={categories} brands={brands} suppliers={suppliers} user={user} toast={toast} onRefresh={() => refresh('products','dashboard')} />}
            {page==='history' && <HistoryPage transactions={transactions} user={user} onView={setReceipt} />}
            {page==='categories' && <CategoriesPage categories={categories} products={products} toast={toast} onRefresh={() => refresh('categories')} />}
            {page==='brands' && <BrandsPage brands={brands} products={products} toast={toast} onRefresh={() => refresh('brands')} />}
            {page==='suppliers' && <SuppliersPage suppliers={suppliers} products={products} toast={toast} onRefresh={() => refresh('suppliers')} />}
            {page==='employees' && <EmployeesPage employees={employees} transactions={transactions} toast={toast} onRefresh={() => refresh('employees')} />}
            {page==='purchases' && <PurchasesPage purchases={purchases} products={products} suppliers={suppliers} toast={toast} onRefresh={() => refresh('purchases','products','dashboard')} />}
            {page==='savings' && <SavingsPage savings={savings} toast={toast} onRefresh={() => refresh('savings')} />}
            {page==='settings' && <SettingsPage user={user} toast={toast} onDanger={() => loadAll()} />}
          </div>
        </main>
      </div>
      {receipt && <ReceiptModal tx={receipt} onClose={() => setReceipt(null)} />}
      <ToastContainer toasts={toasts} />
    </div>
  )
}
// ── LOGIN PAGE ─────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('admin@fartech.com')
  const [pass, setPass] = useState('admin123')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const doLogin = async () => {
    if (!email||!pass) { setErr('Remplissez tous les champs'); return }
    setLoading(true); setErr('')
    try { await onLogin(email, pass) }
    catch { setErr('Identifiants incorrects'); setLoading(false) }
  }
  return (
    <div id="login" style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div className="l-bg" /><div className="l-grid" />
      <div className="l-card">
        <div className="l-logo">
          <div className="l-mark">FT</div>
          <h1>FARTECH</h1>
          <p>Gestion de Boutique Technologique</p>
        </div>
        {err && <div className="l-err"><i className="fa fa-circle-xmark" /> {err}</div>}
        <div className="fg"><label>Adresse email</label>
          <div className="fi-wrap"><input className="fi" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@exemple.com" onKeyDown={e=>e.key==='Enter'&&doLogin()} /><i className="ico fa fa-envelope" /></div>
        </div>
        <div className="fg"><label>Mot de passe</label>
          <div className="fi-wrap"><input className="fi" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&doLogin()} /><i className="ico fa fa-lock" /></div>
        </div>
        <div className="l-hint"><i className="fa fa-circle-info" style={{color:'var(--cyan)'}} />Admin: admin@fartech.com / admin123 &nbsp;|&nbsp; Employé: emp@fartech.com / emp123</div>
        <button className="btn-login" onClick={doLogin} disabled={loading}><i className="fa fa-right-to-bracket" /> {loading?'Connexion…':'Se connecter'}</button>
      </div>
    </div>
  )
}

// ── DASHBOARD PAGE ─────────────────────────────────────────
function DashboardPage({ data, transactions, products, theme }) {
  const barRef = useRef(null), donutRef = useRef(null), saleExRef = useRef(null), prodRef = useRef(null)
  const barCI = useRef(null), donutCI = useRef(null), saleExCI = useRef(null), prodCI = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.Chart) return
    const timer = setTimeout(() => buildCharts(), 100)
    return () => clearTimeout(timer)
  }, [transactions, theme])

  const buildCharts = () => {
    if (!window.Chart) return
    const isDark = !document.body.classList.contains('light')
    const gc = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
    const tc = isDark ? '#94A3B8' : '#64748B'
    const now = new Date()
    const months = Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-5+i);return{label:d.toLocaleDateString('fr-FR',{month:'short'}),m:d.getMonth(),y:d.getFullYear()}})
    const txs = transactions || []

    // Bar chart - revenue by payment
    if (barRef.current) {
      if (barCI.current) { barCI.current.destroy(); barCI.current = null }
      const cashD = months.map(m=>txs.filter(t=>t.payment==='cash'&&new Date(t.date).getMonth()===m.m&&new Date(t.date).getFullYear()===m.y).reduce((a,t)=>a+t.amount,0))
      const orangeD = months.map(m=>txs.filter(t=>t.payment==='orange'&&new Date(t.date).getMonth()===m.m&&new Date(t.date).getFullYear()===m.y).reduce((a,t)=>a+t.amount,0))
      const waveD = months.map(m=>txs.filter(t=>t.payment==='wave'&&new Date(t.date).getMonth()===m.m&&new Date(t.date).getFullYear()===m.y).reduce((a,t)=>a+t.amount,0))
      barCI.current = new window.Chart(barRef.current.getContext('2d'), {type:'bar',data:{labels:months.map(m=>m.label),datasets:[{label:'Cash',data:cashD,backgroundColor:'rgba(16,185,129,.8)',borderRadius:5},{label:'Orange Money',data:orangeD,backgroundColor:'rgba(245,158,11,.8)',borderRadius:5},{label:'Wave',data:waveD,backgroundColor:'rgba(6,182,212,.8)',borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc,font:{family:'DM Sans',size:11}}}},scales:{x:{grid:{color:gc},ticks:{color:tc,font:{size:10}}},y:{grid:{color:gc},ticks:{color:tc,font:{size:10},callback:v=>v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?(v/1000)+'k':v}}}}})
    }

    // Donut chart - payment modes this month
    if (donutRef.current) {
      if (donutCI.current) { donutCI.current.destroy(); donutCI.current = null }
      const thisMTx = txs.filter(t=>{const d=new Date(t.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()})
      const cashT = thisMTx.filter(t=>t.payment==='cash').reduce((a,t)=>a+t.amount,0)
      const orangeT = thisMTx.filter(t=>t.payment==='orange').reduce((a,t)=>a+t.amount,0)
      const waveT = thisMTx.filter(t=>t.payment==='wave').reduce((a,t)=>a+t.amount,0)
      donutCI.current = new window.Chart(donutRef.current.getContext('2d'), {type:'doughnut',data:{labels:['Cash','Orange Money','Wave'],datasets:[{data:[cashT,orangeT,waveT],backgroundColor:['rgba(16,185,129,.85)','rgba(245,158,11,.85)','rgba(6,182,212,.85)'],borderWidth:0,hoverOffset:8}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{display:false}}}})
      const total = cashT+orangeT+waveT||1
      const dlegEl = document.getElementById('dleg-data')
      if (dlegEl) dlegEl.innerHTML = [{label:'Cash',v:cashT,c:'#10B981'},{label:'Orange Money',v:orangeT,c:'#F59E0B'},{label:'Wave',v:waveT,c:'#06B6D4'}].map(x=>`<div class="dleg-i"><div class="dleg-dot" style="background:${x.c}"></div><div><div style="font-weight:600;font-size:.8rem;">${x.label}</div><div style="color:var(--muted);font-size:.7rem;">${(x.v/total*100).toFixed(1)}%</div></div></div>`).join('')
    }

    // Sales vs Exchange line chart
    if (saleExRef.current) {
      if (saleExCI.current) { saleExCI.current.destroy(); saleExCI.current = null }
      const ventesD = months.map(m=>txs.filter(t=>t.type==='vente'&&new Date(t.date).getMonth()===m.m&&new Date(t.date).getFullYear()===m.y).length)
      const echangesD = months.map(m=>txs.filter(t=>t.type==='échange'&&new Date(t.date).getMonth()===m.m&&new Date(t.date).getFullYear()===m.y).length)
      saleExCI.current = new window.Chart(saleExRef.current.getContext('2d'), {type:'line',data:{labels:months.map(m=>m.label),datasets:[{label:'Ventes',data:ventesD,borderColor:'rgba(16,185,129,1)',backgroundColor:'rgba(16,185,129,0.1)',fill:true,tension:.4,pointRadius:4,borderWidth:2},{label:'Échanges',data:echangesD,borderColor:'rgba(6,182,212,1)',backgroundColor:'rgba(6,182,212,0.1)',fill:true,tension:.4,pointRadius:4,borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:tc,font:{family:'DM Sans',size:11}}}},scales:{x:{grid:{color:gc},ticks:{color:tc,font:{size:10}}},y:{grid:{color:gc},ticks:{color:tc,font:{size:10},stepSize:1}}}}})
    }

    // Top/Bottom products bar chart
    if (prodRef.current) {
      if (prodCI.current) { prodCI.current.destroy(); prodCI.current = null }
      const cnt = {}
      txs.forEach(t=>t.items?.forEach(p=>{cnt[p.name]=(cnt[p.name]||0)+p.qty}));
      (products||[]).forEach(p=>{if(!cnt[p.name])cnt[p.name]=0})
      const sorted = Object.entries(cnt).sort((a,b)=>b[1]-a[1])
      const top5 = sorted.slice(0,5), bot5 = sorted.slice(-5).reverse()
      const combined = [...top5,...bot5]
      prodCI.current = new window.Chart(prodRef.current.getContext('2d'), {type:'bar',data:{labels:combined.map(([n])=>n.length>12?n.substring(0,12)+'…':n),datasets:[{label:'Qté vendue',data:combined.map(([,v])=>v),backgroundColor:[...top5.map(()=>'rgba(37,99,235,0.75)'),...bot5.map(()=>'rgba(239,68,68,0.65)')],borderRadius:4}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:gc},ticks:{color:tc,font:{size:9},stepSize:1}},y:{grid:{color:gc},ticks:{color:tc,font:{size:9}}}}}})
    }
  }

  const txs = transactions || []
  const prods = products || []
  const now = new Date()
  const thisM = txs.filter(t=>{const d=new Date(t.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()})
  const lastM = txs.filter(t=>{const d=new Date(t.date);return d.getMonth()===(now.getMonth()-1+12)%12&&d.getFullYear()===(now.getMonth()===0?now.getFullYear()-1:now.getFullYear())})
  const rev = thisM.filter(t=>t.type==='vente').reduce((a,t)=>a+t.amount,0)
  const revL = lastM.filter(t=>t.type==='vente').reduce((a,t)=>a+t.amount,0)
  const revChange = revL ? ((rev-revL)/revL*100).toFixed(1) : null

  const kpis = [
    {label:"Chiffre d'affaires",value:fmt(rev),icon:'fa-sack-dollar',c:'#2563EB',rgb:'37,99,235',ch:revChange},
    {label:'Ventes ce mois',value:thisM.filter(t=>t.type==='vente').length,icon:'fa-cart-check',c:'#10B981',rgb:'16,185,129'},
    {label:'Échanges ce mois',value:thisM.filter(t=>t.type==='échange').length,icon:'fa-arrows-rotate',c:'#06B6D4',rgb:'6,182,212'},
    {label:'Stock faible',value:prods.filter(p=>p.qty<=2).length,icon:'fa-triangle-exclamation',c:'#EF4444',rgb:'239,68,68'},
    {label:'Total produits',value:prods.length,icon:'fa-mobile-screen',c:'#8B5CF6',rgb:'139,92,246'},
    {label:'Total ventes cumulées',value:fmt(txs.filter(t=>t.type==='vente').reduce((a,t)=>a+t.amount,0)),icon:'fa-chart-line',c:'#F59E0B',rgb:'245,158,11'},
    {label:'Total achats stock',value:fmt(prods.reduce((a,p)=>a+p.buyPrice*p.qty,0)),icon:'fa-shopping-bag',c:'#EC4899',rgb:'236,72,153'},
    {label:'Transactions totales',value:txs.length,icon:'fa-list-check',c:'#06B6D4',rgb:'6,182,212'},
  ]

  const cnt = {}; txs.forEach(t=>t.items?.forEach(p=>{cnt[p.name]=(cnt[p.name]||0)+p.qty}))
  const top5 = Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,5)
  const max = top5[0]?.[1]||1
  const rcls = ['r1','r2','r3','ro','ro']
  const recent = [...txs].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,6)

  return (
    <div className="page active">
      {/* KPI Grid */}
      <div className="kpi-grid">
        {kpis.map((k,i) => (
          <div key={i} className="kpi" style={{'--kc':k.c,'--krgb':k.rgb}}>
            <div className="kpi-ico"><i className={`fa ${k.icon}`} /></div>
            <div className="kpi-val">{k.value}</div>
            <div className="kpi-lbl">{k.label}</div>
            {k.ch!=null && <div className={`kpi-ch ${Number(k.ch)>=0?'up':'dn'}`}><i className={`fa fa-arrow-${Number(k.ch)>=0?'up':'down'}`} />{Math.abs(k.ch)}%</div>}
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="ch-grid">
        <div className="gc gc-p">
          <div className="sh"><div><div className="sh-t">Ventes & Échanges — 6 derniers mois</div><div className="sh-sub">Revenus par mode de paiement</div></div></div>
          <div style={{height:'220px'}}><canvas ref={barRef} /></div>
        </div>
        <div className="gc gc-p">
          <div className="sh"><div className="sh-t">Modes de paiement ce mois</div></div>
          <div style={{display:'flex',alignItems:'center',height:'200px'}}>
            <div style={{flex:1,height:'190px'}}><canvas ref={donutRef} /></div>
            <div className="dleg"><div id="dleg-data" /></div>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="ch-grid">
        <div className="gc gc-p">
          <div className="sh"><div className="sh-t">Ventes vs Échanges par mois</div></div>
          <div style={{height:'220px'}}><canvas ref={saleExRef} /></div>
        </div>
        <div className="gc gc-p">
          <div className="sh"><div className="sh-t">Top 10 produits — Vendus & moins vendus</div></div>
          <div style={{height:'220px'}}><canvas ref={prodRef} /></div>
        </div>
      </div>

      {/* Top 5 + Recent */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'20px'}}>
        <div className="gc gc-p">
          <div className="sh"><div className="sh-t">Top 5 Produits vendus</div></div>
          {top5.length ? top5.map(([name,qty],i) => (
            <div key={i} className="tp">
              <div className={`tp-rank ${rcls[i]}`}>{i+1}</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:'.84rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{name}</div><div style={{fontSize:'.72rem',color:'var(--muted)'}}>{qty} vendus</div></div>
              <div className="tp-bar"><div className="tp-fill" style={{width:`${qty/max*100}%`}} /></div>
            </div>
          )) : <div className="empty"><i className="fa fa-chart-bar" /><p>Aucune vente</p></div>}
        </div>
        <div className="gc gc-p">
          <div className="sh"><div className="sh-t">Activité récente</div></div>
          {recent.length ? recent.map((t,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',padding:'9px 0',borderBottom:'1px solid var(--border)'}}>
              <div style={{width:30,height:30,borderRadius:8,background:t.type==='vente'?'rgba(16,185,129,.1)':'rgba(6,182,212,.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.8rem',color:t.type==='vente'?'#10B981':'#06B6D4',flexShrink:0}}>
                <i className={`fa ${t.type==='vente'?'fa-cart-check':'fa-arrows-rotate'}`} />
              </div>
              <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:'.82rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.client}</div><div style={{fontSize:'.7rem',color:'var(--muted)'}}>{fmtDT(t.date)}</div></div>
              <div style={{textAlign:'right',flexShrink:0}}><div style={{fontFamily:'Arial',fontWeight:700,fontSize:'.88rem',color:'var(--cyan)'}}>{fmt(t.amount)}</div><div style={{fontSize:'.68rem',color:'var(--dim)'}}>{payLabel(t.payment)}</div></div>
            </div>
          )) : <div className="empty"><i className="fa fa-clock-rotate-left" /><p>Aucune activité</p></div>}
        </div>
      </div>
    </div>
  )
}
// ── POS PAGE ──────────────────────────────────────────────
function POSPage({ products, categories, brands, transactions, user, toast, onDone }) {
  const [cart, setCart] = useState([])
  const [srch, setSrch] = useState('')
  const [catF, setCatF] = useState('')
  const [brF, setBrF] = useState('')
  const [disc, setDisc] = useState(0)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [payMode, setPayMode] = useState(null) // can be array for multi-pay
  const [multiPay, setMultiPay] = useState({cash:0,orange:0,wave:0})
  const [useMulti, setUseMulti] = useState(false)
  const [saving, setSaving] = useState(false)
  const [useMultiX, setUseMultiX] = useState(false)
  const [multiPayX, setMultiPayX] = useState({cash:0,orange:0,wave:0})

  const filtered = products.filter(p => {
    if (p.qty <= 0) return false
    if (srch && !p.name.toLowerCase().includes(srch.toLowerCase()) && !p.imei?.toLowerCase().includes(srch.toLowerCase())) return false
    if (catF && p.categoryId && p.category?.name !== catF) return false
    if (brF && p.brand?.name !== brF) return false
    return true
  })

  const sub = cart.reduce((a,c)=>a+c.price*c.qty,0)
  const cost = cart.reduce((a,c)=>a+c.buyPrice*c.qty,0)
  const total = sub*(1-Math.min(100,Math.max(0,disc))/100)

  const addCart = (p) => {
    if (p.qty <= 0) { toast('Rupture de stock','err'); return }
    setCart(prev => {
      const ex = prev.find(c=>c.id===p.id)
      if (ex) { if (ex.qty>=p.qty) { toast('Stock max atteint','err'); return prev } return prev.map(c=>c.id===p.id?{...c,qty:c.qty+1}:c) }
      return [...prev, {id:p.id,name:p.name,price:p.sellPrice,buyPrice:p.buyPrice,qty:1,imei:p.imei,photo:p.photo,cat:p.category?.name}]
    })
  }

  const autoFillPhone = (name) => {
    const tx = transactions.find(t=>t.client===name&&t.phone)
    if (tx) setClientPhone(tx.phone||'')
  }

  const clients = [...new Set(transactions.filter(t=>t.client&&t.client!=='Client anonyme').map(t=>t.client))]

  const finSale = async () => {
    if (!cart.length) { toast('Panier vide','err'); return }
    if (!payMode && !useMulti) { toast('Choisissez un mode de paiement','err'); return }
    setSaving(true)
    try {
      const payment = useMulti ? 'multi' : payMode
      const payDetails = useMulti ? multiPay : null
      const tx = await API.createTransaction({
        client: clientName.trim()||'Client anonyme',
        phone: clientPhone.trim(),
        type: 'vente',
        payment,
        payDetails,
        discount: disc,
        subtotal: sub,
        amount: total,
        items: cart.map(c=>({productId:c.id,name:c.name,qty:c.qty,price:c.price,imei:c.imei})),
        employee: user.name
      })
      setCart([]); setClientName(''); setClientPhone(''); setDisc(0); setPayMode(null); setMultiPay({cash:0,orange:0,wave:0}); setUseMulti(false)
      await onDone(tx)
      toast('Vente finalisée !','ok')
    } catch(e) { toast(e.message,'err') } finally { setSaving(false) }
  }

  return (
    <div className="page active">
      <div className="info-strip">
        <div className="is-item"><div className="is-lbl">Articles</div><div className="is-val">{cart.reduce((a,c)=>a+c.qty,0)}</div></div>
        <div className="is-item"><div className="is-lbl">Coût total d'achat</div><div className="is-val" style={{color:'var(--orange)'}}>{fmt(cost)}</div></div>
      </div>
      <div className="pos-layout">
        <div className="pos-cat">
          <div className="fb">
            <div className="sb2"><i className="fa fa-search" /><input type="text" placeholder="Rechercher produit, IMEI…" value={srch} onChange={e=>setSrch(e.target.value)} /></div>
            <select className="fsel" value={catF} onChange={e=>setCatF(e.target.value)}>
              <option value="">Toutes catégories</option>
              {categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <select className="fsel" value={brF} onChange={e=>setBrF(e.target.value)}>
              <option value="">Toutes marques</option>
              {brands.map(b=><option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
          <div className="pg">
            {filtered.length ? filtered.map(p => {
              const inCart = cart.find(c=>c.id===p.id)
              const [bc,bl] = stockBadge(p.qty)
              return (
                <div key={p.id} className={`pc${inCart?' sel':''}`} onClick={()=>addCart(p)}>
                  <div className="pc-img">{p.photo?<img src={p.photo} alt="" />:<span>{prodEmoji(p.category?.name)}</span>}</div>
                  <div className="pc-name">{p.name}</div>
                  <div style={{fontSize:'.7rem',color:'var(--muted)',marginBottom:4}}>{p.brand?.name}{p.storage?' · '+p.storage:''}</div>
                  <div className="pc-price">{fmt(p.sellPrice)}</div>
                  <div className="pc-stock"><span className={bc}>{p.qty} en stock</span></div>
                  {inCart && <div className="pc-badge">{inCart.qty}</div>}
                </div>
              )
            }) : <div className="empty" style={{gridColumn:'1/-1'}}><i className="fa fa-search" /><p>Aucun produit</p></div>}
          </div>
        </div>
        <div className="pos-cart">
          <div style={{padding:'13px 16px',borderBottom:'1px solid var(--border)',fontFamily:'Syne',fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
            <i className="fa fa-cart-shopping" style={{color:'var(--cyan)'}} /> Panier
          </div>
          <div className="cart-scroll">
            {cart.length ? cart.map(c => (
              <div key={c.id} className="ci">
                <div className="ci-thumb">{c.photo?<img src={c.photo} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:8}} alt="" />:prodEmoji(c.cat)}</div>
                <div className="ci-info"><div className="ci-name">{c.name}</div><div className="ci-price">{fmt(c.price)} × {c.qty} = {fmt(c.price*c.qty)}</div></div>
                <div className="qc">
                  <div className="qb" onClick={()=>setCart(prev=>prev.map(x=>x.id===c.id?{...x,qty:Math.max(1,x.qty-1)}:x))}><i className="fa fa-minus" /></div>
                  <span style={{fontWeight:700,minWidth:18,textAlign:'center',fontSize:'.9rem'}}>{c.qty}</span>
                  <div className="qb" onClick={()=>{const p=products.find(x=>x.id===c.id);setCart(prev=>prev.map(x=>x.id===c.id?{...x,qty:Math.min(x.qty+1,p?.qty||99)}:x))}}><i className="fa fa-plus" /></div>
                  <div className="qb" onClick={()=>setCart(prev=>prev.filter(x=>x.id!==c.id))} style={{marginLeft:3}}><i className="fa fa-trash" style={{color:'var(--red)',fontSize:'.72rem'}} /></div>
                </div>
              </div>
            )) : <div className="empty"><i className="fa fa-cart-shopping" /><p>Panier vide</p></div>}
          </div>
          <div className="cart-sum">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
              <div className="f"><label>Client</label>
                <input type="text" value={clientName} onChange={e=>{setClientName(e.target.value);autoFillPhone(e.target.value)}} placeholder="Nom ou nouveau client" list="cli-list" autoComplete="off" />
                <datalist id="cli-list">{clients.map(c=><option key={c} value={c}>{c}</option>)}</datalist>
              </div>
              <div className="f"><label>Téléphone</label><input type="text" value={clientPhone} onChange={e=>setClientPhone(e.target.value)} placeholder="+221 7X…" /></div>
            </div>
            <div className="sr"><span>Sous-total</span><span>{fmt(sub)}</span></div>
            <div className="sr"><span>Remise (%)</span><input type="number" value={disc} onChange={e=>setDisc(Number(e.target.value))} min="0" max="100" style={{width:56,padding:'4px 8px',background:'var(--card)',border:'1px solid var(--border)',borderRadius:7,color:'var(--text)',fontSize:'.82rem'}} /></div>
            <div className="sr total"><span>Total</span><span>{fmt(total)}</span></div>
            
            {/* Multi-pay toggle */}
            <div style={{marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
              <label style={{fontSize:'.72rem',color:'var(--muted)',cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
                <input type="checkbox" checked={useMulti} onChange={e=>setUseMulti(e.target.checked)} />
                Paiement mixte (Cash+Orange+Wave)
              </label>
            </div>
            
            {useMulti ? (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:10}}>
                {[['cash','Cash','var(--green)'],['orange','Orange','var(--orange)'],['wave','Wave','var(--cyan)']].map(([k,lbl,c])=>(
                  <div key={k} className="f"><label style={{color:c}}>{lbl}</label><input type="number" min="0" value={multiPay[k]} onChange={e=>setMultiPay(p=>({...p,[k]:Number(e.target.value)}))} style={{fontSize:'.78rem'}} /></div>
                ))}
              </div>
            ) : (
              <div className="pay-row">
                {[['cash','fa-money-bill-wave','Cash'],['orange','fa-mobile-screen-button','Orange'],['wave','fa-wave-square','Wave']].map(([k,ico,lbl])=>(
                  <div key={k} className={`pay-btn${payMode===k?' sel-'+k:''}`} onClick={()=>setPayMode(k)}>
                    <span className="pi"><i className={`fa ${ico}`} /></span><span>{lbl}</span>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-blue" style={{width:'100%',justifyContent:'center'}} onClick={finSale} disabled={saving}>
              <i className="fa fa-check" /> {saving?'En cours…':'Finaliser la vente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
// ── EXCHANGE PAGE ─────────────────────────────────────────
function ExchangePage({ products, transactions, user, toast, onDone }) {
  const [step, setStep] = useState(1)
  const [old, setOld] = useState({brand:'',model:'',storage:'64 Go',color:'',imei:'',cond:'',screen:'',battery:'',faceid:'',charger:''})
  const [newProd, setNewProd] = useState(null)
  const [payMode, setPayMode] = useState(null)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [srch, setSrch] = useState('')
  const [saving, setSaving] = useState(false)

  const calcVal = () => {
    let base = 0
    if (old.cond==='Excellent') base=80000; else if(old.cond==='Bon') base=55000; else if(old.cond==='Acceptable') base=30000; else base=10000
    if (old.screen==='Aucune fissure') base*=1; else if(old.screen==='Micro-rayures') base*=.9; else if(old.screen==='Fissure légère') base*=.7; else base*=.4
    if (old.battery==='Très bonne') base*=1; else if(old.battery==='Bonne') base*=.95; else if(old.battery==='Moyenne') base*=.85; else base*=.7
    if (old.faceid!=='Fonctionne') base*=.85
    if (old.charger!=='Inclus') base*=.95
    return Math.round(base/1000)*1000
  }

  const oldVal = calcVal()
  const diff = newProd ? Math.max(0, newProd.sellPrice - oldVal) : 0

  const clients = [...new Set(transactions.filter(t=>t.client&&t.client!=='Client anonyme').map(t=>t.client))]
  const autoFillPhone = (name) => { const tx=transactions.find(t=>t.client===name&&t.phone); if(tx) setClientPhone(tx.phone||'') }

  const filteredProds = products.filter(p=>p.qty>0&&(!srch||p.name.toLowerCase().includes(srch.toLowerCase())))

  const confirm = async () => {
    if (!newProd) { toast('Sélectionnez un produit','err'); return }
    if (!useMultiX && !payMode) { toast('Choisissez un mode de paiement','err'); return }
    setSaving(true)
    try {
      const tx = await API.createTransaction({
        client: clientName.trim()||'Client échange',
        phone: clientPhone.trim(),
        type: 'échange',
        payment: useMultiX ? 'multi' : payMode,
        payDetails: useMultiX ? multiPayX : null,
        discount: 0,
        subtotal: newProd.sellPrice,
        amount: diff,
        oldPhone: `${old.brand} ${old.model}`,
        oldPhoneStorage: old.storage,
        oldPhoneImei: old.imei,
        oldPhoneCond: old.cond,
        oldPhoneVal: oldVal,
        newPhoneName: newProd.name,
        newPhoneImei: newProd.imei,
        newPhoneStorage: newProd.storage,
        items: [{productId:newProd.id,name:newProd.name,qty:1,price:newProd.sellPrice,imei:newProd.imei}],
        employee: user.name
      })
      setStep(1); setOld({brand:'',model:'',storage:'64 Go',color:'',imei:'',cond:'',screen:'',battery:'',faceid:'',charger:''}); setNewProd(null); setPayMode(null)
      await onDone(tx)
      toast('Échange confirmé !','ok')
    } catch(e) { toast(e.message,'err') } finally { setSaving(false) }
  }

  const EB = ({label,field,value}) => <div className={`eb${old[field]===value?' sel':''}`} onClick={()=>setOld(p=>({...p,[field]:value}))}>{value}</div>

  return (
    <div className="page active">
      <div className="gc gc-p" style={{maxWidth:780,margin:'0 auto'}}>
        {/* Stepper */}
        <div className="stepper">
          {[1,2,3].map((n,i) => (<>
            <div key={n} className={`step${step===n?' active':step>n?' done':''}`}>
              <div className="sn">{step>n?<i className="fa fa-check" />:n}</div>
              <div className="sl">{['Ancien appareil','Nouvel appareil','Confirmation'][i]}</div>
            </div>
            {n<3&&<div key={`l${n}`} className={`sline${step>n?' done':''}`} />}
          </>))}
        </div>

        {step===1 && (
          <div>
            <h3 style={{fontFamily:'Syne',fontWeight:700,marginBottom:20}}>Évaluation de l'ancien appareil</h3>
            <div className="fg2">
              <div className="f"><label>Marque *</label><input type="text" value={old.brand} onChange={e=>setOld(p=>({...p,brand:e.target.value}))} placeholder="ex. Apple" /></div>
              <div className="f"><label>Modèle *</label><input type="text" value={old.model} onChange={e=>setOld(p=>({...p,model:e.target.value}))} placeholder="ex. iPhone 11" /></div>
              <div className="f"><label>Stockage</label><select value={old.storage} onChange={e=>setOld(p=>({...p,storage:e.target.value}))}>{['16 Go','32 Go','64 Go','128 Go','256 Go','512 Go'].map(s=><option key={s}>{s}</option>)}</select></div>
              <div className="f"><label>Couleur</label><input type="text" value={old.color} onChange={e=>setOld(p=>({...p,color:e.target.value}))} placeholder="Couleur" /></div>
              <div className="f"><label>IMEI ancien tél.</label><input type="text" value={old.imei} onChange={e=>setOld(p=>({...p,imei:e.target.value}))} placeholder="IMEI / N° série" /></div>
            </div>
            <div className="f" style={{margin:'14px 0'}}><label>État général</label><div className="eg">{['Excellent','Bon','Acceptable','Endommagé'].map(v=><EB key={v} label={v} field="cond" value={v} />)}</div></div>
            <div className="f" style={{margin:'12px 0'}}><label>État de l'écran</label><div className="eg">{['Aucune fissure','Micro-rayures','Fissure légère','Écran cassé'].map(v=><EB key={v} label={v} field="screen" value={v} />)}</div></div>
            <div className="f" style={{margin:'12px 0'}}><label>Batterie</label><div className="eg">{['Très bonne','Bonne','Moyenne','Mauvaise'].map(v=><EB key={v} label={v} field="battery" value={v} />)}</div></div>
            <div className="f" style={{margin:'12px 0'}}><label>Face ID / Touch ID</label><div className="eg">{['Fonctionne','Ne fonctionne pas'].map(v=><EB key={v} label={v} field="faceid" value={v} />)}</div></div>
            <div className="f" style={{margin:'12px 0'}}><label>Chargeur</label><div className="eg">{['Inclus','Non inclus'].map(v=><EB key={v} label={v} field="charger" value={v} />)}</div></div>
            {old.cond && (
              <div style={{background:'linear-gradient(135deg,rgba(37,99,235,.12),rgba(6,182,212,.06))',border:'1px solid rgba(6,182,212,.2)',borderRadius:12,padding:'16px 20px',margin:'16px 0',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
                <div><div style={{fontSize:'.72rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.07em'}}>Valeur estimée de reprise</div>
                <div style={{fontFamily:'Arial',fontWeight:800,fontSize:'1.6rem',color:'var(--cyan)',marginTop:4}}>{fmt(oldVal)}</div></div>
              </div>
            )}
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:16}}>
              <button className="btn btn-blue" onClick={()=>{if(!old.brand||!old.model){toast('Marque et modèle requis','err');return}if(!old.cond){toast('Sélectionnez l\'état','err');return}setStep(2)}}><i className="fa fa-arrow-right" /> Suivant</button>
            </div>
          </div>
        )}

        {step===2 && (
          <div>
            <h3 style={{fontFamily:'Syne',fontWeight:700,marginBottom:16}}>Sélectionner le nouveau téléphone</h3>
            <div className="sb2" style={{marginBottom:14,maxWidth:360}}><i className="fa fa-search" /><input type="text" placeholder="Rechercher…" value={srch} onChange={e=>setSrch(e.target.value)} /></div>
            <div className="pg">
              {filteredProds.map(p=>(
                <div key={p.id} className={`pc${newProd?.id===p.id?' sel':''}`} onClick={()=>setNewProd(p)}>
                  <div className="pc-img">{p.photo?<img src={p.photo} alt="" />:<span>{prodEmoji(p.category?.name)}</span>}</div>
                  <div className="pc-name">{p.name}</div>
                  <div style={{fontSize:'.7rem',color:'var(--muted)',marginBottom:4}}>{p.brand?.name}{p.storage?' · '+p.storage:''}</div>
                  <div className="pc-price">{fmt(p.sellPrice)}</div>
                  <div className="pc-stock"><span className={stockBadge(p.qty)[0]}>{p.qty} en stock</span></div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:16}}>
              <button className="btn btn-ghost" onClick={()=>setStep(1)}><i className="fa fa-arrow-left" /> Retour</button>
              <button className="btn btn-blue" onClick={()=>{if(!newProd){toast('Sélectionnez un produit','err');return}setStep(3)}}><i className="fa fa-arrow-right" /> Suivant</button>
            </div>
          </div>
        )}

        {step===3 && newProd && (
          <div>
            <h3 style={{fontFamily:'Syne',fontWeight:700,marginBottom:20}}>Confirmation de l'échange</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <div style={{background:'rgba(239,68,68,.07)',border:'1px solid rgba(239,68,68,.2)',borderRadius:12,padding:'14px 16px'}}>
                <div style={{fontSize:'.65rem',color:'var(--red)',textTransform:'uppercase',fontWeight:700,marginBottom:8}}>Ancien téléphone</div>
                <div style={{fontWeight:700}}>{old.brand} {old.model}</div>
                {old.imei&&<div style={{fontSize:'.72rem',color:'var(--muted)'}}>IMEI: {old.imei}</div>}
                <div style={{fontSize:'.72rem',color:'var(--muted)'}}>État: {old.cond}</div>
                <div style={{fontFamily:'Arial',fontWeight:700,color:'var(--orange)',marginTop:8}}>{fmt(oldVal)}</div>
              </div>
              <div style={{background:'rgba(16,185,129,.07)',border:'1px solid rgba(16,185,129,.2)',borderRadius:12,padding:'14px 16px'}}>
                <div style={{fontSize:'.65rem',color:'var(--green)',textTransform:'uppercase',fontWeight:700,marginBottom:8}}>Nouveau téléphone</div>
                <div style={{fontWeight:700}}>{newProd.name}</div>
                {newProd.imei&&<div style={{fontSize:'.72rem',color:'var(--muted)'}}>IMEI: {newProd.imei}</div>}
                {newProd.storage&&<div style={{fontSize:'.72rem',color:'var(--muted)'}}>{newProd.storage}</div>}
                <div style={{fontFamily:'Arial',fontWeight:700,color:'var(--cyan)',marginTop:8}}>{fmt(newProd.sellPrice)}</div>
              </div>
            </div>
            <div style={{background:'rgba(37,99,235,.08)',border:'1px solid rgba(37,99,235,.2)',borderRadius:12,padding:'14px 18px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{fontSize:'.82rem',color:'var(--muted)'}}>Différence à payer</div>
              <div style={{fontFamily:'Arial',fontWeight:800,fontSize:'1.5rem',color:'var(--cyan)'}}>{fmt(diff)}</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
              <div className="f"><label>Client</label>
                <input type="text" value={clientName} onChange={e=>{setClientName(e.target.value);autoFillPhone(e.target.value)}} placeholder="Nom du client" list="xcli-list" autoComplete="off" />
                <datalist id="xcli-list">{clients.map(c=><option key={c} value={c}>{c}</option>)}</datalist>
              </div>
              <div className="f"><label>Téléphone</label><input type="text" value={clientPhone} onChange={e=>setClientPhone(e.target.value)} placeholder="+221 7X…" /></div>
            </div>
            <div style={{marginBottom:8}}>
              <label style={{fontSize:'.72rem',color:'var(--muted)',cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                <input type="checkbox" checked={useMultiX} onChange={e=>setUseMultiX(e.target.checked)} />
                Paiement mixte (Cash + Orange + Wave)
              </label>
            </div>
            {useMultiX ? (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12}}>
                {[['cash','Cash','var(--green)'],['orange','Orange','var(--orange)'],['wave','Wave','var(--cyan)']].map(([k,lbl,c])=>(
                  <div key={k} className="f"><label style={{color:c,fontSize:'.72rem'}}>{lbl} (FCFA)</label><input type="number" min="0" value={multiPayX[k]||0} onChange={e=>setMultiPayX(p=>({...p,[k]:Number(e.target.value)}))} style={{fontSize:'.78rem'}} /></div>
                ))}
              </div>
            ) : (
              <div className="pay-row">
                {[['cash','fa-money-bill-wave','Cash'],['orange','fa-mobile-screen-button','Orange'],['wave','fa-wave-square','Wave']].map(([k,ico,lbl])=>(
                  <div key={k} className={`pay-btn${payMode===k?' sel-'+k:''}`} onClick={()=>setPayMode(k)}>
                    <span className="pi"><i className={`fa ${ico}`} /></span><span>{lbl}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{display:'flex',justifyContent:'space-between',marginTop:16}}>
              <button className="btn btn-ghost" onClick={()=>setStep(2)}><i className="fa fa-arrow-left" /> Retour</button>
              <button className="btn btn-blue" onClick={confirm} disabled={saving}><i className="fa fa-check" /> {saving?'En cours…':'Confirmer l\'échange'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
// ── PRODUCTS PAGE ─────────────────────────────────────────
function ProductsPage({ products, categories, brands, suppliers, user, toast, onRefresh }) {
  const [srch, setSrch] = useState('')
  const [catF, setCatF] = useState('')
  const [brF, setBrF] = useState('')
  const [stF, setStF] = useState('')
  const [modal, setModal] = useState(null) // null|{id?}
  const [form, setForm] = useState({})
  const [photo, setPhoto] = useState('')
  const [detail, setDetail] = useState(null)
  const [saving, setSaving] = useState(false)
  const isAdmin = user?.role==='admin'

  const filtered = products.filter(p => {
    if (srch && !p.name.toLowerCase().includes(srch.toLowerCase()) && !p.imei?.toLowerCase().includes(srch.toLowerCase())) return false
    if (catF && p.category?.name !== catF) return false
    if (brF && p.brand?.name !== brF) return false
    if (stF==='ok' && p.qty<=2) return false
    if (stF==='low' && (p.qty===0||p.qty>2)) return false
    if (stF==='out' && p.qty!==0) return false
    return true
  })

  const openModal = (p=null) => {
    if (p) {
      setForm({name:p.name||'',imei:p.imei||'',brandId:p.brandId||'',categoryId:p.categoryId||'',storage:p.storage||'',state:p.state||'Neuf',color:p.color||'',buyPrice:p.buyPrice||'',sellPrice:p.sellPrice||'',qty:p.qty||0,supplierId:p.supplierId||'',desc:p.desc||''})
      setPhoto(p.photo||'')
      setModal({id:p.id})
    } else {
      setForm({state:'Neuf',qty:0})
      setPhoto('')
      setModal({})
    }
  }

  const loadPhoto = (e) => {
    const f = e.target.files[0]; if(!f) return
    const r = new FileReader()
    r.onload = ev => setPhoto(ev.target.result)
    r.readAsDataURL(f)
  }

  const save = async () => {
    if (!form.name?.trim()) { toast('Nom requis','err'); return }
    if (!form.brandId) { toast('Marque requise — ajoutez une marque d\'abord','err'); return }
    if (!form.categoryId) { toast('Catégorie requise — ajoutez une catégorie d\'abord','err'); return }
    if (!form.buyPrice || !form.sellPrice) { toast('Prix d\'achat et de vente requis','err'); return }
    setSaving(true)
    try {
      const data = {
        name: form.name.trim(),
        imei: form.imei || null,
        brandId: Number(form.brandId),
        categoryId: Number(form.categoryId),
        storage: form.storage || null,
        state: form.state || 'Neuf',
        color: form.color || null,
        buyPrice: Number(form.buyPrice),
        sellPrice: Number(form.sellPrice),
        qty: Number(form.qty || 0),
        supplierId: form.supplierId ? Number(form.supplierId) : null,
        desc: form.desc || null,
        photo: photo || null
      }
      if (modal.id) { await API.updateProduct(modal.id, data) } else { await API.createProduct(data) }
      setModal(null)
      await onRefresh()
      toast(modal.id ? 'Produit modifié !' : 'Produit ajouté !', 'ok')
    } catch(e) { toast(e.message, 'err') } finally { setSaving(false) }
  }

  const del = async (id) => {
    if (!confirm('Supprimer ce produit ?')) return
    try { await API.deleteProduct(id); await onRefresh(); toast('Produit supprimé','inf') }
    catch(e) { toast(e.message,'err') }
  }

  return (
    <div className="page active">
      <div className="sh">
        <div><div className="sh-t">Catalogue Produits</div><div className="sh-sub">{filtered.length} produit(s) · {filtered.reduce((a,p)=>a+p.qty,0)} unités</div></div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>expPDF('prod-tbl','Produits')}><i className="fa fa-file-pdf" /> PDF</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>expXLS('prod-tbl','Produits')}><i className="fa fa-file-excel" /> Excel</button>
          {isAdmin && <button className="btn btn-blue btn-sm" onClick={()=>openModal()}><i className="fa fa-plus" /> Ajouter</button>}
        </div>
      </div>
      <div className="fb">
        <div className="sb2"><i className="fa fa-search" /><input type="text" placeholder="Rechercher…" value={srch} onChange={e=>setSrch(e.target.value)} /></div>
        <select className="fsel" value={catF} onChange={e=>setCatF(e.target.value)}><option value="">Catégorie</option>{categories.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select>
        <select className="fsel" value={brF} onChange={e=>setBrF(e.target.value)}><option value="">Marque</option>{brands.map(b=><option key={b.id} value={b.name}>{b.name}</option>)}</select>
        <select className="fsel" value={stF} onChange={e=>setStF(e.target.value)}><option value="">Statut</option><option value="ok">En stock</option><option value="low">Stock faible</option><option value="out">Rupture</option></select>
      </div>
      <div className="tw">
        <table className="dt" id="prod-tbl">
          <thead><tr><th>Photo</th><th>Produit</th><th>Marque</th><th>Catégorie</th><th>Stockage</th><th>État</th><th>Prix achat</th><th>Prix vente</th><th>Stock</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.length ? filtered.map(p => {
              const [bc,bl] = stockBadge(p.qty)
              return (
                <tr key={p.id}>
                  <td>{p.photo?<img src={p.photo} style={{width:40,height:40,borderRadius:8,objectFit:'cover'}} alt="" />:<div style={{width:40,height:40,borderRadius:8,background:'rgba(37,99,235,.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem'}}>{prodEmoji(p.category?.name)}</div>}</td>
                  <td><div style={{fontWeight:600}}>{p.name}</div>{p.imei&&<div style={{fontSize:'.7rem',color:'var(--muted)'}}>IMEI: {p.imei}</div>}</td>
                  <td>{p.brand?.name}</td><td>{p.category?.name}</td><td>{p.storage||'—'}</td>
                  <td><span className={`bd ${p.state==='Neuf'?'bg':'bo'}`}>{p.state}</span></td>
                  <td style={{fontFamily:'Arial'}}>{fmt(p.buyPrice)}</td>
                  <td style={{fontFamily:'Arial',fontWeight:700,color:'var(--cyan)'}}>{fmt(p.sellPrice)}</td>
                  <td style={{fontWeight:700}}>{p.qty}</td>
                  <td><span className={bc}>{bl}</span></td>
                  <td><div style={{display:'flex',gap:5,justifyContent:'flex-end'}}>
                    <button className="btn btn-ghost btn-xs" onClick={()=>setDetail(p)}><i className="fa fa-eye" /></button>
                    {isAdmin&&<><button className="btn btn-ghost btn-xs" onClick={()=>openModal(p)}><i className="fa fa-pen" /></button>
                    <button className="btn btn-red btn-xs" onClick={()=>del(p.id)}><i className="fa fa-trash" /></button></>}
                  </div></td>
                </tr>
              )
            }) : <tr><td colSpan={11}><div className="empty"><i className="fa fa-box-open" /><p>Aucun produit</p></div></td></tr>}
          </tbody>
        </table>
      </div>

      {/* Product Detail Modal */}
      {detail && (
        <div className="mo open" onClick={e=>e.target===e.currentTarget&&setDetail(null)}>
          <div className="mb mb-md">
            <div className="mh"><div className="mh-t">Détails du produit</div><button className="xb" onClick={()=>setDetail(null)}><i className="fa fa-xmark" /></button></div>
            <div className="mbody">
              <div style={{display:'flex',gap:20,flexWrap:'wrap',marginBottom:20}}>
                {detail.photo?<img src={detail.photo} style={{width:120,height:120,borderRadius:12,objectFit:'cover'}} alt="" />:<div style={{width:120,height:120,borderRadius:12,background:'rgba(37,99,235,.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'3rem'}}>{prodEmoji(detail.category?.name)}</div>}
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontFamily:'Syne',fontWeight:800,fontSize:'1.3rem',marginBottom:6}}>{detail.name}</div>
                  <div style={{color:'var(--muted)',fontSize:'.84rem',marginBottom:4}}><i className="fa fa-tag" /> {detail.brand?.name} · {detail.category?.name}</div>
                  {detail.imei&&<div style={{fontSize:'.78rem',color:'var(--dim)'}}><i className="fa fa-barcode" /> IMEI: {detail.imei}</div>}
                  <div style={{marginTop:12,display:'flex',gap:8,flexWrap:'wrap'}}>
                    <span className={`bd ${detail.state==='Neuf'?'bg':'bo'}`}>{detail.state}</span>
                    {detail.storage&&<span className="bd bc">{detail.storage}</span>}
                    {detail.color&&<span className="bd bp">{detail.color}</span>}
                  </div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:12}}>
                {[['Prix achat',fmt(detail.buyPrice),'var(--orange)'],['Prix vente',fmt(detail.sellPrice),'var(--cyan)'],['Marge',fmt(detail.sellPrice-detail.buyPrice),'var(--green)'],['Stock',`${detail.qty} unités`,'var(--text)']].map(([l,v,c])=>(
                  <div key={l} className="gc gc-p" style={{padding:14}}><div style={{fontSize:'.65rem',color:'var(--muted)',textTransform:'uppercase'}}>{l}</div><div style={{fontFamily:'Arial',fontWeight:700,fontSize:'1.05rem',color:c,marginTop:4}}>{v}</div></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {modal !== null && (
        <div className="mo open" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="mb mb-lg">
            <div className="mh"><div className="mh-t">{modal.id?'Modifier le produit':'Nouveau Produit'}</div><button className="xb" onClick={()=>setModal(null)}><i className="fa fa-xmark" /></button></div>
            <div className="mbody">
              <div style={{display:'flex',gap:20,marginBottom:20,flexWrap:'wrap'}}>
                <div className="photo-upload">
                  <div className="photo-preview" onClick={()=>document.getElementById('ph-inp').click()}>
                    {photo?<img src={photo} alt="" />:<><span>📷</span><span className="ph-hint">Ajouter photo</span></>}
                  </div>
                  <input type="file" id="ph-inp" accept="image/*" style={{display:'none'}} onChange={loadPhoto} />
                  <button className="btn btn-ghost btn-xs" onClick={()=>setPhoto('')}><i className="fa fa-trash" /> Supprimer</button>
                </div>
                <div style={{flex:1,minWidth:240}}>
                  <div className="fg2">
                    <div className="f"><label>Nom *</label><input type="text" value={form.name||''} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="iPhone 15 Pro..." /></div>
                    <div className="f"><label>Marque *</label><select value={form.brandId||''} onChange={e=>setForm(p=>({...p,brandId:e.target.value}))}><option value="">Sélectionner…</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                    <div className="f"><label>Catégorie *</label><select value={form.categoryId||''} onChange={e=>setForm(p=>({...p,categoryId:e.target.value}))}><option value="">Sélectionner…</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    <div className="f"><label>IMEI</label><input type="text" value={form.imei||''} onChange={e=>setForm(p=>({...p,imei:e.target.value}))} placeholder="IMEI / N° série" /></div>
                    <div className="f"><label>Stockage</label><select value={form.storage||''} onChange={e=>setForm(p=>({...p,storage:e.target.value}))}><option value="">—</option>{['16 Go','32 Go','64 Go','128 Go','256 Go','512 Go','1 To'].map(s=><option key={s}>{s}</option>)}</select></div>
                    <div className="f"><label>État</label><select value={form.state||'Neuf'} onChange={e=>setForm(p=>({...p,state:e.target.value}))}><option>Neuf</option><option>Venant</option><option>Reconditionné</option></select></div>
                    <div className="f"><label>Couleur</label><input type="text" value={form.color||''} onChange={e=>setForm(p=>({...p,color:e.target.value}))} /></div>
                    <div className="f"><label>Prix achat *</label><input type="number" value={form.buyPrice||''} onChange={e=>setForm(p=>({...p,buyPrice:e.target.value}))} /></div>
                    <div className="f"><label>Prix vente *</label><input type="number" value={form.sellPrice||''} onChange={e=>setForm(p=>({...p,sellPrice:e.target.value}))} /></div>
                    <div className="f"><label>Quantité</label><input type="number" value={form.qty||0} onChange={e=>setForm(p=>({...p,qty:e.target.value}))} /></div>
                    <div className="f"><label>Fournisseur</label><select value={form.supplierId||''} onChange={e=>setForm(p=>({...p,supplierId:e.target.value}))}><option value="">Aucun</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                  </div>
                  <div className="f" style={{marginTop:12}}><label>Description</label><textarea value={form.desc||''} onChange={e=>setForm(p=>({...p,desc:e.target.value}))} /></div>
                </div>
              </div>
            </div>
            <div className="mfoot">
              <button className="btn btn-ghost" onClick={()=>setModal(null)}>Annuler</button>
              <button className="btn btn-blue" onClick={save} disabled={saving}><i className="fa fa-save" /> {saving?'Sauvegarde…':'Sauvegarder'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
// ── HISTORY PAGE ─────────────────────────────────────────
function HistoryPage({ transactions, user, onView }) {
  const [srch, setSrch] = useState('')
  const [typeF, setTypeF] = useState('')
  const [payF, setPayF] = useState('')
  const [yr, setYr] = useState('')
  const [mo, setMo] = useState('')
  const isAdmin = user?.role==='admin'
  const now = new Date()
  const yrs = [now.getFullYear(), now.getFullYear()-1, now.getFullYear()-2]

  const filtered = transactions.filter(t => {
    if (!isAdmin && t.employee && t.employee !== user?.name) return false
    if (srch && !t.client?.toLowerCase().includes(srch.toLowerCase()) && !t.items?.some(i=>i.name?.toLowerCase().includes(srch.toLowerCase()))) return false
    if (typeF && t.type !== typeF) return false
    if (payF && t.payment !== payF) return false
    if (yr && new Date(t.date).getFullYear() !== Number(yr)) return false
    if (mo && new Date(t.date).getMonth()+1 !== Number(mo)) return false
    return true
  })

  const totalCash = filtered.filter(t=>t.payment==='cash').reduce((a,t)=>a+t.amount,0)
  const totalOrange = filtered.filter(t=>t.payment==='orange').reduce((a,t)=>a+t.amount,0)
  const totalWave = filtered.filter(t=>t.payment==='wave').reduce((a,t)=>a+t.amount,0)
  const totalAll = filtered.reduce((a,t)=>a+t.amount,0)

  return (
    <div className="page active">
      <div className="sh">
        <div className="sh-t">Historique des Transactions</div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>expPDF('hist-tbl','Historique')}><i className="fa fa-file-pdf" /> PDF</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>expXLS('hist-tbl','Historique')}><i className="fa fa-file-excel" /> Excel</button>
        </div>
      </div>
      <div className="fb">
        <div className="sb2"><i className="fa fa-search" /><input type="text" placeholder="Client, produit…" value={srch} onChange={e=>setSrch(e.target.value)} /></div>
        <select className="fsel" value={typeF} onChange={e=>setTypeF(e.target.value)}><option value="">Tout type</option><option value="vente">Vente</option><option value="échange">Échange</option></select>
        <select className="fsel" value={payF} onChange={e=>setPayF(e.target.value)}><option value="">Paiement</option><option value="cash">Cash</option><option value="orange">Orange Money</option><option value="wave">Wave</option></select>
        <select className="fsel" value={yr} onChange={e=>setYr(e.target.value)}><option value="">Toutes années</option>{yrs.map(y=><option key={y} value={y}>{y}</option>)}</select>
        <select className="fsel" value={mo} onChange={e=>setMo(e.target.value)}><option value="">Tous mois</option>{MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select>
      </div>
      {/* Summary cards */}
      <div className="h-sum-grid">
        {[['fa-money-bill-wave','Total Cash',totalCash,'var(--green)'],['fa-mobile-screen-button','Total Orange',totalOrange,'var(--orange)'],['fa-wave-square','Total Wave',totalWave,'var(--cyan)'],['fa-sack-dollar','Total Global',totalAll,'var(--blue2)']].map(([ico,lbl,val,c])=>(
          <div key={lbl} className="h-sum-card">
            <div className="h-sum-lbl"><i className={`fa ${ico}`} style={{color:c,marginRight:5}} />{lbl}</div>
            <div className="h-sum-val" style={{color:c}}>{fmt(val)}</div>
          </div>
        ))}
      </div>
      <div className="tw">
        <table className="dt" id="hist-tbl">
          <thead><tr><th>Date</th><th>Client</th><th>Produit(s)</th><th>Type</th>{isAdmin&&<th>Employé</th>}<th>Paiement</th><th>Montant</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.length ? [...filtered].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(t=>(
              <tr key={t.id}>
                <td style={{fontSize:'.78rem'}}>{fmtDT(t.date)}</td>
                <td><div style={{fontWeight:600}}>{t.client}</div>{t.phone&&<div style={{fontSize:'.7rem',color:'var(--muted)'}}>{t.phone}</div>}</td>
                <td style={{fontSize:'.78rem',maxWidth:160}}>{t.items?.map(i=>i.name).join(', ')||'—'}</td>
                <td><span className={`bd ${t.type==='vente'?'bg':'bc'}`}>{t.type}</span></td>
                {isAdmin&&<td style={{fontSize:'.78rem',color:'var(--muted)'}}>{t.employee||'—'}</td>}
                <td><span className={`bd ${t.payment==='cash'?'bg':t.payment==='orange'?'bo':t.payment==='wave'?'bc':'bp'}`}>{fmtPaymentShort(t)}</span></td>
                <td style={{fontFamily:'Arial',fontWeight:700,color:'var(--cyan)'}}>{fmt(t.amount)}</td>
                <td><button className="btn btn-ghost btn-xs" onClick={()=>onView(t)}><i className="fa fa-receipt" /></button></td>
              </tr>
            )) : <tr><td colSpan={isAdmin?8:7}><div className="empty"><i className="fa fa-clock-rotate-left" /><p>Aucune transaction</p></div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── CATEGORIES PAGE ───────────────────────────────────────
function CategoriesPage({ categories, products, toast, onRefresh }) {
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const save = async () => {
    if (!form.name) { toast('Nom requis','err'); return }
    try {
      if (modal.id) { await API.updateCategory(modal.id,{name:form.name,description:form.desc||''}) }
      else { await API.createCategory({name:form.name,description:form.desc||''}) }
      setModal(null); await onRefresh(); toast('Sauvegardé','ok')
    } catch(e) { toast(e.message,'err') }
  }
  const del = async (id) => {
    if (!confirm('Supprimer cette catégorie ?')) return
    try { await API.deleteCategory(id); await onRefresh(); toast('Supprimé','inf') } catch(e) { toast(e.message,'err') }
  }
  return (
    <div className="page active">
      <div className="sh"><div className="sh-t">Catégories</div><button className="btn btn-blue btn-sm" onClick={()=>{setForm({});setModal({})}}><i className="fa fa-plus" /> Ajouter</button></div>
      <div className="tw"><table className="dt"><thead><tr><th>#</th><th>Nom</th><th>Description</th><th>Produits</th><th>Actions</th></tr></thead><tbody>
        {categories.length?categories.map((c,i)=>(
          <tr key={c.id}><td>{i+1}</td><td><strong>{c.name}</strong></td><td style={{color:'var(--muted)'}}>{c.description||'—'}</td>
          <td>{products.filter(p=>p.categoryId===c.id).length}</td>
          <td><div style={{display:'flex',gap:5,justifyContent:'flex-end'}}>
            <button className="btn btn-ghost btn-xs" onClick={()=>{setForm({name:c.name,desc:c.description});setModal({id:c.id})}}><i className="fa fa-pen" /></button>
            <button className="btn btn-red btn-xs" onClick={()=>del(c.id)}><i className="fa fa-trash" /></button>
          </div></td></tr>
        )):<tr><td colSpan={5}><div className="empty"><i className="fa fa-tags" /><p>Aucune catégorie</p></div></td></tr>}
      </tbody></table></div>
      {modal!==null&&<div className="mo open" onClick={e=>e.target===e.currentTarget&&setModal(null)}><div className="mb mb-sm"><div className="mh"><div className="mh-t">{modal.id?'Modifier':'Nouvelle Catégorie'}</div><button className="xb" onClick={()=>setModal(null)}><i className="fa fa-xmark" /></button></div><div className="mbody"><div className="fg2" style={{gridTemplateColumns:'1fr'}}><div className="f"><label>Nom *</label><input type="text" value={form.name||''} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div><div className="f"><label>Description</label><input type="text" value={form.desc||''} onChange={e=>setForm(p=>({...p,desc:e.target.value}))} /></div></div></div><div className="mfoot"><button className="btn btn-ghost" onClick={()=>setModal(null)}>Annuler</button><button className="btn btn-blue" onClick={save}><i className="fa fa-save" /> Sauvegarder</button></div></div></div>}
    </div>
  )
}

// ── BRANDS PAGE ───────────────────────────────────────────
function BrandsPage({ brands, products, toast, onRefresh }) {
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const save = async () => {
    if (!form.name) { toast('Nom requis','err'); return }
    try {
      if (modal.id) { await API.updateBrand(modal.id,{name:form.name,description:form.desc||''}) }
      else { await API.createBrand({name:form.name,description:form.desc||''}) }
      setModal(null); await onRefresh(); toast('Sauvegardé','ok')
    } catch(e) { toast(e.message,'err') }
  }
  const del = async (id) => {
    if (!confirm('Supprimer cette marque ?')) return
    try { await API.deleteBrand(id); await onRefresh(); toast('Supprimé','inf') } catch(e) { toast(e.message,'err') }
  }
  return (
    <div className="page active">
      <div className="sh"><div className="sh-t">Marques</div><button className="btn btn-blue btn-sm" onClick={()=>{setForm({});setModal({})}}><i className="fa fa-plus" /> Ajouter</button></div>
      <div className="tw"><table className="dt"><thead><tr><th>#</th><th>Nom</th><th>Description</th><th>Produits</th><th>Actions</th></tr></thead><tbody>
        {brands.length?brands.map((b,i)=>(
          <tr key={b.id}><td>{i+1}</td><td><strong>{b.name}</strong></td><td style={{color:'var(--muted)'}}>{b.description||'—'}</td>
          <td>{products.filter(p=>p.brandId===b.id).length}</td>
          <td><div style={{display:'flex',gap:5,justifyContent:'flex-end'}}>
            <button className="btn btn-ghost btn-xs" onClick={()=>{setForm({name:b.name,desc:b.description});setModal({id:b.id})}}><i className="fa fa-pen" /></button>
            <button className="btn btn-red btn-xs" onClick={()=>del(b.id)}><i className="fa fa-trash" /></button>
          </div></td></tr>
        )):<tr><td colSpan={5}><div className="empty"><i className="fa fa-award" /><p>Aucune marque</p></div></td></tr>}
      </tbody></table></div>
      {modal!==null&&<div className="mo open" onClick={e=>e.target===e.currentTarget&&setModal(null)}><div className="mb mb-sm"><div className="mh"><div className="mh-t">{modal.id?'Modifier':'Nouvelle Marque'}</div><button className="xb" onClick={()=>setModal(null)}><i className="fa fa-xmark" /></button></div><div className="mbody"><div className="fg2" style={{gridTemplateColumns:'1fr'}}><div className="f"><label>Nom *</label><input type="text" value={form.name||''} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div><div className="f"><label>Description</label><input type="text" value={form.desc||''} onChange={e=>setForm(p=>({...p,desc:e.target.value}))} /></div></div></div><div className="mfoot"><button className="btn btn-ghost" onClick={()=>setModal(null)}>Annuler</button><button className="btn btn-blue" onClick={save}><i className="fa fa-save" /> Sauvegarder</button></div></div></div>}
    </div>
  )
}
// ── SUPPLIERS PAGE ────────────────────────────────────────
function SuppliersPage({ suppliers, products, toast, onRefresh }) {
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const save = async () => {
    if (!form.name) { toast('Nom requis','err'); return }
    try {
      if (modal.id) { await API.updateSupplier(modal.id,form) } else { await API.createSupplier(form) }
      setModal(null); await onRefresh(); toast('Sauvegardé','ok')
    } catch(e) { toast(e.message,'err') }
  }
  const del = async (id) => {
    if (!confirm('Supprimer ce fournisseur ?')) return
    try { await API.deleteSupplier(id); await onRefresh(); toast('Supprimé','inf') } catch(e) { toast(e.message,'err') }
  }
  return (
    <div className="page active">
      <div className="sh"><div className="sh-t">Fournisseurs</div>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>expPDF('sup-tbl','Fournisseurs')}><i className="fa fa-file-pdf" /></button>
          <button className="btn btn-ghost btn-sm" onClick={()=>expXLS('sup-tbl','Fournisseurs')}><i className="fa fa-file-excel" /></button>
          <button className="btn btn-blue btn-sm" onClick={()=>{setForm({});setModal({})}}><i className="fa fa-plus" /> Ajouter</button>
        </div>
      </div>
      <div className="tw"><table className="dt" id="sup-tbl"><thead><tr><th>Nom</th><th>Téléphone</th><th>Email</th><th>Adresse</th><th>Produits</th><th>Valeur stock</th><th>Actions</th></tr></thead><tbody>
        {suppliers.length?suppliers.map(s=>{
          const sProds=products.filter(p=>p.supplierId===s.id)
          const totalQty=sProds.reduce((a,p)=>a+p.qty,0)
          const totalVal=sProds.reduce((a,p)=>a+p.buyPrice*p.qty,0)
          return <tr key={s.id}><td><strong>{s.name}</strong></td><td>{s.phone||'—'}</td><td>{s.email||'—'}</td><td>{s.address||'—'}</td>
            <td><span style={{fontFamily:'Arial',fontWeight:700,color:'var(--blue2)'}}>{sProds.length} produit(s) · {totalQty} unités</span></td>
            <td style={{fontFamily:'Arial',fontWeight:700,color:'var(--orange)'}}>{fmt(totalVal)}</td>
            <td><div style={{display:'flex',gap:5,justifyContent:'flex-end'}}>
              <button className="btn btn-ghost btn-xs" onClick={()=>{setForm({name:s.name,phone:s.phone||'',email:s.email||'',address:s.address||''});setModal({id:s.id})}}><i className="fa fa-pen" /></button>
              <button className="btn btn-red btn-xs" onClick={()=>del(s.id)}><i className="fa fa-trash" /></button>
            </div></td></tr>
        }):<tr><td colSpan={7}><div className="empty"><i className="fa fa-truck" /><p>Aucun fournisseur</p></div></td></tr>}
      </tbody></table></div>
      {modal!==null&&<div className="mo open" onClick={e=>e.target===e.currentTarget&&setModal(null)}><div className="mb mb-md"><div className="mh"><div className="mh-t">{modal.id?'Modifier':'Nouveau Fournisseur'}</div><button className="xb" onClick={()=>setModal(null)}><i className="fa fa-xmark" /></button></div><div className="mbody"><div className="fg2" style={{gridTemplateColumns:'1fr 1fr'}}><div className="f"><label>Nom *</label><input type="text" value={form.name||''} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div><div className="f"><label>Téléphone</label><input type="text" value={form.phone||''} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} /></div><div className="f"><label>Email</label><input type="email" value={form.email||''} onChange={e=>setForm(p=>({...p,email:e.target.value}))} /></div><div className="f"><label>Adresse</label><input type="text" value={form.address||''} onChange={e=>setForm(p=>({...p,address:e.target.value}))} /></div></div></div><div className="mfoot"><button className="btn btn-ghost" onClick={()=>setModal(null)}>Annuler</button><button className="btn btn-blue" onClick={save}><i className="fa fa-save" /> Sauvegarder</button></div></div></div>}
    </div>
  )
}

// ── EMPLOYEES PAGE ────────────────────────────────────────
function EmployeesPage({ employees, transactions, toast, onRefresh }) {
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const now = new Date()
  const save = async () => {
    if (!form.name||!form.email||!form.password) { toast('Tous les champs requis','err'); return }
    try {
      await API.createEmployee({name:form.name,email:form.email,password:form.password,role:form.role||'employee'})
      setModal(null); await onRefresh(); toast('Employé ajouté !','ok')
    } catch(e) { toast(e.message,'err') }
  }
  const tog = async (id, active) => {
    try { await API.updateEmployee(id,{active:!active}); await onRefresh(); toast(`Compte ${!active?'activé':'désactivé'}`,'inf') } catch(e) { toast(e.message,'err') }
  }
  const del = async (id) => {
    if (!confirm('Supprimer cet employé ?')) return
    try { await API.deleteEmployee(id); await onRefresh(); toast('Supprimé','inf') } catch(e) { toast(e.message,'err') }
  }
  return (
    <div className="page active">
      <div className="sh"><div className="sh-t">Gestion des Employés</div><button className="btn btn-blue btn-sm" onClick={()=>{setForm({role:'employee'});setModal({})}}><i className="fa fa-plus" /> Ajouter</button></div>
      <div className="tw"><table className="dt"><thead><tr><th>Employé</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Ventes ce mois</th><th>Montant généré</th><th>Actions</th></tr></thead><tbody>
        {employees.length?employees.map(e=>{
          const mTx=transactions.filter(t=>t.employee===e.name&&new Date(t.date).getMonth()===now.getMonth())
          return <tr key={e.id}>
            <td><div style={{display:'flex',alignItems:'center',gap:9}}><div className="uav">{(e.name||'').slice(0,2).toUpperCase()}</div><div style={{fontWeight:600}}>{e.name}</div></div></td>
            <td style={{fontSize:'.82rem'}}>{e.email}</td>
            <td><span className={`bd ${e.role==='admin'?'bp':'bb'}`}>{e.role==='admin'?'Admin':'Employé'}</span></td>
            <td><span className={`bd ${e.active?'bg':'br'}`}>{e.active?'Actif':'Inactif'}</span></td>
            <td>{mTx.length}</td>
            <td style={{fontFamily:'Arial',fontWeight:700,color:'var(--cyan)'}}>{fmt(mTx.reduce((a,t)=>a+t.amount,0))}</td>
            <td><div style={{display:'flex',gap:5,justifyContent:'flex-end'}}>
              <button className="btn btn-ghost btn-xs" onClick={()=>tog(e.id,e.active)}><i className={`fa fa-${e.active?'lock':'unlock'}`} /></button>
              <button className="btn btn-red btn-xs" onClick={()=>del(e.id)}><i className="fa fa-trash" /></button>
            </div></td>
          </tr>
        }):<tr><td colSpan={7}><div className="empty"><i className="fa fa-users" /><p>Aucun employé</p></div></td></tr>}
      </tbody></table></div>
      {modal!==null&&<div className="mo open" onClick={e=>e.target===e.currentTarget&&setModal(null)}><div className="mb mb-md"><div className="mh"><div className="mh-t">Ajouter un employé</div><button className="xb" onClick={()=>setModal(null)}><i className="fa fa-xmark" /></button></div><div className="mbody"><div className="fg2"><div className="f"><label>Nom complet *</label><input type="text" value={form.name||''} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div><div className="f"><label>Email *</label><input type="email" value={form.email||''} onChange={e=>setForm(p=>({...p,email:e.target.value}))} /></div><div className="f"><label>Mot de passe *</label><input type="password" value={form.password||''} onChange={e=>setForm(p=>({...p,password:e.target.value}))} /></div><div className="f"><label>Rôle</label><select value={form.role||'employee'} onChange={e=>setForm(p=>({...p,role:e.target.value}))}><option value="employee">Employé</option><option value="admin">Admin</option></select></div></div></div><div className="mfoot"><button className="btn btn-ghost" onClick={()=>setModal(null)}>Annuler</button><button className="btn btn-blue" onClick={save}><i className="fa fa-save" /> Sauvegarder</button></div></div></div>}
    </div>
  )
}

// ── PURCHASES PAGE ────────────────────────────────────────
function PurchasesPage({ purchases, products, suppliers, toast, onRefresh }) {
  const del = async (id) => {
    if (!confirm('Supprimer cet achat ?')) return
    try { await API.deletePurchase(id); await onRefresh(); toast('Supprimé','inf') } catch(e) { toast(e.message,'err') }
  }
  const totalQty = purchases.reduce((a,p)=>a+Number(p.qty||0),0)
  const totalCost = purchases.reduce((a,p)=>a+Number(p.qty||0)*Number(p.unitPrice||p.price||0),0)
  const totalVal = products.reduce((a,p)=>a+p.qty*p.sellPrice,0)
  return (
    <div className="page active">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:18}}>
        <div className="gc gc-p" style={{padding:16}}>
          <div style={{fontSize:'.68rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.07em'}}>Produits en stock</div>
          <div style={{fontFamily:'Arial',fontWeight:700,fontSize:'1.6rem',color:'var(--cyan)',marginTop:4}}>{products.length}</div>
          <div style={{fontSize:'.72rem',color:'var(--muted)',marginTop:2}}>{totalQty} unités totales</div>
        </div>
        <div className="gc gc-p" style={{padding:16}}>
          <div style={{fontSize:'.68rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.07em'}}>Coût total stock</div>
          <div style={{fontFamily:'Arial',fontWeight:700,fontSize:'1.6rem',color:'var(--orange)',marginTop:4}}>{fmt(totalCost)}</div>
        </div>
        <div className="gc gc-p" style={{padding:16}}>
          <div style={{fontSize:'.68rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.07em'}}>Valeur de revente</div>
          <div style={{fontFamily:'Arial',fontWeight:700,fontSize:'1.6rem',color:'var(--green)',marginTop:4}}>{fmt(totalVal)}</div>
        </div>
      </div>
      <div className="sh">
        <div>
          <div className="sh-t">Catalogue Stock</div>
          <div className="sh-sub">Gérez le stock via la page Produits — les achats sont automatiquement enregistrés</div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>expXLS('pur-tbl','Achats')}><i className="fa fa-file-excel" /> Excel</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>expPDF('pur-tbl','Achats')}><i className="fa fa-file-pdf" /> PDF</button>
        </div>
      </div>
      <div className="tw"><table className="dt" id="pur-tbl">
        <thead><tr><th>Photo</th><th>Produit</th><th>Marque</th><th>Catégorie</th><th>Stockage</th><th>État</th><th>Qté</th><th>Prix achat</th><th>Total stock</th><th>Fournisseur</th><th>Statut</th></tr></thead>
        <tbody>
          {products.length ? [...products].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(p => {
            const [bc,bl] = stockBadge(p.qty)
            return (
              <tr key={p.id}>
                <td>{p.photo?<img src={p.photo} style={{width:36,height:36,borderRadius:6,objectFit:'cover'}} alt="" />:<div style={{width:36,height:36,borderRadius:6,background:'rgba(37,99,235,.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem'}}>{prodEmoji(p.category?.name)}</div>}</td>
                <td><div style={{fontWeight:600}}>{p.name}</div>{p.imei&&<div style={{fontSize:'.68rem',color:'var(--muted)'}}>IMEI: {p.imei}</div>}</td>
                <td>{p.brand?.name||'—'}</td>
                <td>{p.category?.name||'—'}</td>
                <td>{p.storage||'—'}</td>
                <td><span className={`bd ${p.state==='Neuf'?'bg':'bo'}`}>{p.state||'—'}</span></td>
                <td style={{fontFamily:'Arial',fontWeight:700}}>{p.qty}</td>
                <td style={{fontFamily:'Arial'}}>{fmt(p.buyPrice)}</td>
                <td style={{fontFamily:'Arial',fontWeight:700,color:'var(--orange)'}}>{fmt(p.buyPrice*p.qty)}</td>
                <td>{p.supplier?.name||'—'}</td>
                <td><span className={bc}>{bl}</span></td>
              </tr>
            )
          }) : <tr><td colSpan={11}><div className="empty"><i className="fa fa-cart-flatbed" /><p>Aucun produit en stock</p></div></td></tr>}
        </tbody>
      </table></div>
    </div>
  )
}

// ── SAVINGS PAGE ─────────────────────────────────────────
function SavingsPage({ savings, toast, onRefresh }) {
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [yr, setYr] = useState('')
  const [mo, setMo] = useState('')
  const now = new Date()
  const yrs = [now.getFullYear(), now.getFullYear()-1, now.getFullYear()-2]
  const filtered = savings.filter(s => {
    if (yr && new Date(s.date).getFullYear() !== Number(yr)) return false
    if (mo && new Date(s.date).getMonth()+1 !== Number(mo)) return false
    return true
  })
  const total = filtered.reduce((a,s)=>a+s.amount,0)
  const save = async () => {
    if (!form.amount||!form.date) { toast('Montant et date requis','err'); return }
    try {
      if (modal.id) { await API.updateSaving(modal.id,{amount:Number(form.amount),date:form.date,note:form.note||''}) }
      else { await API.createSaving({amount:Number(form.amount),date:form.date,note:form.note||''}) }
      setModal(null); await onRefresh(); toast('Sauvegardé','ok')
    } catch(e) { toast(e.message,'err') }
  }
  const del = async (id) => {
    if (!confirm('Supprimer cette entrée ?')) return
    try { await API.deleteSaving(id); await onRefresh(); toast('Supprimé','inf') } catch(e) { toast(e.message,'err') }
  }
  return (
    <div className="page active">
      <div className="sav-banner">
        <div><div style={{fontSize:'.72rem',color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6}}>Total Épargne</div><div className="sav-total">{fmt(total)}</div></div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <select className="fsel" value={yr} onChange={e=>setYr(e.target.value)}><option value="">Toutes années</option>{yrs.map(y=><option key={y} value={y}>{y}</option>)}</select>
          <select className="fsel" value={mo} onChange={e=>setMo(e.target.value)}><option value="">Tous mois</option>{MONTHS.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}</select>
          <button className="btn btn-ghost btn-sm" onClick={()=>expPDF('sav-tbl','Epargne')}><i className="fa fa-file-pdf" /></button>
          <button className="btn btn-ghost btn-sm" onClick={()=>expXLS('sav-tbl','Epargne')}><i className="fa fa-file-excel" /></button>
          <button className="btn btn-blue btn-sm" onClick={()=>{setForm({date:new Date().toISOString().split('T')[0]});setModal({})}}><i className="fa fa-plus" /> Ajouter</button>
        </div>
      </div>
      <div className="tw"><table className="dt" id="sav-tbl"><thead><tr><th>ID</th><th>Montant</th><th>Date</th><th>Note</th><th>Actions</th></tr></thead><tbody>
        {filtered.length?[...filtered].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(s=>(
          <tr key={s.id}><td style={{fontSize:'.72rem',color:'var(--muted)'}}>{s.id}</td>
          <td style={{fontFamily:'Arial',fontWeight:700,color:'var(--green)'}}>{fmt(s.amount)}</td>
          <td>{fmtD(s.date)}</td>
          <td style={{color:'var(--muted)',fontSize:'.82rem'}}>{s.note||'—'}</td>
          <td><div style={{display:'flex',gap:5,justifyContent:'flex-end'}}>
            <button className="btn btn-ghost btn-xs" onClick={()=>{setForm({amount:s.amount,date:s.date,note:s.note||''});setModal({id:s.id})}}><i className="fa fa-pen" /></button>
            <button className="btn btn-red btn-xs" onClick={()=>del(s.id)}><i className="fa fa-trash" /></button>
          </div></td></tr>
        )):<tr><td colSpan={5}><div className="empty"><i className="fa fa-piggy-bank" /><p>Aucune épargne</p></div></td></tr>}
      </tbody></table></div>
      {modal!==null&&<div className="mo open" onClick={e=>e.target===e.currentTarget&&setModal(null)}><div className="mb mb-sm"><div className="mh"><div className="mh-t">{modal.id?'Modifier':'Ajouter Épargne'}</div><button className="xb" onClick={()=>setModal(null)}><i className="fa fa-xmark" /></button></div><div className="mbody"><div className="fg2" style={{gridTemplateColumns:'1fr'}}><div className="f"><label>Montant *</label><input type="number" value={form.amount||''} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} /></div><div className="f"><label>Date *</label><input type="date" value={form.date||''} onChange={e=>setForm(p=>({...p,date:e.target.value}))} /></div><div className="f"><label>Note</label><input type="text" value={form.note||''} onChange={e=>setForm(p=>({...p,note:e.target.value}))} /></div></div></div><div className="mfoot"><button className="btn btn-ghost" onClick={()=>setModal(null)}>Annuler</button><button className="btn btn-blue" onClick={save}><i className="fa fa-save" /> Sauvegarder</button></div></div></div>}
    </div>
  )
}

// ── SETTINGS PAGE ─────────────────────────────────────────
function SettingsPage({ user, toast, onDanger }) {
  const [form, setForm] = useState({shop:'FarTech Store',addr:'Dakar, Sénégal',phone:'+221 77 000 00 00',email:'contact@fartech.com'})
  const isAdmin = user?.role==='admin'
  useEffect(() => {
    API.getSettings().then(d => {
      if (d.settings) {
        const s = d.settings
        setForm({shop:s.shopName||'FarTech Store',addr:s.address||'Dakar, Sénégal',phone:s.phone||'+221 77 000 00 00',email:s.email||'contact@fartech.com'})
      }
    }).catch(()=>{})
  }, [])
  const save = async () => {
    try {
      await API.saveSettings({shopName:form.shop,address:form.addr,phone:form.phone,email:form.email})
      toast('Paramètres sauvegardés !','ok')
    } catch(e) { toast(e.message,'err') }
  }
  const dangerDel = async (type) => {
    if (!isAdmin) { toast('Accès refusé','err'); return }
    const labels={transactions:"l'historique des transactions",products:"tous les produits",employees:"tous les employés",all:"TOUTES les données"}
    if (!confirm(`⚠️ Vous allez supprimer ${labels[type]}.\nCette action est IRRÉVERSIBLE.\n\nÊtes-vous sûr ?`)) return
    const code = prompt('Pour confirmer, tapez : SUPPRIMER')
    if (code !== 'SUPPRIMER') { toast('Annulé','inf'); return }
    try {
      const map={transactions:'/api/transactions/all',products:'/api/products/all',employees:'/api/employees/all',all:'/api/all'}
      await _req(map[type]||map.all, {method:'DELETE'})
      await onDanger()
      toast('Effectué','ok')
    } catch(e) { toast(e.message,'err') }
  }
  return (
    <div className="page active">
      <div className="gc gc-p" style={{maxWidth:560}}>
        <div className="sh-t" style={{marginBottom:20}}><i className="fa fa-gear" style={{color:'var(--cyan)'}} /> Paramètres de la boutique</div>
        <div className="fg2" style={{gridTemplateColumns:'1fr'}}>
          <div className="f"><label>Nom de la boutique</label><input type="text" value={form.shop} onChange={e=>setForm(p=>({...p,shop:e.target.value}))} /></div>
          <div className="f"><label>Adresse</label><input type="text" value={form.addr} onChange={e=>setForm(p=>({...p,addr:e.target.value}))} /></div>
          <div className="f"><label>Téléphone</label><input type="text" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} /></div>
          <div className="f"><label>Email</label><input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} /></div>
        </div>
        <div style={{marginTop:20}}><button className="btn btn-blue" onClick={save}><i className="fa fa-save" /> Sauvegarder</button></div>
      </div>
      {isAdmin && (
        <div style={{maxWidth:560,marginTop:24,border:'2px solid rgba(239,68,68,.35)',borderRadius:'var(--r)',overflow:'hidden'}}>
          <div style={{background:'rgba(239,68,68,.08)',padding:'14px 20px',borderBottom:'1px solid rgba(239,68,68,.2)',display:'flex',alignItems:'center',gap:10}}>
            <i className="fa fa-triangle-exclamation" style={{color:'#EF4444',fontSize:'1.1rem'}} />
            <div><div style={{fontWeight:700,color:'#EF4444',fontSize:'.95rem'}}>Zone Dangereuse</div><div style={{fontSize:'.72rem',color:'var(--muted)'}}>Ces actions sont irréversibles. Réservées à l'administrateur.</div></div>
          </div>
          <div style={{padding:'18px 20px',display:'flex',flexDirection:'column',gap:14}}>
            {[['transactions','Supprimer l\'historique des ventes','Efface toutes les transactions'],['products','Supprimer tous les produits','Vide le catalogue complet'],['employees','Supprimer tous les employés','Supprime tous les comptes employés']].map(([k,t,d])=>(
              <div key={k} style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,padding:14,background:'var(--card)',borderRadius:10,border:'1px solid rgba(239,68,68,.15)'}}>
                <div><div style={{fontWeight:600,fontSize:'.88rem'}}>{t}</div><div style={{fontSize:'.72rem',color:'var(--muted)',marginTop:2}}>{d}</div></div>
                <button className="btn btn-red btn-sm" onClick={()=>dangerDel(k)}><i className="fa fa-trash" /> Supprimer</button>
              </div>
            ))}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,padding:14,background:'rgba(239,68,68,.06)',borderRadius:10,border:'2px solid rgba(239,68,68,.4)'}}>
              <div><div style={{fontWeight:700,fontSize:'.9rem',color:'#EF4444'}}>Réinitialisation complète</div><div style={{fontSize:'.72rem',color:'var(--muted)',marginTop:2}}>Efface TOUTES les données</div></div>
              <button className="btn btn-red btn-sm" style={{background:'#dc2626'}} onClick={()=>dangerDel('all')}><i className="fa fa-bomb" /> Tout effacer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── RECEIPT MODAL ─────────────────────────────────────────
function ReceiptModal({ tx, onClose }) {
  const isExchange = tx.type === 'échange'
  const shopName = 'FARTECH'

  const dlPDF = () => {
    if (!window.jspdf) { alert('jsPDF non disponible'); return }
    const {jsPDF} = window.jspdf
    const W = 80, doc = new jsPDF({unit:'mm',format:[W,220]})
    let y = 0

    // ── HEADER GRADIENT BAND ──
    doc.setFillColor(30,58,138); doc.rect(0,0,W,22,'F')
    doc.setFillColor(6,182,212); doc.rect(0,18,W,4,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(16)
    doc.setTextColor(255,255,255)
    doc.text(shopName, W/2, 11, {align:'center'})
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5)
    doc.setTextColor(180,210,255)
    doc.text('Informatique · Réparation · Accessoires', W/2, 16, {align:'center'})
    y = 28

    // ── BOUTIQUE INFO ──
    doc.setFontSize(6.5); doc.setTextColor(80,80,80)
    doc.text('Liberté 2, en face de la pharmacie — Dakar', W/2, y, {align:'center'}); y+=4
    doc.text('Tél: +221 33 355 46 / 77 495 05 22', W/2, y, {align:'center'}); y+=6

    // ── TYPE BADGE ──
    const badgeColor = isExchange ? [6,182,212] : [16,185,129]
    doc.setFillColor(...badgeColor)
    doc.roundedRect(W/2-18, y-3, 36, 6, 1, 1, 'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(255,255,255)
    doc.text(isExchange ? '⇄  ÉCHANGE' : '✓  VENTE', W/2, y+1, {align:'center'})
    y += 10

    // ── REF + DATE ──
    doc.setFillColor(241,245,249); doc.rect(4,y-3,W-8,10,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(30,58,138)
    doc.text(`N° ${String(tx.id).slice(-8).toUpperCase()}`, W/2, y+1.5, {align:'center'})
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(100,116,139)
    doc.text(fmtDT(tx.date), W/2, y+5.5, {align:'center'})
    y += 14

    // ── CLIENT ──
    doc.setDrawColor(226,232,240); doc.setLineWidth(0.3)
    doc.line(4, y, W-4, y); y+=4
    doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(100,116,139)
    doc.text('CLIENT', 4, y); y+=3.5
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(15,23,42)
    doc.text(tx.client, 4, y); y+=4
    if (tx.phone) { doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(100,116,139); doc.text(tx.phone, 4, y); y+=3 }
    y += 2

    if (isExchange) {
      // ── EXCHANGE PHONES ──
      doc.line(4, y, W-4, y); y+=4
      doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(100,116,139)
      doc.text("DÉTAILS DE L'ÉCHANGE", 4, y); y+=4

      // Old phone box
      doc.setFillColor(255,245,245); doc.setDrawColor(254,202,202); doc.setLineWidth(0.3)
      doc.roundedRect(4, y, (W-12)/2, 18, 1, 1, 'FD')
      doc.setFont('helvetica','bold'); doc.setFontSize(5.5); doc.setTextColor(220,38,38)
      doc.text('ANCIEN TÉL.', 6, y+4)
      doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(15,23,42)
      const oldName = tx.oldPhone || '—'
      doc.text(oldName.substring(0,14), 6, y+8)
      doc.setFont('helvetica','normal'); doc.setFontSize(6); doc.setTextColor(100,116,139)
      if (tx.oldPhoneStorage) doc.text(tx.oldPhoneStorage, 6, y+12)
      if (tx.oldPhoneImei) doc.text('IMEI: '+String(tx.oldPhoneImei).substring(0,15), 6, y+15.5)

      // New phone box
      const nx = 4 + (W-12)/2 + 4
      doc.setFillColor(240,253,244); doc.setDrawColor(134,239,172); doc.setLineWidth(0.3)
      doc.roundedRect(nx, y, (W-12)/2, 18, 1, 1, 'FD')
      doc.setFont('helvetica','bold'); doc.setFontSize(5.5); doc.setTextColor(22,163,74)
      doc.text('NOUVEAU TÉL.', nx+2, y+4)
      doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(15,23,42)
      const newName = tx.newPhoneName || tx.items?.[0]?.name || '—'
      doc.text(newName.substring(0,14), nx+2, y+8)
      doc.setFont('helvetica','normal'); doc.setFontSize(6); doc.setTextColor(100,116,139)
      if (tx.newPhoneStorage) doc.text(tx.newPhoneStorage, nx+2, y+12)
      const newImei = tx.newPhoneImei || tx.items?.[0]?.imei
      if (newImei) doc.text('IMEI: '+String(newImei).substring(0,15), nx+2, y+15.5)
      y += 22

    } else {
      // ── ITEMS TABLE ──
      doc.line(4, y, W-4, y); y+=4
      doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(100,116,139)
      doc.text('ARTICLE', 4, y); doc.text('QTÉ', 48, y); doc.text('PRIX', W-4, y, {align:'right'}); y+=3
      doc.setDrawColor(226,232,240); doc.line(4, y, W-4, y); y+=3
      tx.items?.forEach((item,ri) => {
        if (ri%2===0) { doc.setFillColor(248,250,252); doc.rect(4,y-2,W-8,6,'F') }
        doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(15,23,42)
        doc.text(item.name.substring(0,20), 4, y+2)
        doc.text(String(item.qty), 48, y+2)
        doc.setFont('helvetica','bold')
        doc.text(fmtPDF(item.price*item.qty), W-4, y+2, {align:'right'})
        y+=6
        if (item.imei) { doc.setFont('helvetica','normal'); doc.setFontSize(5.5); doc.setTextColor(148,163,184); doc.text('IMEI: '+item.imei, 4, y); y+=4 }
      })
    }
    y+=2

    // ── TOTAL SECTION ──
    doc.setFillColor(30,58,138); doc.rect(4,y,W-8,10,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(255,255,255)
    doc.text(isExchange ? 'DIFFÉRENCE' : 'TOTAL', 7, y+6.5)
    doc.text(fmtPDF(tx.amount), W-6, y+6.5, {align:'right'})
    y+=14

    // Discount
    if (tx.discount > 0) {
      doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(100,116,139)
      doc.text(`Sous-total: ${fmtPDF(tx.subtotal)}  |  Remise: ${tx.discount}%`, W/2, y, {align:'center'}); y+=5
    }

    // ── PAYMENT ──
    doc.setFillColor(241,245,249); doc.rect(4,y,W-8,8,'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(6); doc.setTextColor(100,116,139)
    doc.text('MODE DE PAIEMENT', W/2, y+3, {align:'center'})
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(30,58,138)
    doc.text(fmtPayment(tx), W/2, y+7, {align:'center'})
    y+=12

    // ── FOOTER ──
    doc.setDrawColor(226,232,240); doc.line(4,y,W-4,y); y+=4
    doc.setFillColor(6,182,212); doc.rect(0,y+2,W,0.8,'F')
    doc.setFont('helvetica','italic'); doc.setFontSize(6); doc.setTextColor(100,116,139)
    doc.text('Garantie 2 mois sur les appareils vendus', W/2, y, {align:'center'}); y+=5
    doc.setFont('helvetica','bold'); doc.setFontSize(7); doc.setTextColor(30,58,138)
    doc.text('Merci pour votre confiance !', W/2, y+2, {align:'center'})

    doc.save(`fartech_recu_${String(tx.id).slice(-6)}.pdf`)
  }

  const fmtPDF = n => Math.round(Number(n||0)).toLocaleString('fr-FR') + ' F'

  return (
    <div className="mo open" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="mb mb-sm">
        <div className="mh">
          <div className="mh-t">Reçu {isExchange?'d\'échange':'de vente'}</div>
          <button className="xb" onClick={onClose}><i className="fa fa-xmark" /></button>
        </div>
        <div className="mbody" style={{padding:0}}>
          <div className="receipt-wrap">
            <div style={{padding:'18px 20px 14px',textAlign:'center',background:'linear-gradient(135deg,#1e3a8a,#0ea5e9)'}}>
              <div style={{fontSize:'1.5rem',fontWeight:900,letterSpacing:3,color:'#fff'}}>{shopName}</div>
              <div style={{fontSize:'.63rem',color:'rgba(255,255,255,.85)',marginTop:3,lineHeight:1.5}}>Informatique - Réparation - Accessoires<br />Liberté 2 en Face de pharmacie</div>
              <div style={{fontSize:'.62rem',color:'rgba(255,255,255,.75)',marginTop:4}}>Tél: +221 33 355 46 / 77 495 05 22</div>
            </div>
            <div style={{padding:'14px 18px',borderBottom:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:6}}>
              <div>
                <div style={{fontWeight:700,fontSize:'.82rem',color:'#1e293b'}}>{isExchange?'ÉCHANGE':'VENTE'} — N°{String(tx.id).slice(-6).toUpperCase()}</div>
                <div style={{fontSize:'.72rem',color:'#64748b',marginTop:2}}>{fmtDT(tx.date)}</div>
              </div>
              <span style={{background:isExchange?'rgba(6,182,212,.12)':'rgba(16,185,129,.12)',color:isExchange?'#0891b2':'#059669',padding:'3px 10px',borderRadius:20,fontSize:'.72rem',fontWeight:700}}>{isExchange?'Échange':'Vente'}</span>
            </div>
            <div style={{padding:'12px 18px',background:'#f8fafc',borderBottom:'1px solid #e2e8f0'}}>
              <div style={{fontSize:'.68rem',color:'#64748b',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:4}}>Client</div>
              <div style={{fontWeight:700,fontSize:'.88rem',color:'#1e293b'}}>{tx.client}</div>
              {tx.phone&&<div style={{fontSize:'.72rem',color:'#64748b'}}>{tx.phone}</div>}
            </div>
            {isExchange && (
              <div style={{padding:'12px 18px',borderBottom:'1px solid #e2e8f0'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <div style={{background:'#fff5f5',borderRadius:8,padding:'10px 12px',border:'1px solid #fecaca'}}>
                    <div style={{fontSize:'.6rem',color:'#dc2626',textTransform:'uppercase',fontWeight:700,letterSpacing:'.06em',marginBottom:6}}>📱 Ancien téléphone</div>
                    <div style={{fontWeight:700,fontSize:'.88rem',color:'#1e293b',marginBottom:3}}>{tx.oldPhone||'—'}</div>
                    {tx.oldPhoneStorage&&<div style={{fontSize:'.73rem',color:'#64748b',marginBottom:2}}>💾 {tx.oldPhoneStorage}</div>}
                    {tx.oldPhoneImei&&<div style={{fontSize:'.73rem',color:'#64748b'}}>🔢 IMEI: {tx.oldPhoneImei}</div>}
                  </div>
                  <div style={{background:'#f0fdf4',borderRadius:8,padding:'10px 12px',border:'1px solid #86efac'}}>
                    <div style={{fontSize:'.6rem',color:'#16a34a',textTransform:'uppercase',fontWeight:700,letterSpacing:'.06em',marginBottom:6}}>📱 Nouveau téléphone</div>
                    <div style={{fontWeight:700,fontSize:'.88rem',color:'#1e293b',marginBottom:3}}>{tx.newPhoneName||tx.items?.[0]?.name||'—'}</div>
                    {tx.newPhoneStorage&&<div style={{fontSize:'.73rem',color:'#64748b',marginBottom:2}}>💾 {tx.newPhoneStorage}</div>}
                    {(tx.newPhoneImei||tx.items?.[0]?.imei)&&<div style={{fontSize:'.73rem',color:'#64748b'}}>🔢 IMEI: {tx.newPhoneImei||tx.items?.[0]?.imei}</div>}
                  </div>
                </div>
              </div>
            )}
            {!isExchange && tx.items?.length>0 && (
              <div style={{padding:'12px 18px',borderBottom:'1px solid #e2e8f0'}}>
                <table style={{width:'100%',fontSize:'.78rem',borderCollapse:'collapse'}}>
                  <thead><tr style={{borderBottom:'1px solid #e2e8f0'}}><th style={{textAlign:'left',padding:'4px 0',color:'#64748b',fontWeight:600}}>Article</th><th style={{textAlign:'center',color:'#64748b',fontWeight:600}}>Qté</th><th style={{textAlign:'right',color:'#64748b',fontWeight:600}}>Prix</th></tr></thead>
                  <tbody>{tx.items.map((item,i)=>(
                    <tr key={i} style={{borderBottom:'1px solid #f1f5f9'}}><td style={{padding:'5px 0'}}><div style={{fontWeight:600,color:'#1e293b'}}>{item.name}</div>{item.imei&&<div style={{fontSize:'.65rem',color:'#94a3b8'}}>IMEI: {item.imei}</div>}</td><td style={{textAlign:'center',color:'#475569'}}>{item.qty}</td><td style={{textAlign:'right',fontFamily:'Arial',fontWeight:600,color:'#1e293b'}}>{fmt(item.price*item.qty)}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            <div style={{padding:'12px 18px 16px'}}>
              {tx.discount>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:'.8rem',color:'#64748b',marginBottom:4}}><span>Sous-total</span><span style={{fontFamily:'Arial'}}>{fmt(tx.subtotal)}</span></div>}
              {tx.discount>0&&<div style={{display:'flex',justifyContent:'space-between',fontSize:'.8rem',color:'#dc2626',marginBottom:4}}><span>Remise ({tx.discount}%)</span><span style={{fontFamily:'Arial'}}>-{fmt(tx.subtotal*tx.discount/100)}</span></div>}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:8,borderTop:'2px solid #1e3a8a',marginTop:4}}>
                <span style={{fontFamily:'Syne',fontWeight:800,fontSize:'1rem',color:'#1e3a8a'}}>{isExchange?'Différence à payer':'TOTAL'}</span>
                <span style={{fontFamily:'Arial',fontWeight:800,fontSize:'1.2rem',color:'#1e3a8a'}}>{fmt(tx.amount)}</span>
              </div>
              <div style={{marginTop:8,display:'flex',alignItems:'center',gap:6,fontSize:'.78rem',color:'#64748b',flexWrap:'wrap'}}>
                <span>Paiement:</span><span style={{fontWeight:700,color:'#1e293b'}}>{fmtPayment(tx)}</span>
              </div>
              <div style={{marginTop:12,padding:10,background:'#f8fafc',borderRadius:8,fontSize:'.68rem',color:'#64748b',textAlign:'center',borderTop:'1px dashed #cbd5e1'}}>
                Garantie 2 mois sur les appareils vendus<br />Merci pour votre confiance — FarTech Store
              </div>
            </div>
          </div>
        </div>
        <div className="mfoot">
          <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
          <button className="btn btn-blue" onClick={dlPDF}><i className="fa fa-download" /> Télécharger PDF</button>
        </div>
      </div>
    </div>
  )
}

// ── EXPORT UTILS ─────────────────────────────────────────
function expPDF(tblId, title) {
  const tbl = document.getElementById(tblId)
  if (!tbl || !window.jspdf) { alert('Export non disponible'); return }
  const {jsPDF} = window.jspdf
  const doc = new jsPDF({orientation:'landscape',unit:'mm'})
  doc.setFillColor(30,58,138); doc.rect(0,0,300,18,'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(255,255,255)
  doc.text(`FarTech — ${title}`,12,12)
  doc.setFontSize(8); doc.setFont('helvetica','normal'); doc.text(new Date().toLocaleDateString('fr-FR'),250,12,{align:'right'})
  const heads = [...tbl.querySelectorAll('thead th')].map(th=>th.textContent.trim()).filter(h=>h&&h!=='Actions')
  const rows = [...tbl.querySelectorAll('tbody tr')].map(tr=>[...tr.querySelectorAll('td')].slice(0,heads.length).map(td=>td.textContent.trim().replace(/\s+/g,' ').substring(0,25)))
  let y=24; const cw=(doc.internal.pageSize.width-24)/heads.length
  doc.setFillColor(239,246,255); doc.rect(12,y-4,doc.internal.pageSize.width-24,8,'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(30,58,138)
  heads.forEach((h,i)=>doc.text(h,12+i*cw,y)); y+=8
  doc.setFont('helvetica','normal'); doc.setTextColor(15,23,42)
  rows.forEach((row,ri)=>{if(y>185){doc.addPage();y=14;}if(ri%2===0){doc.setFillColor(248,250,252);doc.rect(12,y-3.5,doc.internal.pageSize.width-24,7,'F');}row.forEach((c,i)=>doc.text(c,12+i*cw,y));y+=7})
  doc.save(`fartech_${title.toLowerCase()}_${Date.now()}.pdf`)
}

function expXLS(tblId, title) {
  const tbl = document.getElementById(tblId)
  if (!tbl || !window.XLSX) { alert('Export non disponible'); return }
  const wb = window.XLSX.utils.book_new()
  window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.table_to_sheet(tbl), title)
  window.XLSX.writeFile(wb, `fartech_${title.toLowerCase()}_${Date.now()}.xlsx`)
}
