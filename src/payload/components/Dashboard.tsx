import { Gutter } from '@payloadcms/ui/elements/Gutter'
import { DashboardClient } from './DashboardClient'
import { fetchStats, searchUsers, getCurrentAdminRole } from './actions'

export const Dashboard = async () => {
  // Fetch initial data concurrently on the server
  const [initialStats, initialUsers, currentAdminRole] = await Promise.all([
    fetchStats(),
    searchUsers(''),
    getCurrentAdminRole(),
  ])

  return (
    <div className="dashboard-wrapper" style={{ padding: '1rem 0' }}>
      <Gutter>
        <h1 className="ky-admin-page-title">پیشخوان مدیریت و کنترل پنل بوکزی</h1>
        <DashboardClient
          initialStats={initialStats} 
          initialUsers={initialUsers} 
          currentAdminRole={currentAdminRole}
        />
      </Gutter>
    </div>
  )
}
