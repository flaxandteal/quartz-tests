import { useState } from "react"
import { PROJECTS } from "./projects.js"
import { ADMIN_CODE } from "./config.js"
import { submitResults, fetchResults } from "./storage.js"

const SEVERITIES = ["Low", "Medium", "High", "Critical"]
const SEV_COLOR = { Low: "#5F5E5A", Medium: "#BA7517", High: "#ea580c", Critical: "#A32D2D" }
const SEV_BG = { Low: "#F1EFE8", Medium: "#FAEEDA", High: "#fff0e6", Critical: "#FCEBEB" }

const STATUS_META = {
  pass:     { label: "Pass",      color: "#3B6D11", bg: "#EAF3DE", border: "#97C459" },
  fail:     { label: "Fail",      color: "#A32D2D", bg: "#FCEBEB", border: "#F09595" },
  blocked:  { label: "Blocked",   color: "#854F0B", bg: "#FAEEDA", border: "#EF9F27" },
  untested: { label: "Not tested",color: "#888780", bg: "#F1EFE8", border: "#D3D1C7" },
}

const fmtDate = (iso) => {
  try { return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) }
  catch { return iso }
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function ProgressBar({ done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "#E8E6DF", borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#3B6D11", borderRadius: 2, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: "0.7rem", color: "#888780", minWidth: 36, textAlign: "right" }}>{done}/{total}</span>
    </div>
  )
}

function Badge({ label, severity }) {
  return (
    <span style={{ fontSize: "0.68rem", fontWeight: 500, padding: "2px 7px", borderRadius: 4,
      background: SEV_BG[severity] || "#F1EFE8", color: SEV_COLOR[severity] || "#5F5E5A",
      border: `1px solid ${SEV_COLOR[severity] || "#5F5E5A"}40` }}>
      {label}
    </span>
  )
}

const inputStyle = {
  width: "100%", background: "#fff", border: "1px solid #D3D1C7", borderRadius: 6,
  padding: "0.6rem 0.85rem", color: "#2C2C2A", fontSize: "0.88rem", boxSizing: "border-box",
}
const btnPrimary = (disabled) => ({
  padding: "0.6rem 1.5rem", background: disabled ? "#E8E6DF" : "#2C2C2A",
  color: disabled ? "#B4B2A9" : "#fff", border: "none", borderRadius: 6,
  fontSize: "0.82rem", fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
})
const btnSecondary = {
  padding: "0.6rem 1rem", background: "#fff", color: "#5F5E5A",
  border: "1px solid #D3D1C7", borderRadius: 6, fontSize: "0.82rem", cursor: "pointer",
}

// ─── TESTER VIEW ──────────────────────────────────────────────────────────────

