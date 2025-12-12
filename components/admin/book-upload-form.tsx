'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, FileText, Upload } from 'lucide-react'
import { useState } from 'react'

export function BookUploadForm() {
    const [isUploading, setIsUploading] = useState(false)
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const handleUpload = async () => {
        setIsUploading(true)
        setUploadStatus('idle')

        try {
            // TODO: Implement actual upload logic
            await new Promise(resolve => setTimeout(resolve, 2000))
            setUploadStatus('success')
            setMessage('Book uploaded successfully!')
        } catch (error) {
            setUploadStatus('error')
            setMessage('Failed to upload book. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Book
                </CardTitle>
                <CardDescription>
                    Upload book content and metadata. For now, please use Sanity Studio for full book management.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {uploadStatus === 'success' && (
                    <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>{message}</AlertDescription>
                    </Alert>
                )}

                {uploadStatus === 'error' && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{message}</AlertDescription>
                    </Alert>
                )}

                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                        This feature is under development. Please use Sanity Studio to manage books.
                    </p>
                    <Button
                        onClick={handleUpload}
                        disabled={isUploading}
                    >
                        {isUploading ? 'Uploading...' : 'Upload Book'}
                    </Button>
                </div>

                <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-2">Quick Access</h3>
                    <Button variant="outline" asChild className="w-full">
                        <a href="/Studio" target="_blank" rel="noopener noreferrer">
                            Open Sanity Studio
                        </a>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
