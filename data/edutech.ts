import { CompanyConfig } from '../src/types/company'

// UK Skilled Worker visa-sponsoring edutech companies
// Sources: Home Office sponsor register + ATS discovery
//
// Unsupported ATS (no scraper yet — revisit if coverage needed):
//   Kaplan International        → HireHive        (kp-uk.hirehive.com)
//   FutureLearn                 → Workable         (apply.workable.com/futurelearn-ltd)
//   Cambridge UP&A              → Hireserve        (careers.cambridge.org)
//   The Open University         → SAP SuccessFactors (jobs.open.ac.uk)
//   Springpod                   → Teamtailor       (yourfuture.springpod.com)
//   Ellucian                    → iCIMS            (jobs-ellucian.icims.com)
//   Tribal Group                → Formstack        (no central job board)
//   Unit4                       → SmartRecruiters  (api: api.smartrecruiters.com/v1/companies/unit44/postings)

export const edutechCompanies: CompanyConfig[] = [
  // ── Greenhouse ────────────────────────────────────────────────────────────
  { type: 'greenhouse', name: 'Coursera', slug: 'coursera', enabled: true, schedule: 'fast' },

  // ── Oracle HCM ───────────────────────────────────────────────────────────
  // Pearson global Oracle instance — country filter (GB) applied in scraper
  {
    type: 'oracle', name: 'Pearson', schedule: 'fast', enabled: true,
    domain: 'hccz.fa.em3.oraclecloud.com', siteNumber: 'CX_2',
    keyword: 'software engineer', locationId: '',
  },
]
