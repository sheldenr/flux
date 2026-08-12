import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Bell, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, Mail, MoreHorizontal, Pencil, Phone,
  Plus, Search, Settings, Trash2, UserRoundPlus, Users, X,
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import './styles.css'

const CONTACT_STORAGE_KEY = 'flux-contacts-v2'

// Initialize Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null

const tiers = ['All', 'Core', 'Active', 'Loose']
const tierGuidance = {
  Core: { cadence: 'Every 3–4 weeks', description: 'Mentors, close collaborators, and people actively involved in your current goals.' },
  Active: { cadence: 'Every 3 months', description: 'Former teammates, builder-program connections, and industry peers.' },
  Loose: { cadence: 'Every 6–12 months', description: 'Alumni, recruiters, and distant acquaintances.' },
}

const CADENCE_STORAGE_KEY = 'flux-cadence-settings'

function formatCadence(amount, unit) {
  const value = Number(amount) || 1
  const singularUnit = unit.replace(/s$/, '')
  return `Every ${value} ${value === 1 ? singularUnit : unit}`
}

function LogoMark({ className, size = 18 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 706 608"
      width={size}
      height={Math.round(size * (608 / 706))}
      className={className}
      role="img"
      aria-label="Flux Logo"
    >
      <path fill="currentColor" d="M655 105H351C267 105 204 145 173 207C163 227 157 248 151 271L125 390H274L302 287C309 260 326 246 355 246H551C563 246 570 240 577 230L655 105Z" />
      <path fill="currentColor" d="M274 392H474L399 513C390 528 382 535 365 535H233L274 392Z" />
    </svg>
  )
}

function loadContacts() {
  try { return JSON.parse(localStorage.getItem(CONTACT_STORAGE_KEY)) || [] } catch { return [] }
}

