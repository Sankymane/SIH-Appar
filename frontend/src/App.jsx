import { useEffect } from 'react'
import { navigate, useRoute } from './lib/router.jsx'
import { useSession } from './state/Session.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import AicteDashboard from './pages/AicteDashboard.jsx'
import AicteFlagged from './pages/AicteFlagged.jsx'
import AicteAudit from './pages/AicteAudit.jsx'
import InstitutionsExplorer from './pages/InstitutionsExplorer.jsx'
import InstitutionOverview from './pages/InstitutionOverview.jsx'
import InstitutionStudents from './pages/InstitutionStudents.jsx'
import InstitutionUpload from './pages/InstitutionUpload.jsx'
import StudentProfile from './pages/StudentProfile.jsx'
import Verifier from './pages/Verifier.jsx'

// Which role may open each signed-in page
const PROTECTED = {
  '/aicte': { role: 'aicte', page: AicteDashboard },
  '/aicte/institutions': { role: 'aicte', page: InstitutionsExplorer },
  '/aicte/flagged': { role: 'aicte', page: AicteFlagged },
  '/aicte/audit': { role: 'aicte', page: AicteAudit },
  '/institution': { role: 'institution', page: InstitutionOverview },
  '/institution/students': { role: 'institution', page: InstitutionStudents },
  '/institution/upload': { role: 'institution', page: InstitutionUpload },
  '/student': { role: 'student', page: StudentProfile },
}

function RedirectToLogin({ role, next }) {
  useEffect(() => {
    navigate(`/login?as=${role}&next=${encodeURIComponent(next)}`)
  }, [role, next])
  return null
}

export default function App() {
  const { path, params } = useRoute()
  const { account } = useSession()

  const guarded = PROTECTED[path]
  if (guarded) {
    if (account?.role !== guarded.role) return <RedirectToLogin role={guarded.role} next={path} />
    const Page = guarded.page
    // key: remount when switching accounts
    return <Page key={`${account.role}:${account.aicteId ?? account.apaarId}`} account={account} path={path} params={params} />
  }

  switch (path) {
    case '/login':
      return <Login key={params.toString()} params={params} />
    case '/institutions':
      return <InstitutionsExplorer account={null} path={path} params={params} />
    case '/verify':
      // key forces a fresh page when a new code arrives via the URL
      return <Verifier key={params.toString()} params={params} />
    default:
      return <Home />
  }
}
