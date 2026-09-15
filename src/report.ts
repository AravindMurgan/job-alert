import { PendingJob } from './types/company'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatPostedDate(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/London' })
}

export function buildReportHtml(jobs: PendingJob[]): string {
  const sorted = [...jobs].sort((a, b) => new Date(b.foundAt).getTime() - new Date(a.foundAt).getTime())
  const companies = [...new Set(sorted.map(j => j.company))].sort((a, b) => a.localeCompare(b))

  const rows = sorted.map(j => {
    const search = `${j.company} ${j.title} ${j.location}`.toLowerCase()
    return `
        <tr data-company="${escapeHtml(j.company)}" data-search="${escapeHtml(search)}">
          <td style="padding:6px 12px 6px 0;font-size:13px;color:#7A8FA8;white-space:nowrap;">${escapeHtml(j.company)}</td>
          <td style="padding:6px 12px 6px 0;font-size:14px;">
            <a href="${escapeHtml(j.url)}" style="color:#00BFA6;text-decoration:none;font-weight:500;">${escapeHtml(j.title)}</a>
          </td>
          <td style="padding:6px 12px 6px 0;font-size:13px;color:#7A8FA8;white-space:nowrap;">${escapeHtml(j.location)}</td>
          <td style="padding:6px 0;font-size:12px;color:#7A8FA8;white-space:nowrap;font-family:monospace;">Posted ${formatPostedDate(j.foundAt)}</td>
        </tr>`
  }).join('')

  const companyOptions = companies.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Job Alert Report</title>
</head>
<body style="margin:0;padding:0;background:#141E2B;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:900px;margin:0 auto;padding:32px 24px;">

    <div style="margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #2E3D52;">
      <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;
                  color:#00BFA6;margin-bottom:8px;">Job Alert Report</div>
      <div style="font-size:14px;color:#7A8FA8;">
        ${sorted.length} active ${sorted.length === 1 ? 'role' : 'roles'} across ${companies.length} ${companies.length === 1 ? 'company' : 'companies'}
      </div>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:16px;">
      <input id="search" type="text" placeholder="Search company, title, location..."
             style="flex:1;padding:8px 12px;font-size:14px;background:#1B2634;border:1px solid #2E3D52;color:#E8F0F6;border-radius:4px;">
      <select id="companyFilter"
              style="padding:8px 12px;font-size:14px;background:#1B2634;border:1px solid #2E3D52;color:#E8F0F6;border-radius:4px;">
        <option value="">All companies</option>
        ${companyOptions}
      </select>
    </div>

    <table style="border-collapse:collapse;width:100%;">
      <thead>
        <tr style="text-align:left;border-bottom:1px solid #2E3D52;">
          <th style="padding:6px 12px 6px 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#00BFA6;">Company</th>
          <th style="padding:6px 12px 6px 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#00BFA6;">Title</th>
          <th style="padding:6px 12px 6px 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#00BFA6;">Location</th>
          <th style="padding:6px 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#00BFA6;">Posted</th>
        </tr>
      </thead>
      <tbody id="rows">
        ${rows}
      </tbody>
    </table>

    <div id="empty" style="display:none;padding:24px 0;color:#7A8FA8;font-size:14px;">No jobs match your filters.</div>

    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #2E3D52;
                font-size:11px;color:#4A6070;font-family:monospace;letter-spacing:0.06em;">
      JOB-ALERT · GENERATED ${new Date().toISOString()}
    </div>

  </div>

  <script>
    const search = document.getElementById('search');
    const companyFilter = document.getElementById('companyFilter');
    const rows = Array.from(document.querySelectorAll('#rows tr'));
    const empty = document.getElementById('empty');

    function applyFilters() {
      const query = search.value.trim().toLowerCase();
      const company = companyFilter.value;
      let visible = 0;
      rows.forEach(row => {
        const matchesCompany = !company || row.dataset.company === company;
        const matchesSearch = !query || row.dataset.search.includes(query);
        const show = matchesCompany && matchesSearch;
        row.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      empty.style.display = visible === 0 ? '' : 'none';
    }

    search.addEventListener('input', applyFilters);
    companyFilter.addEventListener('change', applyFilters);
  </script>
</body>
</html>`
}
