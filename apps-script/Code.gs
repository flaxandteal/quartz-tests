// ─── Quartz QA Tracker — Google Apps Script ───────────────────────────────────
//
// Paste this entire file into:
//   Extensions → Apps Script → Code.gs
//
// Then: Deploy → New deployment → Web app
//   Execute as: Me
//   Who has access: Anyone
// Copy the deployment URL and add it as VITE_APPS_SCRIPT_URL in GitHub Secrets.
//
// All requests use GET to avoid CORS preflight issues.
//   action=submit  — write rows to the sheet
//   action=fetch   — read rows back for the admin view
// ─────────────────────────────────────────────────────────────────────────────

const SHEET_ID = "1sbGYEYfJNBn2M0LbTcHYEZnR5-ahRNXr65SxppM-FqY"

const COLUMNS = [
  "Tester",
  "Submitted At",
  "Project",
  "Test ID",
  "Test Title",
  "Status",
  "Notes",
  "Bug Title",
  "Bug Severity",
  "Bug Steps",
  "Bug Actual",
]

function getOrCreateTab(ss, tabName) {
  let sheet = ss.getSheetByName(tabName)
  if (!sheet) {
    sheet = ss.insertSheet(tabName)
    sheet.appendRow(COLUMNS)
    sheet.getRange(1, 1, 1, COLUMNS.length)
      .setFontWeight("bold")
      .setBackground("#F1EFE8")
  }
  return sheet
}

// ALL requests come in as GET to avoid CORS preflight.
function doGet(e) {
  try {
    const action = e.parameter.action

    // ── Submit results ────────────────────────────────────────────────────────
    if (action === "submit") {
      const payload = JSON.parse(e.parameter.payload)
      const { sheetTab, rows } = payload

      if (!sheetTab || !Array.isArray(rows)) {
        return jsonResponse({ ok: false, error: "Missing sheetTab or rows" })
      }

      const ss = SpreadsheetApp.openById(SHEET_ID)
      const sheet = getOrCreateTab(ss, sheetTab)

      rows.forEach(row => {
        sheet.appendRow([
          row.tester,
          row.submittedAt,
          row.project,
          row.testId,
          row.testTitle,
          row.status,
          row.notes,
          row.bugTitle,
          row.bugSeverity,
          row.bugSteps,
          row.bugActual,
        ])
      })

      return jsonResponse({ ok: true, written: rows.length })
    }

    // ── Fetch results ─────────────────────────────────────────────────────────
    if (action === "fetch") {
      const sheetTab = e.parameter.sheetTab
      if (!sheetTab) {
        return jsonResponse({ ok: false, error: "Missing sheetTab parameter" })
      }

      const ss = SpreadsheetApp.openById(SHEET_ID)
      const sheet = ss.getSheetByName(sheetTab)
      if (!sheet) {
        return jsonResponse({ ok: true, rows: [] })
      }

      const data = sheet.getDataRange().getValues()
      if (data.length <= 1) {
        return jsonResponse({ ok: true, rows: [] })
      }

      const headers = data[0]
      const rows = data.slice(1).map(row => {
        const obj = {}
        headers.forEach((h, i) => {
          const key = headerToKey(h)
          obj[key] = row[i]
        })
        return obj
      })

      return jsonResponse({ ok: true, rows })
    }

    return jsonResponse({ ok: false, error: "Unknown action" })

  } catch (err) {
    return jsonResponse({ ok: false, error: err.message })
  }
}

function headerToKey(header) {
  const map = {
    "Tester":       "tester",
    "Submitted At": "submittedAt",
    "Project":      "project",
    "Test ID":      "testId",
    "Test Title":   "testTitle",
    "Status":       "status",
    "Notes":        "notes",
    "Bug Title":    "bugTitle",
    "Bug Severity": "bugSeverity",
    "Bug Steps":    "bugSteps",
    "Bug Actual":   "bugActual",
  }
  return map[header] || header
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}