function App() {
  const workspaceRef = useRef(null)
  const [contacts, setContacts] = useState(loadContacts)
  const [view, setView] = useState('Relationships')
  const [railWidth, setRailWidth] = useState(() => Number(localStorage.getItem('flux-rail-width')) || 76)
  const [resizingRail, setResizingRail] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const railCollapsed = railWidth <= 132
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [editContact, setEditContact] = useState(null)
  const importInputRef = useRef(null)
  const [importStatus, setImportStatus] = useState('')
  const [cadenceSettings, setCadenceSettings] = useState(() => {
    const defaults = { Core: { ...tierGuidance.Core, amount: 3, unit: 'weeks' }, Active: { ...tierGuidance.Active, amount: 3, unit: 'months' }, Loose: { ...tierGuidance.Loose, amount: 9, unit: 'months' } }
    try {
      const saved = JSON.parse(localStorage.getItem(CADENCE_STORAGE_KEY)) || {}
      return Object.fromEntries(Object.keys(defaults).map((tier) => { const item = { ...defaults[tier], ...saved[tier] }; const amount = Math.min(365, Math.max(1, Number(item.amount) || defaults[tier].amount)); const unit = item.unit || defaults[tier].unit; return [tier, { ...item, amount, unit, cadence: formatCadence(amount, unit) }] }))
    } catch { return defaults }
  })
  const [showDetails, setShowDetails] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', role: '', company: '' })

  const visible = useMemo(() => contacts.filter((contact) => {
    const text = `${contact.name} ${contact.role} ${contact.company} ${contact.location}`.toLowerCase()
    return (filter === 'All' || contact.tier === filter) && text.includes(query.toLowerCase())
  }), [contacts, filter, query])

  const activeContact = contacts.find((contact) => contact.id === selected) || visible[0] || contacts[0]
  const selectedTier = filter === 'All' ? 'Core' : filter
  const selectedCadence = cadenceSettings[selectedTier]

  // Load contacts from Supabase on mount
  useEffect(() => {
    async function fetchContacts() {
      if (!supabase) {
        setIsLoading(false)
        return
      }
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .order('name', { ascending: true })
        if (error) throw error
        if (data) {
          setContacts(data)
          localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(data))
        }
      } catch (err) {
        console.error('Failed to load contacts from Supabase:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchContacts()
  }, [])

  useEffect(() => {
    if (!resizingRail) return undefined
    const move = (event) => {
      const left = workspaceRef.current?.getBoundingClientRect().left || 0
      setRailWidth(Math.min(360, Math.max(76, event.clientX - left)))
    }
    const stop = () => setResizingRail(false)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    document.body.classList.add('resizing-rail')
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      document.body.classList.remove('resizing-rail')
    }
  }, [resizingRail])

  useEffect(() => { localStorage.setItem('flux-rail-width', railWidth) }, [railWidth])

  useEffect(() => { document.documentElement.dataset.theme = 'dark' }, [])

  useEffect(() => {
    const handleShortcut = (event) => {
      if (!(event.ctrlKey || event.metaKey) || !['1', '2', '3'].includes(event.key)) return
      event.preventDefault()
      const tier = { 1: 'Core', 2: 'Active', 3: 'Loose' }[event.key]
      setFilter(tier)
      setView('Relationships')
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== 'Escape') return
      setShowDetails(false)
      setShowAdd(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  async function persist(nextContacts, action, payload) {
    setContacts(nextContacts)
    localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(nextContacts))

    if (!supabase) return

    try {
      if (action === 'add') {
        await supabase.from('contacts').insert([payload])
      } else if (action === 'update') {
        await supabase.from('contacts').update(payload.changes).eq('id', payload.id)
      } else if (action === 'delete') {
        await supabase.from('contacts').delete().in('id', payload.ids)
      } else if (action === 'overwrite') {
        await supabase.from('contacts').upsert(payload)
      }
    } catch (err) {
      console.error('Failed to sync changes with Supabase:', err)
    }
  }

  function addContact(event) {
    event.preventDefault()
    if (!newContact.name.trim()) return
    const initials = newContact.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
    // Generate a unique integer ID for client-first rendering
    const newId = Date.now()
    const contact = { id: newId, name: newContact.name.trim(), role: newContact.role.trim(), company: newContact.company.trim(), location: '', tier: 'Active', initials, color: 'blue', last: 'Not yet', next: 'Today', note: '', activity: 'Contact added to your circle' }
    persist([...contacts, contact], 'add', contact)
    setSelected(newId)
    setShowAdd(false)
    setNewContact({ name: '', role: '', company: '' })
  }

  function logTouchpoint() {
    if (!activeContact) return
    const changes = { last: 'Just now', next: 'In 3 weeks', activity: 'You logged a touchpoint' }
    const next = contacts.map((contact) => contact.id === activeContact.id ? { ...contact, ...changes } : contact)
    persist(next, 'update', { id: activeContact.id, changes })
  }

  function saveContactInfo(id, note) {
    const changes = { note, activity: 'You updated their context' }
    persist(contacts.map((contact) => contact.id === id ? { ...contact, ...changes } : contact), 'update', { id, changes })
  }

  function saveContactDetails(id, changes) {
    const fullChanges = { ...changes, activity: 'You updated their contact details' }
    persist(contacts.map((contact) => contact.id === id ? { ...contact, ...fullChanges } : contact), 'update', { id, changes: fullChanges })
  }

  function updateCadence(tier, changes) {
    setCadenceSettings((current) => {
      const updated = { ...current[tier], ...changes }
      updated.amount = Math.min(365, Math.max(1, Number(updated.amount) || 1))
      updated.cadence = formatCadence(updated.amount, updated.unit)
      const next = { ...current, [tier]: updated }
      localStorage.setItem(CADENCE_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  function deleteSelected() {
    if (!selectedIds.length) return
    persist(contacts.filter((contact) => !selectedIds.includes(contact.id)), 'delete', { ids: selectedIds })
    setSelectedIds([])
    setShowDetails(false)
  }

  function saveEditedContact(event) {
    event.preventDefault()
    if (!editContact?.name.trim()) return
    const changes = { name: editContact.name.trim(), role: editContact.role || 'New connection', company: editContact.company || 'Independent', tier: editContact.tier || editContact.tier, activity: 'You updated their contact details' }
    persist(contacts.map((contact) => contact.id === editContact.id ? { ...contact, ...changes } : contact), 'update', { id: editContact.id, changes })
    setEditContact(null)
  }


  function importContacts(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const raw = String(reader.result || '')
        let rows
        if (file.name.toLowerCase().endsWith('.json')) {
          const parsed = JSON.parse(raw)
          rows = Array.isArray(parsed) ? parsed : parsed.contacts
        } else {
          const [headerLine, ...lines] = raw.split(/\r?\n/).filter(Boolean)
          const headers = headerLine.split(',').map((header) => header.trim().toLowerCase())
          rows = lines.map((line) => { const values = line.split(',').map((value) => value.trim().replace(/^"|"$/g, '')); return Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])) })
        }
        if (!Array.isArray(rows)) throw new Error('Expected a list of contacts')
        const imported = rows.filter((row) => row?.name).map((row, index) => {
          const name = String(row.name).trim()
          const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
          return { id: Date.now() + index, name, role: row.role || row.title || 'New connection', company: row.company || row.organization || 'Independent', location: row.location || 'Imported contact', tier: 'Loose', initials, color: 'blue', last: row.last || 'Not yet', next: row.next || 'This week', note: row.note || 'Imported from your CRM.', activity: 'Imported into Loose' }
        })
        persist([...contacts, ...imported], 'overwrite', imported)
        setImportStatus(`${imported.length} contact${imported.length === 1 ? '' : 's'} imported into Loose.`)
      } catch { setImportStatus('Could not read that file. Use a CSV or JSON contact list.') }
      event.target.value = ''
    }
    reader.readAsText(file)
  }

  if (isLoading) return <LoadingScreen />

  return <div ref={workspaceRef} className="workspace">
    <aside className={railCollapsed ? 'rail rail-collapsed' : 'rail'} style={{ '--rail-width': `${railWidth}px` }}>
      <div className="brand"><span className="brand-mark"><LogoMark size={20} /></span><span>flux</span></div>
      <div className="rail-section rail-primary-nav">
        <p className="rail-label">Flux</p>
        <NavItem icon={Users} label="People" active={view === 'Relationships'} onClick={() => setView('Relationships')} />
        <NavItem icon={CalendarDays} label="Today" count={contacts.filter(c => c.next === 'Today' || c.next === 'Tomorrow').length} active={view === 'Today'} onClick={() => setView('Today')} />
      </div>
      <div className="rail-bottom"><button className="rail-link" onClick={() => setView('Settings')}><Settings size={16} /> <span>Settings</span></button><button className="rail-link"><CircleHelp size={16} /> <span>Help & support</span> <b>?</b></button></div>
      <button className="rail-resize" aria-label="Resize sidebar" title="Drag to resize sidebar" onPointerDown={(event) => { event.preventDefault(); setResizingRail(true) }} />
    </aside>

    <main className="main-area">
      <header className="topbar">
        <label className="command-search">
          <Search size={18} />
          <input aria-label="Search contacts" placeholder="Search contacts" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="topbar-actions">
          <button className="topbar-btn" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> <span>New Contact</span>
          </button>
          <button className="top-icon" aria-label="Notifications" title="Notifications"><Bell size={18} /></button>
        </div>
      </header>

      {view === 'Relationships' && <section className="category-domes-container" aria-labelledby="cadence-title">
        {['Loose', 'Active', 'Core'].map((tier) => {
          const isActive = filter === tier || (filter === 'All' && tier === 'Core');
          const count = contacts.filter((c) => c.tier === tier).length;
          return (
            <button
              key={tier}
              className={`category-dome-tab ${isActive ? 'active' : ''}`}
              onClick={() => { setFilter(tier); setView('Relationships'); }}
              title={`${tier} relationships`}
              aria-label={`${tier} relationships`}
            >
              <div className="dome-content">
                <span className="dome-tier-name">{tier}</span>
                <span className="dome-tier-count">{count} {count === 1 ? 'contact' : 'contacts'}</span>
              </div>
            </button>
          );
        })}
        <div className="circle-guidance" aria-live="polite">
          <span>{selectedTier}</span>
          <strong>Touch base {selectedCadence.cadence.toLowerCase()}</strong>
        </div>
        <div className="cadence-notes" aria-label="Relationship cadence guidance">
          {['Core', 'Active', 'Loose'].map((tier) => (
            <button key={tier} className={(filter === tier || (filter === 'All' && tier === 'Core')) ? 'cadence-note active' : 'cadence-note'} onClick={() => { setFilter(tier); setView('Relationships') }}>
              <span className={`tier-label ${tier.toLowerCase()}`}>{tier}</span>
              <strong>{tierGuidance[tier].cadence}</strong>
              <small>{tierGuidance[tier].description}</small>
            </button>
          ))}
        </div>
      </section>}

      {view === 'Today' ? <TodayView contacts={contacts} setSelected={setSelected} setView={setView} /> : view === 'Planner' ? <Planner contacts={contacts} /> : view === 'Settings' ? <SettingsView contacts={contacts} cadenceSettings={cadenceSettings} updateCadence={updateCadence} importInputRef={importInputRef} onImport={importContacts} importStatus={importStatus} /> : <RelationshipsView contacts={contacts} visible={visible} filter={filter} cadenceSettings={cadenceSettings} setFilter={setFilter} setSelected={setSelected} activeContact={activeContact} setShowAdd={setShowAdd} query={query} logTouchpoint={logTouchpoint} showDetails={showDetails} setShowDetails={setShowDetails} saveContactInfo={saveContactInfo} saveContactDetails={saveContactDetails} selectedIds={selectedIds} setSelectedIds={setSelectedIds} onDeleteSelected={deleteSelected} onEditSelected={() => { if (selectedIds.length === 1) setEditContact(contacts.find((contact) => contact.id === selectedIds[0])) }} />}
    </main>

    {showAdd && <div className="modal-backdrop" onClick={() => setShowAdd(false)}><form className="add-dialog" onSubmit={addContact} onClick={(event) => event.stopPropagation()}><button type="button" className="close-button" onClick={() => setShowAdd(false)}><X size={18} /></button><p className="eyebrow">New contact</p><h2>Add someone to your circle.</h2>{[['name', 'Name'], ['role', 'Role'], ['company', 'Company']].map(([key, label]) => <label key={key}>{label}<input autoFocus={key === 'name'} value={newContact[key]} onChange={(event) => setNewContact({ ...newContact, [key]: event.target.value })} /></label>)}<button className="dark-button" type="submit">Save contact <Check size={16} /></button></form></div>}
    {editContact && <div className="modal-backdrop" onClick={() => setEditContact(null)}><form className="add-dialog" onSubmit={saveEditedContact} onClick={(event) => event.stopPropagation()}><button type="button" className="close-button" onClick={() => setEditContact(null)}><X size={18} /></button><p className="eyebrow">Edit contact</p><h2>Keep the details current.</h2>{[['name', 'Name'], ['role', 'Role'], ['company', 'Company']].map(([key, label]) => <label key={key}>{label}<input autoFocus={key === 'name'} value={editContact[key]} onChange={(event) => setEditContact({ ...editContact, [key]: event.target.value })} /></label>)}<label>Circle layer<select value={editContact.tier || 'Loose'} onChange={(event) => setEditContact({ ...editContact, tier: event.target.value })}><option>Core</option><option>Active</option><option>Loose</option></select></label><button className="dark-button" type="submit">Save changes <Check size={16} /></button></form></div>}
  </div>
}

function LoadingScreen() {
  return <div className="loading-screen" role="status" aria-label="Loading Flux"><div className="loading-brand"><span className="loading-brand-icon"><LogoMark size={20} /></span><span>flux</span></div><span className="loading-rule"></span></div>
}

function SettingsView({ contacts, cadenceSettings, updateCadence, importInputRef, onImport, importStatus }) {
  const due = contacts.filter((contact) => contact.next === 'Today' || contact.next === 'Tomorrow').length
  return <section className="settings-view page-view"><div className="page-intro"><p className="eyebrow">Workspace settings</p><h1>Bring your people with you.</h1><p>Import a normal CRM export and Flux will place new connections in the Loose ring so you can sort them over time.</p></div><div className="settings-card"><div><span className="eyebrow">Import contacts</span><h2>Start with a CSV or JSON file.</h2><p>Use columns like name, role, company, location, note, last, or next. Imported contacts are added to Loose.</p></div><input ref={importInputRef} type="file" accept=".csv,.json,application/json,text/csv" onChange={onImport} hidden /><button className="dark-button" onClick={() => importInputRef.current?.click()}>Choose file <Plus size={16} /></button>{importStatus && <p className="import-status" role="status">{importStatus}</p>}</div><div className="settings-card cadence-settings"><div><span className="eyebrow">Connection frequency</span><h2>Choose how often to stay in touch.</h2><p>Set a duration for each ring. Flux will use it everywhere it shows your relationship rhythm.</p></div>{['Core', 'Active', 'Loose'].map((tier) => <label key={tier}><span>{tier}</span><div className="cadence-input"><input type="number" min="1" max="365" value={cadenceSettings[tier].amount} onChange={(event) => updateCadence(tier, { amount: Math.max(1, Number(event.target.value) || 1) })} aria-label={`${tier} cadence amount`} /><select value={cadenceSettings[tier].unit} onChange={(event) => updateCadence(tier, { unit: event.target.value })} aria-label={`${tier} cadence unit`}><option value="days">days</option><option value="weeks">weeks</option><option value="months">months</option></select></div></label>)}</div><div className="settings-snapshot"><p className="eyebrow">Snapshot</p><div className="snapshot-grid"><div><span className="stat-label">Total circle</span><strong>{contacts.length}</strong></div><div><span className="stat-label">Due for touch</span><strong>{due}</strong></div><div><span className="stat-label">Cadence health</span><strong>92%</strong></div></div></div></section>
}

function TodayView({ contacts, setSelected, setView }) {
  const due = contacts.filter((contact) => ['Today', 'Tomorrow', 'In 3 days'].includes(contact.next))
  return <section className="today-view page-view">
    <div className="page-intro"><h1>Your next touchpoints</h1><p>Small, timely check-ins are the whole practice.</p></div>
    <div className="today-summary"><strong>{due.length}</strong><span>people are coming up<br />in your circle</span></div>
    <div className="today-list"><div className="list-heading"><span>Person</span><span>When</span><span>Why now</span><span></span></div>{due.map((contact) => <button className="today-row" key={contact.id} onClick={() => { setSelected(contact.id); setView('Relationships') }}><div className="contact-identity"><div className={`avatar avatar-${contact.color}`}>{contact.initials}</div><div><strong>{contact.name}</strong><span>{contact.role} · {contact.company}</span></div></div><span className={contact.next === 'Today' ? 'next-label due' : 'next-label'}>{contact.next}</span><span className="today-note">{contact.note}</span><ChevronRight size={16} /></button>)}</div>
  </section>
}

function NavItem({ icon: Icon, label, active, count, onClick }) { return <button title={label} aria-label={label} className={active ? 'nav-item active' : 'nav-item'} onClick={onClick}><Icon size={17} /><span>{label}</span>{count && <small>{count}</small>}</button> }

function ContactRow({ contact, active, selected, onClick, onToggle }) { return <button className={`${active ? 'contact-row selected' : 'contact-row'}${selected ? ' checked' : ''}`} onClick={onClick}><input className="contact-select" type="checkbox" checked={selected} onChange={() => onToggle(contact.id)} onClick={(event) => event.stopPropagation()} aria-label={`Select ${contact.name}`} /><div className="contact-identity"><div className={`avatar avatar-${contact.color}`}>{contact.initials}</div><div><strong>{contact.name}</strong><span>{contact.role} · {contact.company}</span></div></div><span className={`tier-label ${contact.tier.toLowerCase()}`}>{contact.tier}</span><span className="date-label">{contact.last}</span><span className={contact.next === 'Today' ? 'next-label due' : 'next-label'}>{contact.next}</span><ChevronRight size={16} /></button> }

function ContactDetails({ contact, onLog, onClose, onSaveNote, onSaveDetails }) {
  const [editingNote, setEditingNote] = useState(false)
  const [draft, setDraft] = useState(contact?.note || '')
  const [connectedWith, setConnectedWith] = useState(contact?.connectedWith || '')
  const [touchpointMode, setTouchpointMode] = useState(contact?.next === 'Today' ? 'today' : 'date')
  const [touchpointDate, setTouchpointDate] = useState(/^\d{4}-\d{2}-\d{2}$/.test(contact?.next || '') ? contact.next : '')
  useEffect(() => { setDraft(contact?.note || ''); setEditingNote(false); setConnectedWith(contact?.connectedWith || ''); setTouchpointMode(contact?.next === 'Today' ? 'today' : 'date'); setTouchpointDate(/^\d{4}-\d{2}-\d{2}$/.test(contact?.next || '') ? contact.next : '') }, [contact?.id, contact?.next, contact?.connectedWith])
  if (!contact) return null
  return <aside className="details detail-drawer"><button className="drawer-close" onClick={onClose} aria-label="Close contact details"><X size={18} /></button><div className="activity-panel-heading"><div><p className="eyebrow">Contact details</p><h2>{contact.name}</h2></div><button className="more-button"><MoreHorizontal size={18} /></button></div><div className="drawer-profile"><div className={`avatar avatar-${contact.color}`}>{contact.initials}</div><div><strong>{contact.role}</strong><span>{contact.company} · {contact.location}</span></div></div><div className="contact-detail-fields"><label><span>Description</span><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => onSaveNote(contact.id, draft)} aria-label="Contact description" /></label><label><span>Connected with</span><select value={connectedWith} onChange={(event) => { setConnectedWith(event.target.value); onSaveDetails(contact.id, { connectedWith: event.target.value }) }}><option value="">Select a channel</option><option>Email</option><option>Phone</option><option>Text</option><option>LinkedIn</option><option>In person</option></select></label><label><span>Next touchpoint</span><select value={touchpointMode} onChange={(event) => { const mode = event.target.value; setTouchpointMode(mode); if (mode === 'today') onSaveDetails(contact.id, { next: 'Today' }); else if (touchpointDate) onSaveDetails(contact.id, { next: touchpointDate }) }}><option value="today">Today</option><option value="date">Another date</option></select>{touchpointMode === 'date' && <input type="date" value={touchpointDate} onChange={(event) => { setTouchpointDate(event.target.value); if (event.target.value) onSaveDetails(contact.id, { next: event.target.value }) }} />}</label></div><div className="timeline-event focus-event"><div className="activity-mark"><CalendarDays size={13} /></div><div><span className="event-kicker">Next touchpoint · {contact.next}</span><strong>Reach out to {contact.name}</strong><div className="detail-actions"><button onClick={onLog}><Check size={15} /> Mark complete</button><button><Mail size={15} /> Email</button><button><Phone size={15} /> Call</button></div></div></div><div className="timeline-event"><div className="activity-mark"><Check size={13} /></div><div><span className="event-kicker">Recent activity</span><strong>{contact.activity}</strong><p>Last touchpoint · {contact.last}</p></div></div></aside>
}

