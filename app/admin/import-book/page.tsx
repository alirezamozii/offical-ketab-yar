'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'

/**
 * PLAIN TEXT BOOK IMPORTER
 * 
 * This tool converts plain text into the compact JSON format
 * that Sanity expects, making it easy to add books without
 * manually writing JSON.
 */

export default function ImportBookPage() {
    const [bookData, setBookData] = useState({
        titleEn: '',
        titleFa: '',
        author: '',
        summaryEn: '',
        summaryFa: '',
        year: new Date().getFullYear(),
        genres: '',
        level: 'intermediate',
    })

    const [chapters, setChapters] = useState<Array<{
        titleEn: string
        titleFa: string
        contentEn: string
        contentFa: string
    }>>([
        { titleEn: '', titleFa: '', contentEn: '', contentFa: '' }
    ])

    const [generatedJSON, setGeneratedJSON] = useState('')

    const addChapter = () => {
        setChapters([...chapters, { titleEn: '', titleFa: '', contentEn: '', contentFa: '' }])
    }

    const updateChapter = (index: number, field: string, value: string) => {
        const updated = [...chapters]
        updated[index] = { ...updated[index], [field]: value }
        setChapters(updated)
    }

    const generateJSON = () => {
        // Split content into paragraphs (by double newline)
        const convertedChapters = chapters.map((chapter, chapterIndex) => {
            const englishParagraphs = chapter.contentEn
                .split('\n\n')
                .filter(p => p.trim())

            const farsiParagraphs = chapter.contentFa
                .split('\n\n')
                .filter(p => p.trim())

            // Create pages (every 3 paragraphs = 1 page)
            const pages = []
            const paragraphsPerPage = 3

            for (let i = 0; i < Math.max(englishParagraphs.length, farsiParagraphs.length); i += paragraphsPerPage) {
                const pageItems = []

                // Add chapter heading on first page
                if (i === 0 && chapter.titleEn) {
                    pageItems.push({
                        h: {
                            e: chapter.titleEn,
                            f: chapter.titleFa || chapter.titleEn
                        }
                    })
                }

                // Add paragraphs
                for (let j = 0; j < paragraphsPerPage; j++) {
                    const paraIndex = i + j
                    if (paraIndex < englishParagraphs.length || paraIndex < farsiParagraphs.length) {
                        pageItems.push({
                            t: {
                                e: englishParagraphs[paraIndex] || '',
                                f: farsiParagraphs[paraIndex] || englishParagraphs[paraIndex] || ''
                            }
                        })
                    }
                }

                if (pageItems.length > 0) {
                    pages.push({
                        pg: pages.length + 1,
                        i: pageItems
                    })
                }
            }

            return {
                n: chapterIndex + 1,
                t: {
                    e: chapter.titleEn || `Chapter ${chapterIndex + 1}`,
                    f: chapter.titleFa || chapter.titleEn || `فصل ${chapterIndex + 1}`
                },
                p: pages
            }
        })

        const compactJSON = {
            b: {
                t: {
                    e: bookData.titleEn,
                    f: bookData.titleFa || bookData.titleEn
                },
                a: bookData.author,
                s: {
                    e: bookData.summaryEn,
                    f: bookData.summaryFa || bookData.summaryEn
                },
                y: bookData.year,
                g: bookData.genres.split(',').map(g => g.trim()).filter(Boolean),
                l: bookData.level
            },
            c: convertedChapters
        }

        const jsonString = JSON.stringify(compactJSON, null, 2)
        setGeneratedJSON(jsonString)
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedJSON)
        alert('✅ JSON copied to clipboard! Now paste it into Sanity Studio.')
    }

    return (
        <div className="container max-w-6xl mx-auto py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">📚 Plain Text Book Importer</h1>
                <p className="text-muted-foreground">
                    Convert your plain text book into Sanity's compact JSON format
                </p>
            </div>

            {/* Book Metadata */}
            <Card>
                <CardHeader>
                    <CardTitle>Book Information</CardTitle>
                    <CardDescription>Basic metadata about your book</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Title (English)</Label>
                            <Input
                                value={bookData.titleEn}
                                onChange={(e) => setBookData({ ...bookData, titleEn: e.target.value })}
                                placeholder="The Great Gatsby"
                            />
                        </div>
                        <div>
                            <Label>Title (Farsi)</Label>
                            <Input
                                value={bookData.titleFa}
                                onChange={(e) => setBookData({ ...bookData, titleFa: e.target.value })}
                                placeholder="گتسبی بزرگ"
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Author</Label>
                        <Input
                            value={bookData.author}
                            onChange={(e) => setBookData({ ...bookData, author: e.target.value })}
                            placeholder="F. Scott Fitzgerald"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Summary (English)</Label>
                            <Textarea
                                value={bookData.summaryEn}
                                onChange={(e) => setBookData({ ...bookData, summaryEn: e.target.value })}
                                placeholder="A story about..."
                                rows={3}
                            />
                        </div>
                        <div>
                            <Label>Summary (Farsi)</Label>
                            <Textarea
                                value={bookData.summaryFa}
                                onChange={(e) => setBookData({ ...bookData, summaryFa: e.target.value })}
                                placeholder="داستانی درباره..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label>Year</Label>
                            <Input
                                type="number"
                                value={bookData.year}
                                onChange={(e) => setBookData({ ...bookData, year: parseInt(e.target.value) })}
                            />
                        </div>
                        <div>
                            <Label>Genres (comma-separated)</Label>
                            <Input
                                value={bookData.genres}
                                onChange={(e) => setBookData({ ...bookData, genres: e.target.value })}
                                placeholder="Fiction, Classic, Romance"
                            />
                        </div>
                        <div>
                            <Label>Level</Label>
                            <select
                                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                value={bookData.level}
                                onChange={(e) => setBookData({ ...bookData, level: e.target.value })}
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Chapters */}
            {chapters.map((chapter, index) => (
                <Card key={index}>
                    <CardHeader>
                        <CardTitle>Chapter {index + 1}</CardTitle>
                        <CardDescription>
                            Paste your plain text here. Separate paragraphs with double line breaks (Enter twice).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Chapter Title (English)</Label>
                                <Input
                                    value={chapter.titleEn}
                                    onChange={(e) => updateChapter(index, 'titleEn', e.target.value)}
                                    placeholder="The Beginning"
                                />
                            </div>
                            <div>
                                <Label>Chapter Title (Farsi)</Label>
                                <Input
                                    value={chapter.titleFa}
                                    onChange={(e) => updateChapter(index, 'titleFa', e.target.value)}
                                    placeholder="آغاز"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Content (English)</Label>
                                <Textarea
                                    value={chapter.contentEn}
                                    onChange={(e) => updateChapter(index, 'contentEn', e.target.value)}
                                    placeholder="Paste your English text here...

Separate paragraphs with double line breaks.

Like this."
                                    rows={15}
                                    className="font-mono text-sm"
                                />
                            </div>
                            <div>
                                <Label>Content (Farsi)</Label>
                                <Textarea
                                    value={chapter.contentFa}
                                    onChange={(e) => updateChapter(index, 'contentFa', e.target.value)}
                                    placeholder="متن فارسی خود را اینجا بچسبانید...

پاراگراف‌ها را با دو خط جدا کنید.

مثل این."
                                    rows={15}
                                    className="font-mono text-sm"
                                    dir="rtl"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            <Button onClick={addChapter} variant="outline" className="w-full">
                + Add Another Chapter
            </Button>

            {/* Generate Button */}
            <Card>
                <CardContent className="pt-6">
                    <Button onClick={generateJSON} size="lg" className="w-full">
                        🎯 Generate Compact JSON
                    </Button>
                </CardContent>
            </Card>

            {/* Generated JSON */}
            {generatedJSON && (
                <Card>
                    <CardHeader>
                        <CardTitle>✅ Generated JSON</CardTitle>
                        <CardDescription>
                            Copy this and paste it into the "Book Content (Compact JSON)" field in Sanity Studio
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            value={generatedJSON}
                            readOnly
                            rows={20}
                            className="font-mono text-xs"
                        />
                        <div className="flex gap-4">
                            <Button onClick={copyToClipboard} className="flex-1">
                                📋 Copy to Clipboard
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => window.open('/Studio', '_blank')}
                                className="flex-1"
                            >
                                🚀 Open Sanity Studio
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle>📖 How to Use</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Step 1:</strong> Fill in the book information above</p>
                    <p><strong>Step 2:</strong> Paste your plain text content (English and Farsi)</p>
                    <p><strong>Step 3:</strong> Click "Generate Compact JSON"</p>
                    <p><strong>Step 4:</strong> Click "Copy to Clipboard"</p>
                    <p><strong>Step 5:</strong> Go to Sanity Studio (/Studio)</p>
                    <p><strong>Step 6:</strong> Create new "Book (Compact Format)"</p>
                    <p><strong>Step 7:</strong> Paste the JSON into "Book Content" field</p>
                    <p><strong>Step 8:</strong> Set status to "Published" and save</p>
                </CardContent>
            </Card>
        </div>
    )
}
