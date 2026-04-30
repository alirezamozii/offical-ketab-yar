'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Eye, EyeOff, Plus, RefreshCw, Trash2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface APIKey {
    id: string
    key: string
    name: string | null
    is_active: boolean
    usage_count: number
    error_count: number
    last_used_at: string | null
    created_at: string
    notes: string | null
}

export function AIKeysManager() {
    const [keys, setKeys] = useState<APIKey[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

    // Form state
    const [newKey, setNewKey] = useState('')
    const [newName, setNewName] = useState('')
    const [newNotes, setNewNotes] = useState('')

    const supabase = createClient()

    useEffect(() => {
        fetchKeys()
    }, [])

    async function fetchKeys() {
        try {
            const { data, error } = await supabase
                .from('gemini_api_keys')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            setKeys(data || [])
        } catch (error) {
            console.error('Error fetching keys:', error)
            toast.error('Failed to load API keys')
        } finally {
            setLoading(false)
        }
    }

    async function addKey() {
        if (!newKey.trim()) {
            toast.error('Please enter an API key')
            return
        }

        try {
            const { error } = await supabase
                .from('gemini_api_keys')
                .insert({
                    key: newKey.trim( as any),
                    name: newName.trim() || null,
                    notes: newNotes.trim() || null,
                    is_active: true
                })

            if (error) throw error

            toast.success('API key added successfully')
            setNewKey('')
            setNewName('')
            setNewNotes('')
            setShowAddForm(false)
            fetchKeys()
        } catch (error) {
            console.error('Error adding key:', error)
            if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
                toast.error('This API key already exists')
            } else {
                toast.error('Failed to add API key')
            }
        }
    }

    async function toggleKeyStatus(id: string, currentStatus: boolean) {
        try {
            const { error } = await supabase
                .from('gemini_api_keys')
                .update({ is_active: !currentStatus } as any)
                .eq('id', id)

            if (error) throw error

            toast.success(`API key ${!currentStatus ? 'activated' : 'deactivated'}`)
            fetchKeys()
        } catch (error) {
            console.error('Error toggling key:', error)
            toast.error('Failed to update API key')
        }
    }

    async function resetKeyErrors(id: string) {
        try {
            const { error } = await supabase
                .from('gemini_api_keys')
                .update({
                    error_count: 0,
                    is_active: true
                } as any)
                .eq('id', id)

            if (error) throw error

            toast.success('Error count reset')
            fetchKeys()
        } catch (error) {
            console.error('Error resetting key:', error)
            toast.error('Failed to reset errors')
        }
    }

    async function deleteKey(id: string) {
        if (!confirm('Are you sure you want to delete this API key?')) return

        try {
            const { error } = await supabase
                .from('gemini_api_keys')
                .delete()
                .eq('id', id)

            if (error) throw error

            toast.success('API key deleted')
            fetchKeys()
        } catch (error) {
            console.error('Error deleting key:', error)
            toast.error('Failed to delete API key')
        }
    }

    function toggleKeyVisibility(id: string) {
        setVisibleKeys(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    function maskKey(key: string): string {
        if (key.length <= 8) return '••••••••'
        return key.slice(0, 4) + '••••••••' + key.slice(-4)
    }

    if (loading) {
        return <div className="text-center py-8">Loading...</div>
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Total Keys</div>
                    <div className="text-2xl font-bold">{keys.length}</div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Active Keys</div>
                    <div className="text-2xl font-bold text-green-600">
                        {keys.filter(k => k.is_active).length}
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Total Usage</div>
                    <div className="text-2xl font-bold">
                        {keys.reduce((sum, k) => sum + k.usage_count, 0)}
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Total Errors</div>
                    <div className="text-2xl font-bold text-red-600">
                        {keys.reduce((sum, k) => sum + k.error_count, 0)}
                    </div>
                </Card>
            </div>

            {/* Add Key Button */}
            <div>
                <Button onClick={() => setShowAddForm(!showAddForm)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New API Key
                </Button>
            </div>

            {/* Add Key Form */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Add New API Key</h3>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="key">API Key *</Label>
                                    <Input
                                        id="key"
                                        type="password"
                                        value={newKey}
                                        onChange={(e) => setNewKey(e.target.value)}
                                        placeholder="AIzaSy..."
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="name">Name (Optional)</Label>
                                    <Input
                                        id="name"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="e.g., Production Key 1"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="notes">Notes (Optional)</Label>
                                    <Textarea
                                        id="notes"
                                        value={newNotes}
                                        onChange={(e) => setNewNotes(e.target.value)}
                                        placeholder="Any notes about this key..."
                                        rows={3}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={addKey}>Add Key</Button>
                                    <Button variant="outline" onClick={() => setShowAddForm(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Keys List */}
            <div className="space-y-4">
                {keys.length === 0 ? (
                    <Card className="p-8 text-center text-muted-foreground">
                        No API keys added yet. Add your first key to get started.
                    </Card>
                ) : (
                    keys.map((key) => (
                        <Card key={key.id} className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-3">
                                    {/* Header */}
                                    <div className="flex items-center gap-3">
                                        {key.is_active ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-600" />
                                        )}
                                        <div>
                                            <h4 className="font-semibold">
                                                {key.name || 'Unnamed Key'}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                                Added {new Date(key.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* API Key */}
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono">
                                            {visibleKeys.has(key.id) ? key.key : maskKey(key.key)}
                                        </code>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleKeyVisibility(key.id)}
                                        >
                                            {visibleKeys.has(key.id) ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Usage:</span>{' '}
                                            <span className="font-medium">{key.usage_count}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Errors:</span>{' '}
                                            <span className={key.error_count > 5 ? 'font-medium text-red-600' : 'font-medium'}>
                                                {key.error_count}
                                            </span>
                                        </div>
                                        {key.last_used_at && (
                                            <div>
                                                <span className="text-muted-foreground">Last used:</span>{' '}
                                                <span className="font-medium">
                                                    {new Date(key.last_used_at).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    {key.notes && (
                                        <p className="text-sm text-muted-foreground">{key.notes}</p>
                                    )}

                                    {/* Status Badge */}
                                    <div>
                                        <Badge variant={key.is_active ? 'default' : 'secondary'}>
                                            {key.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                        {key.error_count > 10 && (
                                            <Badge variant="destructive" className="ml-2">
                                                High Error Rate
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2">
                                    <Switch
                                        checked={key.is_active}
                                        onCheckedChange={() => toggleKeyStatus(key.id, key.is_active)}
                                    />
                                    {key.error_count > 0 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => resetKeyErrors(key.id)}
                                        >
                                            <RefreshCw className="h-4 w-4 mr-1" />
                                            Reset Errors
                                        </Button>
                                    )}
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => deleteKey(key.id)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Info */}
            <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-2">How it works:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• The system automatically rotates between active keys</li>
                    <li>• Least-used keys are prioritized</li>
                    <li>• If a key fails, the system tries the next one</li>
                    <li>• Keys with high error rates are automatically deactivated</li>
                    <li>• The fallback key from .env.local is used if all database keys fail</li>
                </ul>
            </Card>
        </div>
    )
}
