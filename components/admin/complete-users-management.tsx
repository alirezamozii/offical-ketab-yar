'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
    banUser,
    createTestUser,
    exportUsersToCSV,
    getAllUsers,
    makeUserAdmin,
    removeUserAdmin,
    unbanUser,
    type UserProfile,
} from '@/lib/supabase/admin-actions'
import { Download, Mail, Search, ShieldCheck, ShieldOff, UserCheck, UserPlus, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function CompleteUsersManagement() {
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all')
    const [bannedFilter, setBannedFilter] = useState<string>('all')

    // Dialogs
    const [banDialog, setBanDialog] = useState<{ open: boolean; user: UserProfile | null }>({ open: false, user: null })
    const [banReason, setBanReason] = useState('')
    const [createTestDialog, setCreateTestDialog] = useState(false)
    const [testUserData, setTestUserData] = useState({ email: '', password: '', fullName: '' })

    useEffect(() => {
        fetchUsers()
    }, [roleFilter, subscriptionFilter, bannedFilter, searchQuery])

    async function fetchUsers() {
        try {
            setLoading(true)
            const filters: Record<string, string | boolean> = {}

            if (roleFilter !== 'all') filters.role = roleFilter
            if (subscriptionFilter !== 'all') filters.subscription = subscriptionFilter
            if (bannedFilter !== 'all') filters.banned = bannedFilter === 'banned'
            if (searchQuery) filters.search = searchQuery

            const data = await getAllUsers(filters)
            setUsers(data)
        } catch (error) {
            console.error('Error fetching users:', error)
            toast.error('Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    async function handleBanUser() {
        if (!banDialog.user) return

        try {
            await banUser(banDialog.user.id, banReason)
            toast.success(`User ${banDialog.user.email} has been banned`)
            setBanDialog({ open: false, user: null })
            setBanReason('')
            fetchUsers()
        } catch (error) {
            console.error('Error banning user:', error)
            toast.error('Failed to ban user')
        }
    }

    async function handleUnbanUser(user: UserProfile) {
        try {
            await unbanUser(user.id)
            toast.success(`User ${user.email} has been unbanned`)
            fetchUsers()
        } catch (error) {
            console.error('Error unbanning user:', error)
            toast.error('Failed to unban user')
        }
    }

    async function handleMakeAdmin(user: UserProfile) {
        if (!confirm(`Are you sure you want to make ${user.email} an admin?`)) return

        try {
            await makeUserAdmin(user.id)
            toast.success(`${user.email} is now an admin`)
            fetchUsers()
        } catch (error) {
            console.error('Error making admin:', error)
            toast.error('Failed to make user admin')
        }
    }

    async function handleRemoveAdmin(user: UserProfile) {
        if (!confirm(`Are you sure you want to remove admin role from ${user.email}?`)) return

        try {
            await removeUserAdmin(user.id)
            toast.success(`Admin role removed from ${user.email}`)
            fetchUsers()
        } catch (error) {
            console.error('Error removing admin:', error)
            toast.error('Failed to remove admin role')
        }
    }

    async function handleCreateTestUser() {
        if (!testUserData.email || !testUserData.password || !testUserData.fullName) {
            toast.error('Please fill all fields')
            return
        }

        try {
            await createTestUser(testUserData.email, testUserData.password, testUserData.fullName)
            toast.success('Test user created successfully')
            setCreateTestDialog(false)
            setTestUserData({ email: '', password: '', fullName: '' })
            fetchUsers()
        } catch (error) {
            console.error('Error creating test user:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to create test user')
        }
    }

    async function handleExportCSV() {
        try {
            const csv = await exportUsersToCSV()
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
            a.click()
            toast.success('Users exported successfully')
        } catch (error) {
            console.error('Error exporting:', error)
            toast.error('Failed to export users')
        }
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Search & Filter Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <div className="relative lg:col-span-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by email or name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="test_user">Test User</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Subscription" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Subscriptions</SelectItem>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="annual">Annual</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={bannedFilter} onValueChange={setBannedFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="banned">Banned</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <Button onClick={() => setCreateTestDialog(true)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Create Test User
                        </Button>
                        <Button variant="outline" onClick={handleExportCSV}>
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Users ({users.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No users found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Subscription</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                {user.full_name || user.username || 'No name'}
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        user.role === 'admin'
                                                            ? 'default'
                                                            : user.role === 'test_user'
                                                                ? 'secondary'
                                                                : 'outline'
                                                    }
                                                >
                                                    {user.role === 'test_user' ? 'Test User' : user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        user.subscription_status === 'active' ? 'default' : 'outline'
                                                    }
                                                >
                                                    {user.subscription_tier}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.is_banned ? (
                                                    <Badge variant="destructive">Banned</Badge>
                                                ) : (
                                                    <Badge variant="default">Active</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    {user.is_banned ? (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleUnbanUser(user)}
                                                            title="Unban user"
                                                        >
                                                            <UserCheck className="h-4 w-4 text-green-600" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setBanDialog({ open: true, user })}
                                                            title="Ban user"
                                                        >
                                                            <UserX className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    )}

                                                    {user.role === 'admin' ? (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleRemoveAdmin(user)}
                                                            title="Remove admin"
                                                        >
                                                            <ShieldOff className="h-4 w-4 text-orange-600" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleMakeAdmin(user)}
                                                            title="Make admin"
                                                        >
                                                            <ShieldCheck className="h-4 w-4 text-blue-600" />
                                                        </Button>
                                                    )}

                                                    <Button size="sm" variant="ghost" title="Send email">
                                                        <Mail className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Ban User Dialog */}
            <Dialog open={banDialog.open} onOpenChange={(open) => setBanDialog({ open, user: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ban User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to ban {banDialog.user?.email}? They will not be able to access the
                            platform.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="reason">Reason for ban</Label>
                            <Textarea
                                id="reason"
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                placeholder="Enter reason for banning this user..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBanDialog({ open: false, user: null })}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleBanUser}>
                            Ban User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Test User Dialog */}
            <Dialog open={createTestDialog} onOpenChange={setCreateTestDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Test User</DialogTitle>
                        <DialogDescription>
                            Create a test account with unlimited premium features. Test users cannot access admin panel.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="test-email">Email</Label>
                            <Input
                                id="test-email"
                                type="email"
                                value={testUserData.email}
                                onChange={(e) => setTestUserData({ ...testUserData, email: e.target.value })}
                                placeholder="test@example.com"
                            />
                        </div>
                        <div>
                            <Label htmlFor="test-password">Password</Label>
                            <Input
                                id="test-password"
                                type="password"
                                value={testUserData.password}
                                onChange={(e) => setTestUserData({ ...testUserData, password: e.target.value })}
                                placeholder="Minimum 6 characters"
                            />
                        </div>
                        <div>
                            <Label htmlFor="test-name">Full Name</Label>
                            <Input
                                id="test-name"
                                value={testUserData.fullName}
                                onChange={(e) => setTestUserData({ ...testUserData, fullName: e.target.value })}
                                placeholder="Test User"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateTestDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateTestUser}>Create Test User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