function WorkspaceView({ contacts, filter, setView, setFilter, setShowAdd, due }) {
  return <section className="workspace-view">
    <div className="workspace-ring-focus"><div><p className="eyebrow">Your relationship modes</p><h2>Choose your circle.</h2><p>Use the rings to move between the people you’re closest to, actively nurturing, or keeping in orbit.</p><small>Shortcut: <kbd>Ctrl 1</kbd> Core · <kbd>Ctrl 2</kbd> Active · <kbd>Ctrl 3</kbd> Loose</small></div><RelationshipVisual activeTier={filter} onSelect={(tier) => { setFilter(tier); setView('Relationships') }} /></div>
    <div className="workspace-section-heading"><div><p className="eyebrow">Next moves</p><h2>Keep the momentum gentle.</h2></div><span>Choose one thing to move forward.</span></div>
    <div className="workspace-next-actions"><button onClick={() => { setFilter('All'); setView('Relationships') }}><span className="next-icon"><Check size={17} /></span><span><strong>Review your people</strong><small>See who is ready for a thoughtful touchpoint.</small></span><ChevronRight size={17} /></button><button onClick={() => setShowAdd(true)}><span className="next-icon"><UserRoundPlus size={17} /></span><span><strong>Add someone new</strong><small>Give a new connection a place in your circle.</small></span><ChevronRight size={17} /></button><button onClick={() => { setFilter('All'); setView('Relationships') }}><span className="next-icon"><CalendarDays size={17} /></span><span><strong>Set your relationship rhythm</strong><small>Make a cadence that feels easy to keep.</small></span><ChevronRight size={17} /></button></div>
  </section>
}

