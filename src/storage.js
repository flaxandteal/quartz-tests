import { APPS_SCRIPT_URL } from './config.js'

/**
 * Submit results via GET request (avoids CORS preflight).
 * Payload is JSON-encoded as a query parameter.
 */
export async function submitResults({ name, project, results }) {
  if (!APPS_SCRIPT_URL) {
    console.warn("APPS_SCRIPT_URL not set — results not saved.")
    return { ok: false, error: "No Apps Script URL configured." }
  }

  const rows = project.tests.map(test => {
    const r = results[test.id] || {}
    return {
      tester: name,
      submittedAt: new Date().toISOString(),
      project: project.title,
      testId: test.id,
      testTitle: test.title,
      status: r.status || "untested",
      notes: r.notes || "",
      bugTitle: r.bug?.title || "",
      bugSeverity: r.bug?.severity || "",
      bugSteps: r.bug?.steps || "",
      bugActual: r.bug?.actual || "",
    }
  })

  try {
    const payload = encodeURIComponent(JSON.stringify({ sheetTab: project.sheetTab, rows }))
    const url = `${APPS_SCRIPT_URL}?action=submit&payload=${payload}`
    await fetch(url)
    return { ok: true }
  } catch (err) {
    console.error("Submit error:", err)
    return { ok: false, error: err.message }
  }
}

/**
 * Fetch all rows for a project tab.
 */
export async function fetchResults(sheetTab) {
  if (!APPS_SCRIPT_URL) return []
  try {
    const url = `${APPS_SCRIPT_URL}?action=fetch&sheetTab=${encodeURIComponent(sheetTab)}`
    const res = await fetch(url)
    const data = await res.json()
    return data.rows || []
  } catch (err) {
    console.error("Fetch error:", err)
    return []
  }
}