function TesterView({ onAdmin }) {
  const [phase, setPhase] = useState("name")
  const [name, setName] = useState("")
  const [projectId, setProjectId] = useState(PROJECTS[0].id)
  const [testIdx, setTestIdx] = useState(0)
  const [results, setResults] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const project = PROJECTS.find(p => p.id === projectId)
  const tests = project.tests
  const test = tests[testIdx]
  const defaultResult = { status: "untested", notes: "", bug: { title: "", severity: "Medium", actual: "", steps: "" } }
  const r = results[test?.id] || defaultResult
  const done = Object.values(results).filter(r => r.status !== "untested").length

  const setStatus = (s) => setResults(prev => ({ ...prev, [test.id]: { ...(prev[test.id] || defaultResult), status: s } }))
  const updateNotes = (v) => setResults(prev => ({ ...prev, [test.id]: { ...(prev[test.id] || defaultResult), notes: v } }))
  const updateBug = (f, v) => setResults(prev => {
    const cur = prev[test.id] || defaultResult
    return { ...prev, [test.id]: { ...cur, bug: { ...cur.bug, [f]: v } } }
  })

  const handleFinish = async () => {
    setSaving(true)
    setSaveError(null)
    const { ok, error } = await submitResults({ name, project, results })
    setSaving(false)
    if (ok) {
      setPhase("done")
    } else {
      setSaveError(error || "Failed to save. Please try again.")
    }
  }

  const goNext = () => {
    if (testIdx < tests.length - 1) setTestIdx(testIdx + 1)
    else handleFinish()
  }

  const canNext = r.status !== "untested"
  const isLast = testIdx === tests.length - 1

  // Done screen
  if (phase === "done") {
    const pass = Object.values(results).filter(r => r.status === "pass").length
    const fail = Object.values(results).filter(r => r.status === "fail").length
    const blocked = Object.values(results).filter(r => r.status === "blocked").length
    return (
      <div style={{ minHeight: "100vh", background: "#F8F7F3", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 420, textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#EAF3DE", border: "1px solid #97C459",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", fontSize: "1.25rem", color: "#3B6D11" }}>✓</div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 500, color: "#2C2C2A", marginBottom: "0.35rem" }}>Results submitted</h2>
          <p style={{ color: "#888780", fontSize: "0.85rem", marginBottom: "1.75rem" }}>Thanks {name}. Results have been saved to the Quartz QA sheet.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem" }}>
            {[["Pass", pass, "#3B6D11", "#EAF3DE"], ["Fail", fail, "#A32D2D", "#FCEBEB"], ["Blocked", blocked, "#854F0B", "#FAEEDA"]].map(([l, v, c, bg]) => (
              <div key={l} style={{ background: bg, borderRadius: 8, padding: "0.75rem 1.25rem", minWidth: 70 }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 500, color: c }}>{v}</div>
                <div style={{ fontSize: "0.7rem", color: c, opacity: 0.8 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Name screen
  if (phase === "name") return (
    <div style={{ minHeight: "100vh", background: "#F8F7F3", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 440, background: "#fff", border: "1px solid #E8E6DF", borderRadius: 12, padding: "2rem" }}>
        <p style={{ color: "#888780", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Quartz — QA Tracker</p>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 500, color: "#2C2C2A", marginBottom: "0.25rem" }}>Feature testing</h1>
        <p style={{ color: "#888780", fontSize: "0.82rem", marginBottom: "1.75rem" }}>Enter your name and select a project to begin.</p>
        <label style={{ display: "block", fontSize: "0.72rem", color: "#5F5E5A", marginBottom: "0.35rem" }}>Your name</label>
        <input autoFocus value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && name.trim() && setPhase("prereq")}
          placeholder="e.g. Sarah" style={{ ...inputStyle, marginBottom: "1rem" }} />
        <label style={{ display: "block", fontSize: "0.72rem", color: "#5F5E5A", marginBottom: "0.35rem" }}>Project</label>
        <select value={projectId} onChange={e => setProjectId(e.target.value)} style={{ ...inputStyle, marginBottom: "1.5rem" }}>
          {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <div style={{ display: "flex", gap: "0.65rem" }}>
          <button onClick={() => name.trim() && setPhase("prereq")} disabled={!name.trim()} style={{ ...btnPrimary(!name.trim()), flex: 1 }}>Continue →</button>
          <button onClick={onAdmin} style={btnSecondary}>Admin</button>
        </div>
      </div>
    </div>
  )

  // Prerequisites screen
  if (phase === "prereq") return (
    <div style={{ minHeight: "100vh", background: "#F8F7F3", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 560, background: "#fff", border: "1px solid #E8E6DF", borderRadius: 12, padding: "2rem" }}>
        <p style={{ color: "#888780", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem" }}>{project.title}</p>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 500, color: "#2C2C2A", marginBottom: "0.35rem" }}>Prerequisites</h2>
        <p style={{ color: "#888780", fontSize: "0.82rem", marginBottom: "1.5rem" }}>An admin must have completed the following setup before you start.</p>
        <div style={{ background: "#F8F7F3", border: "1px solid #E8E6DF", borderRadius: 8, padding: "1.1rem", marginBottom: "1.5rem" }}>
          {project.prerequisites.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: "0.65rem", marginBottom: i < project.prerequisites.length - 1 ? "0.65rem" : 0 }}>
              <span style={{ color: "#BA7517", fontSize: "0.72rem", minWidth: 18, paddingTop: 2, fontWeight: 500 }}>{i + 1}.</span>
              <span style={{ color: "#5F5E5A", fontSize: "0.82rem", lineHeight: 1.6 }}>{p}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.65rem" }}>
          <button onClick={() => setPhase("name")} style={btnSecondary}>← Back</button>
          <button onClick={() => setPhase("test")} style={{ ...btnPrimary(false), flex: 1 }}>Setup confirmed — start testing →</button>
        </div>
      </div>
    </div>
  )

  // Test screen
  return (
    <div style={{ height: "100vh", background: "#F8F7F3", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E8E6DF", padding: "0.75rem 1.75rem", display: "flex", alignItems: "center", gap: "1.5rem", flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <span style={{ color: "#888780", fontSize: "0.7rem" }}>{project.title} — {name}</span>
        </div>
        <div style={{ width: 200 }}><ProgressBar done={done} total={tests.length} /></div>
        <span style={{ color: "#B4B2A9", fontSize: "0.75rem" }}>{testIdx + 1} / {tests.length}</span>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: 230, background: "#fff", borderRight: "1px solid #E8E6DF", overflowY: "auto", padding: "0.75rem 0", flexShrink: 0 }}>
          {tests.map((t, i) => {
            const tr = results[t.id]
            const active = i === testIdx
            const sm = STATUS_META[tr?.status || "untested"]
            return (
              <div key={t.id} onClick={() => setTestIdx(i)}
                style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", padding: "0.55rem 1rem",
                  cursor: "pointer", background: active ? "#F8F7F3" : "transparent",
                  borderLeft: `2px solid ${active ? "#2C2C2A" : "transparent"}` }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: sm.border, flexShrink: 0, marginTop: 5 }} />
                <span style={{ fontSize: "0.75rem", color: active ? "#2C2C2A" : "#888780", lineHeight: 1.45 }}>{t.title}</span>
              </div>
            )
          })}
        </div>

        {/* Main panel */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.75rem 2.25rem" }}>
          <div style={{ maxWidth: 760 }}>
            <p style={{ color: "#B4B2A9", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.35rem" }}>Test {testIdx + 1} of {tests.length}</p>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 500, color: "#2C2C2A", marginBottom: "1.5rem" }}>{test.title}</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{ background: "#fff", border: "1px solid #E8E6DF", borderRadius: 8, padding: "1rem" }}>
                <p style={{ color: "#B4B2A9", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Before you start</p>
                <p style={{ color: "#5F5E5A", fontSize: "0.82rem", lineHeight: 1.6 }}>{test.preconditions}</p>
              </div>
              <div style={{ background: "#EAF3DE", border: "1px solid #C0DD97", borderRadius: 8, padding: "1rem" }}>
                <p style={{ color: "#3B6D11", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>Expected result</p>
                <p style={{ color: "#27500A", fontSize: "0.82rem", lineHeight: 1.6 }}>{test.expected}</p>
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid #E8E6DF", borderRadius: 8, padding: "1rem 1.25rem", marginBottom: "1rem" }}>
              <p style={{ color: "#B4B2A9", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.65rem" }}>Steps</p>
              {test.steps.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: "0.65rem", marginBottom: "0.45rem" }}>
                  <span style={{ color: "#BA7517", fontSize: "0.75rem", minWidth: 20, paddingTop: 1, fontWeight: 500 }}>{i + 1}.</span>
                  <span style={{ color: "#5F5E5A", fontSize: "0.82rem", lineHeight: 1.6 }}>{s}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "#fff", border: "1px solid #E8E6DF", borderRadius: 8, padding: "1.1rem 1.25rem" }}>
              <p style={{ color: "#B4B2A9", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.65rem" }}>Your result</p>
              <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem" }}>
                {[["pass", "✓ Pass"], ["fail", "✗ Fail"], ["blocked", "⚠ Blocked"]].map(([val, label]) => {
                  const m = STATUS_META[val]
                  const active = r.status === val
                  return (
                    <button key={val} onClick={() => setStatus(val)}
                      style={{ padding: "0.55rem 1.25rem", borderRadius: 6,
                        border: `1px solid ${active ? m.border : "#D3D1C7"}`,
                        background: active ? m.bg : "#fff", color: active ? m.color : "#888780",
                        fontSize: "0.82rem", fontWeight: active ? 500 : 400, cursor: "pointer", transition: "all 0.15s" }}>
                      {label}
                    </button>
                  )
                })}
              </div>

              <textarea rows={2} placeholder="Notes (optional)..." value={r.notes} onChange={e => updateNotes(e.target.value)}
                style={{ width: "100%", background: "#F8F7F3", border: "1px solid #E8E6DF", borderRadius: 6,
                  padding: "0.55rem 0.75rem", color: "#2C2C2A", fontSize: "0.82rem", resize: "vertical", boxSizing: "border-box" }} />

              {r.status === "fail" && (
                <div style={{ marginTop: "1rem", background: "#FCEBEB", border: "1px solid #F7C1C1", borderRadius: 8, padding: "1rem" }}>
                  <p style={{ color: "#791F1F", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.65rem" }}>Bug report</p>
                  <input placeholder="Bug title *" value={r.bug.title} onChange={e => updateBug("title", e.target.value)}
                    style={{ ...inputStyle, background: "#fff", border: "1px solid #F7C1C1", marginBottom: "0.65rem" }} />
                  <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.65rem" }}>
                    {SEVERITIES.map(sv => (
                      <button key={sv} onClick={() => updateBug("severity", sv)}
                        style={{ flex: 1, padding: "0.35rem", borderRadius: 5,
                          border: `1px solid ${r.bug.severity === sv ? SEV_COLOR[sv] : "#F7C1C1"}`,
                          background: r.bug.severity === sv ? SEV_BG[sv] : "#fff",
                          color: r.bug.severity === sv ? SEV_COLOR[sv] : "#B4B2A9",
                          fontSize: "0.72rem", cursor: "pointer" }}>
                        {sv}
                      </button>
                    ))}
                  </div>
                  <textarea rows={2} placeholder="Steps to reproduce..." value={r.bug.steps} onChange={e => updateBug("steps", e.target.value)}
                    style={{ ...inputStyle, background: "#fff", border: "1px solid #F7C1C1", marginBottom: "0.65rem", resize: "vertical" }} />
                  <textarea rows={2} placeholder="What actually happened? *" value={r.bug.actual} onChange={e => updateBug("actual", e.target.value)}
                    style={{ ...inputStyle, background: "#fff", border: "1px solid #F7C1C1", resize: "vertical" }} />
                </div>
              )}

              {saveError && (
                <p style={{ marginTop: "0.75rem", color: "#A32D2D", fontSize: "0.8rem", background: "#FCEBEB", padding: "0.5rem 0.75rem", borderRadius: 6 }}>
                  {saveError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer nav */}
      <div style={{ background: "#fff", borderTop: "1px solid #E8E6DF", padding: "0.75rem 1.75rem", display: "flex", gap: "0.65rem", flexShrink: 0 }}>
        <button onClick={() => testIdx > 0 && setTestIdx(testIdx - 1)} disabled={testIdx === 0}
          style={{ ...btnSecondary, opacity: testIdx === 0 ? 0.4 : 1, cursor: testIdx === 0 ? "not-allowed" : "pointer" }}>← Previous</button>
        <div style={{ flex: 1 }} />
        <button onClick={goNext} disabled={!canNext || saving} style={btnPrimary(!canNext || saving)}>
          {saving ? "Saving..." : isLast ? "Finish & submit" : "Next →"}
        </button>
      </div>
    </div>
  )
}

// ─── ADMIN VIEW ────────────────────────────────────────────────────────────────

function AdminView({ onBack }) {
  const [code, setCode] = useState("")
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rowsByProject, setRowsByProject] = useState({})
  const [filterProject, setFilterProject] = useState(PROJECTS[0].id)
  const [activeTab, setActiveTab] = useState("bugs")

  const login = () => {
    if (code === ADMIN_CODE) { setAuthed(true); loadData(PROJECTS[0].id) }
    else { setError(true); setTimeout(() => setError(false), 1200) }
  }

  const loadData = async (projId) => {
    const proj = PROJECTS.find(p => p.id === projId)
    if (!proj) return
    setLoading(true)
    const rows = await fetchResults(proj.sheetTab)
    setRowsByProject(prev => ({ ...prev, [projId]: rows }))
    setLoading(false)
  }

  const handleProjectChange = (projId) => {
    setFilterProject(projId)
    if (!rowsByProject[projId]) loadData(projId)
  }

  if (!authed) return (
    <div style={{ minHeight: "100vh", background: "#F8F7F3", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 360, background: "#fff", border: "1px solid #E8E6DF", borderRadius: 12, padding: "2rem" }}>
        <p style={{ color: "#888780", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Quartz — QA Tracker</p>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 500, color: "#2C2C2A", marginBottom: "1.5rem" }}>Admin access</h2>
        <input type="password" placeholder="Admin code" value={code}
          onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === "Enter" && login()}
          style={{ ...inputStyle, border: `1px solid ${error ? "#F09595" : "#D3D1C7"}`, background: error ? "#FCEBEB" : "#fff", marginBottom: "0.75rem", transition: "all 0.2s" }} />
        <div style={{ display: "flex", gap: "0.65rem" }}>
          <button onClick={onBack} style={btnSecondary}>← Back</button>
          <button onClick={login} style={{ ...btnPrimary(false), flex: 1 }}>Enter</button>
        </div>
      </div>
    </div>
  )

  const rows = rowsByProject[filterProject] || []
  const project = PROJECTS.find(p => p.id === filterProject)

  // Group rows by tester for the testers tab
  const testerMap = {}
  rows.forEach(row => {
    if (!testerMap[row.tester]) testerMap[row.tester] = []
    testerMap[row.tester].push(row)
  })
  const testerRows = Object.entries(testerMap).map(([tester, tRows]) => ({
    tester,
    submittedAt: tRows[0]?.submittedAt,
    pass: tRows.filter(r => r.status === "pass").length,
    fail: tRows.filter(r => r.status === "fail").length,
    blocked: tRows.filter(r => r.status === "blocked").length,
    total: tRows.length,
  }))

  const bugRows = rows.filter(r => r.status === "fail")
    .sort((a, b) => SEVERITIES.indexOf(b.bugSeverity) - SEVERITIES.indexOf(a.bugSeverity))

  // Coverage: per test, count statuses across all testers (deduplicated by tester+testId, take latest)
  const latestByTesterTest = {}
  rows.forEach(row => {
    const key = `${row.tester}::${row.testId}`
    if (!latestByTesterTest[key] || row.submittedAt > latestByTesterTest[key].submittedAt) {
      latestByTesterTest[key] = row
    }
  })
  const coverageData = project ? project.tests.map(test => {
    const testRows = Object.values(latestByTesterTest).filter(r => r.testId === test.id)
    return {
      test,
      pass: testRows.filter(r => r.status === "pass").length,
      fail: testRows.filter(r => r.status === "fail").length,
      blocked: testRows.filter(r => r.status === "blocked").length,
      untested: testRows.filter(r => r.status === "untested").length,
    }
  }) : []

  const thStyle = { padding: "0.6rem 1rem", textAlign: "left", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#B4B2A9", fontWeight: 500, borderBottom: "1px solid #E8E6DF" }
  const tdStyle = { padding: "0.65rem 1rem", fontSize: "0.82rem", color: "#5F5E5A", borderBottom: "1px solid #F1EFE8", verticalAlign: "top" }

  return (
    <div style={{ height: "100vh", background: "#F8F7F3", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E8E6DF", padding: "0.75rem 1.75rem", display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", color: "#888780", cursor: "pointer", fontSize: "0.82rem", padding: 0 }}>← Exit admin</button>
        <span style={{ color: "#E8E6DF" }}>|</span>
        <span style={{ color: "#2C2C2A", fontWeight: 500, fontSize: "0.88rem" }}>Admin — QA results</span>
        <div style={{ flex: 1 }} />
        <select value={filterProject} onChange={e => handleProjectChange(e.target.value)}
          style={{ background: "#F8F7F3", border: "1px solid #D3D1C7", borderRadius: 5, padding: "0.35rem 0.65rem", color: "#5F5E5A", fontSize: "0.78rem" }}>
          {PROJECTS.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <button onClick={() => loadData(filterProject)}
          style={{ background: "#fff", border: "1px solid #D3D1C7", color: "#888780", borderRadius: 5, padding: "0.35rem 0.75rem", cursor: "pointer", fontSize: "0.75rem" }}>
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#888780", fontSize: "0.85rem" }}>Loading from Google Sheets...</div>
      ) : (
        <>
          {/* Summary strip */}
          <div style={{ display: "flex", background: "#fff", borderBottom: "1px solid #E8E6DF", flexShrink: 0 }}>
            {[
              ["Testers", testerRows.length, "#185FA5"],
              ["Bugs reported", bugRows.length, "#A32D2D"],
              ["Critical", bugRows.filter(r => r.bugSeverity === "Critical").length, "#A32D2D"],
              ["High", bugRows.filter(r => r.bugSeverity === "High").length, "#854F0B"],
              ["Tests run", coverageData.filter(c => c.pass + c.fail + c.blocked > 0).length, "#3B6D11"],
            ].map(([label, val, color], i, arr) => (
              <div key={label} style={{ flex: 1, padding: "1rem 1.5rem", borderRight: i < arr.length - 1 ? "1px solid #E8E6DF" : "none" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 500, color }}>{val}</div>
                <div style={{ fontSize: "0.68rem", color: "#B4B2A9", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", background: "#fff", borderBottom: "1px solid #E8E6DF", flexShrink: 0 }}>
            {[["bugs", "Bugs"], ["coverage", "Test coverage"], ["testers", "Testers"]].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)}
                style={{ padding: "0.65rem 1.5rem", background: "transparent", border: "none",
                  borderBottom: `2px solid ${activeTab === id ? "#2C2C2A" : "transparent"}`,
                  color: activeTab === id ? "#2C2C2A" : "#888780", cursor: "pointer",
                  fontSize: "0.82rem", fontWeight: activeTab === id ? 500 : 400 }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 1.75rem" }}>

            {activeTab === "bugs" && (
              bugRows.length === 0
                ? <div style={{ textAlign: "center", padding: "3rem", color: "#B4B2A9", fontSize: "0.85rem" }}>No failures reported yet.</div>
                : <div style={{ display: "grid", gap: "0.65rem" }}>
                  {bugRows.map((row, i) => (
                    <div key={i} style={{ background: "#fff", border: "1px solid #E8E6DF",
                      borderLeft: `3px solid ${SEV_COLOR[row.bugSeverity] || "#B4B2A9"}`, borderRadius: 8, padding: "1rem 1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.4rem" }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ color: "#2C2C2A", fontWeight: 500, fontSize: "0.88rem" }}>{row.bugTitle || "(no title)"}</span>
                          {row.bugSeverity && <span style={{ marginLeft: "0.5rem" }}><Badge label={row.bugSeverity} severity={row.bugSeverity} /></span>}
                        </div>
                        <span style={{ color: "#B4B2A9", fontSize: "0.7rem", whiteSpace: "nowrap" }}>{fmtDate(row.submittedAt)}</span>
                      </div>
                      <p style={{ color: "#B4B2A9", fontSize: "0.72rem", marginBottom: "0.5rem" }}>
                        {row.testTitle} · by <span style={{ color: "#888780" }}>{row.tester}</span>
                      </p>
                      {row.bugActual && <p style={{ color: "#5F5E5A", fontSize: "0.8rem", marginBottom: "0.2rem" }}><span style={{ color: "#B4B2A9" }}>Actual: </span>{row.bugActual}</p>}
                      {row.bugSteps && <p style={{ color: "#5F5E5A", fontSize: "0.8rem", marginBottom: "0.2rem" }}><span style={{ color: "#B4B2A9" }}>Steps: </span>{row.bugSteps}</p>}
                      {row.notes && <p style={{ color: "#5F5E5A", fontSize: "0.8rem" }}><span style={{ color: "#B4B2A9" }}>Notes: </span>{row.notes}</p>}
                    </div>
                  ))}
                </div>
            )}

            {activeTab === "coverage" && (
              <div style={{ background: "#fff", border: "1px solid #E8E6DF", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>{["Test", "Pass", "Fail", "Blocked"].map(h => <th key={h} style={{ ...thStyle, textAlign: h === "Test" ? "left" : "center" }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {coverageData.map(({ test, pass, fail, blocked }) => (
                      <tr key={test.id} style={{ background: fail > 0 ? "#FCEBEB" : "transparent" }}>
                        <td style={{ ...tdStyle, color: "#2C2C2A" }}>{test.title}</td>
                        <td style={{ ...tdStyle, textAlign: "center", color: pass > 0 ? "#3B6D11" : "#D3D1C7", fontWeight: pass > 0 ? 500 : 400 }}>{pass || "—"}</td>
                        <td style={{ ...tdStyle, textAlign: "center", color: fail > 0 ? "#A32D2D" : "#D3D1C7", fontWeight: fail > 0 ? 500 : 400 }}>{fail || "—"}</td>
                        <td style={{ ...tdStyle, textAlign: "center", color: blocked > 0 ? "#854F0B" : "#D3D1C7", fontWeight: blocked > 0 ? 500 : 400 }}>{blocked || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "testers" && (
              testerRows.length === 0
                ? <div style={{ textAlign: "center", padding: "3rem", color: "#B4B2A9", fontSize: "0.85rem" }}>No submissions yet.</div>
                : <div style={{ background: "#fff", border: "1px solid #E8E6DF", borderRadius: 8, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>{["Tester", "Pass", "Fail", "Blocked", "Progress", "Submitted"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {testerRows.map((t, i) => (
                        <tr key={i}>
                          <td style={{ ...tdStyle, color: "#2C2C2A", fontWeight: 500 }}>{t.tester}</td>
                          <td style={{ ...tdStyle, color: t.pass > 0 ? "#3B6D11" : "#D3D1C7", fontWeight: t.pass > 0 ? 500 : 400 }}>{t.pass || "—"}</td>
                          <td style={{ ...tdStyle, color: t.fail > 0 ? "#A32D2D" : "#D3D1C7", fontWeight: t.fail > 0 ? 500 : 400 }}>{t.fail || "—"}</td>
                          <td style={{ ...tdStyle, color: t.blocked > 0 ? "#854F0B" : "#D3D1C7", fontWeight: t.blocked > 0 ? 500 : 400 }}>{t.blocked || "—"}</td>
                          <td style={{ ...tdStyle, minWidth: 140 }}><ProgressBar done={t.pass + t.fail + t.blocked} total={t.total} /></td>
                          <td style={{ ...tdStyle, color: "#B4B2A9", whiteSpace: "nowrap" }}>{fmtDate(t.submittedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── ROOT ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("tester")
  return view === "admin"
    ? <AdminView onBack={() => setView("tester")} />
    : <TesterView onAdmin={() => setView("admin")} />
}