function RelationshipVisual({ activeTier = 'All', onSelect }) {
  const choose = (tier) => onSelect?.(tier)
  return <div className="relationship-visual" aria-label="Select a relationship ring"><p className="eyebrow">Your relationship rings</p><div className="orbit"><button className={`orbit-ring ring-loose ${activeTier === 'Loose' ? 'selected' : ''}`} onClick={() => choose('Loose')} aria-label="Show Loose relationships"></button><button className={`orbit-ring ring-active ${activeTier === 'Active' ? 'selected' : ''}`} onClick={() => choose('Active')} aria-label="Show Active relationships"></button><button className={`orbit-ring ring-core ${activeTier === 'Core' ? 'selected' : ''}`} onClick={() => choose('Core')} aria-label="Show Core relationships"></button><button className={`orbit-label label-core ${activeTier === 'Core' ? 'selected' : ''}`} onClick={() => choose('Core')}>Core</button><button className={`orbit-label label-active ${activeTier === 'Active' ? 'selected' : ''}`} onClick={() => choose('Active')}>Active</button><button className={`orbit-label label-loose ${activeTier === 'Loose' ? 'selected' : ''}`} onClick={() => choose('Loose')}>Loose</button></div><p className="orbit-caption">Select a ring to focus your list.</p></div>
}

