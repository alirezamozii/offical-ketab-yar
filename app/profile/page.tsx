import { redirect } from 'next/navigation'

// Redirect /profile to /dashboard (profile merged into dashboard)
export default function ProfilePage() {
    redirect('/dashboard')
}
