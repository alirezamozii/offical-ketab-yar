import { Gutter } from '@payloadcms/ui/elements/Gutter'
import { DashboardClient } from './DashboardClient'
import { fetchStats, searchUsers } from './actions'

export const Dashboard = async () => {
  // Fetch initial data on the server
  const initialStats = await fetchStats()
  const initialUsers = await searchUsers('')

  return (
    <div className="dashboard-wrapper" style={{ padding: '1rem 0' }}>
      <Gutter>
        <h1 style={{ 
          marginBottom: '1.5rem', 
          fontFamily: 'Vazirmatn, sans-serif', 
          fontSize: '2rem', 
          fontWeight: 'bold',
          color: 'var(--payload-color-primary-500, #f4d35e)',
          textAlign: 'right'
        }}>
          پیشخوان مدیریت و کنترل پنل کتاب‌یار
        </h1>
        <DashboardClient initialStats={initialStats} initialUsers={initialUsers} />
      </Gutter>
    </div>
  )
}
