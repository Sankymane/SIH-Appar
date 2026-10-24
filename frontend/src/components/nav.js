// Menu-bar items for each signed-in role. `to` = route; items without `to` are
// shown greyed out as "coming later".
const NAVS = {
  aicte: [
    { label: 'National overview', to: '/aicte' },
    { label: 'Institutions & intake', to: '/aicte/institutions' },
    { label: 'Flagged records', to: '/aicte/flagged' },
    { label: 'Audit trail', to: '/aicte/audit' },
    { label: 'Verify a student', to: '/verify' },
  ],
  institution: [
    { label: 'Overview', to: '/institution' },
    { label: 'Students', to: '/institution/students' },
    { label: 'Upload student data', to: '/institution/upload' },
  ],
  student: [{ label: 'My record & consent', to: '/student' }],
  public: [
    { label: 'Home', to: '/' },
    { label: 'Approved institutions', to: '/institutions' },
    { label: 'Verify a student', to: '/verify' },
  ],
}

export function navFor(role, path) {
  return (NAVS[role] ?? []).map((n) => ({ ...n, active: n.to === path }))
}