function RelationshipsView({ contacts, visible, filter, cadenceSettings, setFilter, setSelected, activeContact, setShowAdd, query, logTouchpoint, showDetails, setShowDetails, saveContactInfo, saveContactDetails, selectedIds, setSelectedIds, onDeleteSelected, onEditSelected }) {
  const allVisibleSelected = visible.length > 0 && visible.every((contact) => selectedIds.includes(contact.id))
  const toggleSelected = (id) => setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((selectedId) => selectedId !== id) : [...selectedIds, id])
  const toggleAll = () => setSelectedIds(allVisibleSelected ? selectedIds.filter((id) => !visible.some((contact) => contact.id === id)) : [...new Set([...selectedIds, ...visible.map((contact) => contact.id)])])
  return <section className="relationships-view">
    <div className="contacts-panel">
      <div className="contacts-panel-heading"><div><p className="eyebrow">Your people</p><h2>Contact list</h2></div><span className="result-count">{visible.length} of {contacts.length} contacts</span></div>
      {selectedIds.length > 0 && <div className="selection-toolbar"><strong>{selectedIds.length} selected</strong><button type="button" onClick={onEditSelected} disabled={selectedIds.length !== 1}><Pencil size={14} /> Edit</button><button type="button" className="danger-action" onClick={onDeleteSelected}><Trash2 size={14} /> Delete</button><button type="button" className="clear-selection" onClick={() => setSelectedIds([])}>Clear</button></div>}
      <div className="contacts-layout"><div className="contact-list"><div className="list-heading"><label className="select-all"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} aria-label="Select all visible contacts" /></label><span>Contact</span><span>Relationship</span><span>Last touchpoint</span><span>Next</span><span></span></div>{visible.map((contact) => <ContactRow key={contact.id} contact={contact} active={activeContact?.id === contact.id} selected={selectedIds.includes(contact.id)} onToggle={toggleSelected} onClick={() => { setSelected(contact.id); setShowDetails(true) }} />)}{visible.length === 0 && (contacts.length === 0 ? <div className="empty-state empty-state-new"><strong>Your circle is empty.</strong><p>Add your first contact to start keeping the thread warm.</p><button className="dark-button" onClick={() => setShowAdd(true)}><Plus size={15} /> Add new contact</button></div> : <div className="empty-state">{query ? `No contacts match “${query}”.` : filter === 'All' ? 'No connections yet.' : `No connections in the ${filter} category.`}</div>)}</div></div>
    </div>
    {showDetails && <div className="drawer-backdrop" onClick={() => setShowDetails(false)}><div onClick={(event) => event.stopPropagation()}><ContactDetails contact={activeContact} onLog={logTouchpoint} onClose={() => setShowDetails(false)} onSaveNote={saveContactInfo} onSaveDetails={saveContactDetails} /></div></div>}
    <section className="tier-guide" aria-labelledby="tier-guide-title"><div className="tier-guide-heading"><div><p className="eyebrow">A simple rhythm</p><h2 id="tier-guide-title">Build your circle from the center out.</h2><p>Sort people by the level of care you want to maintain—not their importance.</p></div><div className="rhythm-rings" aria-hidden="true"><span className="rhythm-ring loose"></span><span className="rhythm-ring active"></span><span className="rhythm-ring core"></span></div></div><div className="tier-briefs">{['Core', 'Active', 'Loose'].map((tier) => <button className={filter === tier ? 'tier-brief active' : 'tier-brief'} key={tier} onClick={() => setFilter(tier)}><span className={`tier-label ${tier.toLowerCase()}`}>{tier}</span><strong>{cadenceSettings[tier].cadence}</strong><p>{cadenceSettings[tier].description}</p></button>)}</div></section>
  </section>
}

function Overview({ contacts, setView, setSelected }) { const due = contacts.filter((contact) => contact.next === 'Today' || contact.next === 'Tomorrow'); return <section className="overview-view"><div className="overview-hero"><div><p className="crumb">Monday, 19 May 2025</p><h1>Keep the thread<br /><em>going.</em></h1><p className="subtitle">A few thoughtful touchpoints go a long way.</p></div><div className="overview-stat"><span>Due this week</span><strong>{due.length}</strong><button onClick={() => setView('Contacts')}>Review contacts <ChevronRight size={15} /></button></div></div><div className="overview-heading"><div><p className="eyebrow">Your circle</p><h2>Worth a hello</h2></div><button className="text-button" onClick={() => setView('Contacts')}>See all contacts <ArrowIcon /></button></div><div className="overview-list">{due.map((contact) => <button className="overview-row" key={contact.id} onClick={() => { setSelected(contact.id); setView('Contacts') }}><div className={`avatar avatar-${contact.color}`}>{contact.initials}</div><div><strong>{contact.name}</strong><span>{contact.role} · {contact.company}</span></div><span className="next-label due">{contact.next}</span><ChevronRight size={16} /></button>)}</div></section> }

function Planner({ contacts }) { return <section className="planner-view"><p className="crumb">Workspace <span>/</span> Planner</p><h1>Set the pace.</h1><p className="subtitle">Different relationships need different kinds of attention.</p><div className="planner-grid">{['Core', 'Active', 'Loose'].map((tier) => <div className={`planner-card ${tier.toLowerCase()}`} key={tier}><span className={`tier-label ${tier.toLowerCase()}`}>{tier}</span><strong>{tier === 'Core' ? 'Every 3–4 weeks' : tier === 'Active' ? 'Every 3 months' : 'Every 6–12 months'}</strong><p>{contacts.filter((contact) => contact.tier === tier).length} contacts on this cadence.</p><ChevronRight size={17} /></div>)}</div></section> }

function ArrowIcon() { return <ChevronRight size={15} /> }

createRoot(document.getElementById('root')).render(<App />)
