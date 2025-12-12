'use client'

import { Box, Button, Card, Flex, Stack, Text } from '@sanity/ui'
import { useCallback, useState } from 'react'
import { set, StringInputProps, unset } from 'sanity'

/**
 * PLAIN TEXT TO COMPACT JSON CONVERTER
 * 
 * Custom Sanity input component that:
 * 1. Shows a textarea for pasting plain text from AI
 * 2. Converts plain text to compact JSON automatically
 * 3. Validates the conversion
 * 4. Shows preview of what will be stored
 */

interface ParsedItem {
    type: 'heading' | 'text'
    english: string
    farsi: string
}

interface ParsedPage {
    pageNumber: number
    items: ParsedItem[]
}

interface ParsedChapter {
    number: number
    titleEn: string
    titleFa: string
    pages: ParsedPage[]
}

function parsePlainTextToCompactJSON(plainText: string): string {
    const lines = plainText.split('\n')
    const chapters: ParsedChapter[] = []

    let currentChapter: ParsedChapter | null = null
    let currentPage: ParsedPage | null = null
    let currentPageNumber = 1
    let pendingEnglish: string | null = null
    let isHeading = false

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        // Skip empty lines
        if (!line) {
            continue
        }

        // Check for chapter heading
        if (line.startsWith('Chapter ')) {
            const chapterTitleEn = line.replace(/^Chapter \d+:\s*/, '')
            const chapterTitleFa = lines[i + 1]?.trim() || chapterTitleEn
            const chapterNumber = parseInt(line.match(/Chapter (\d+)/)?.[1] || '1')

            currentChapter = {
                number: chapterNumber,
                titleEn: chapterTitleEn,
                titleFa: chapterTitleFa,
                pages: []
            }

            chapters.push(currentChapter)

            // Create first page for this chapter
            currentPage = {
                pageNumber: currentPageNumber,
                items: []
            }
            currentChapter.pages.push(currentPage)

            i++ // Skip the Farsi title line
            continue
        }

        // Check for page marker
        if (line.startsWith('Page:')) {
            currentPageNumber = parseInt(line.replace('Page:', '').trim())

            if (currentChapter) {
                currentPage = {
                    pageNumber: currentPageNumber,
                    items: []
                }
                currentChapter.pages.push(currentPage)
            }
            continue
        }

        // Check if this is a heading (has [h] tag)
        if (line.startsWith('[h] ')) {
            isHeading = true
            pendingEnglish = line.replace('[h] ', '').trim()
            continue
        }

        // Process English/Farsi pairs
        if (!pendingEnglish) {
            // This is an English line
            pendingEnglish = line
        } else {
            // This is the Farsi translation
            const farsi = line

            if (currentPage) {
                currentPage.items.push({
                    type: isHeading ? 'heading' : 'text',
                    english: pendingEnglish,
                    farsi: farsi
                })
            }

            pendingEnglish = null
            isHeading = false
        }
    }

    // Convert to compact JSON format
    const compactJSON = {
        c: chapters.map(chapter => ({
            n: chapter.number,
            t: {
                e: chapter.titleEn,
                f: chapter.titleFa
            },
            p: chapter.pages.map(page => ({
                pg: page.pageNumber,
                i: page.items.map(item => {
                    if (item.type === 'heading') {
                        return {
                            h: {
                                e: item.english,
                                f: item.farsi
                            }
                        }
                    } else {
                        return {
                            t: {
                                e: item.english,
                                f: item.farsi
                            }
                        }
                    }
                })
            }))
        }))
    }

    return JSON.stringify(compactJSON, null, 2)
}

export function PlainTextBookInput(props: StringInputProps) {
    const { onChange, value } = props
    const [plainText, setPlainText] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [preview, setPreview] = useState<{ chapters: number; pages: number; items: number } | null>(null)

    const handleConvert = useCallback(() => {
        try {
            setError(null)
            setSuccess(false)
            setPreview(null)

            if (!plainText.trim()) {
                setError('Please paste plain text content first')
                return
            }

            // Convert plain text to compact JSON
            const compactJSON = parsePlainTextToCompactJSON(plainText)

            // Parse to get stats
            const parsed = JSON.parse(compactJSON)
            const chapters = parsed.c.length
            const pages = parsed.c.reduce((sum: number, ch: { p: unknown[] }) => sum + ch.p.length, 0)
            const items = parsed.c.reduce((sum: number, ch: { p: { i: unknown[] }[] }) =>
                sum + ch.p.reduce((pSum: number, p: { i: unknown[] }) => pSum + p.i.length, 0), 0
            )

            setPreview({ chapters, pages, items })

            // Update Sanity field
            onChange(set(compactJSON))
            setSuccess(true)

        } catch (err) {
            console.error('Conversion error:', err)
            setError(`Conversion failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
    }, [plainText, onChange])

    const handleClear = useCallback(() => {
        setPlainText('')
        setError(null)
        setSuccess(false)
        setPreview(null)
        onChange(unset())
    }, [onChange])

    return (
        <Stack space={4}>
            {/* Instructions */}
            <Card padding={3} radius={2} shadow={1} tone="primary">
                <Stack space={3}>
                    <Text size={1} weight="semibold">📝 How to use:</Text>
                    <Text size={1}>
                        1. Get translated content from AI (ChatGPT/Claude)<br />
                        2. Copy the plain text<br />
                        3. Paste it in the box below<br />
                        4. Click "Convert to JSON"<br />
                        5. Done! The book content is ready
                    </Text>
                </Stack>
            </Card>

            {/* Plain Text Input */}
            <Stack space={2}>
                <Text size={1} weight="semibold">Paste Plain Text Here:</Text>
                <textarea
                    value={plainText}
                    onChange={(e) => setPlainText(e.target.value)}
                    placeholder={`Chapter 1: The Discovery
فصل اول: کشف

[h] The Morning
صبح

The morning mist clung to Meadow Creek.
مه صبحگاهی به میدو کریک چسبیده بود.

Page: 2

Next paragraph here.
پاراگراف بعدی اینجا.`}
                    rows={15}
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        resize: 'vertical'
                    }}
                />
            </Stack>

            {/* Action Buttons */}
            <Flex gap={2}>
                <Button
                    text="🪄 Convert to JSON"
                    tone="primary"
                    onClick={handleConvert}
                    disabled={!plainText.trim()}
                />
                <Button
                    text="Clear"
                    tone="critical"
                    mode="ghost"
                    onClick={handleClear}
                    disabled={!plainText && !value}
                />
            </Flex>

            {/* Success Message */}
            {success && preview && (
                <Card padding={3} radius={2} tone="positive">
                    <Stack space={2}>
                        <Text size={1} weight="semibold">✅ Conversion Successful!</Text>
                        <Text size={1}>
                            📚 {preview.chapters} chapter{preview.chapters > 1 ? 's' : ''}<br />
                            📄 {preview.pages} page{preview.pages > 1 ? 's' : ''}<br />
                            📝 {preview.items} paragraph{preview.items > 1 ? 's' : ''}/heading{preview.items > 1 ? 's' : ''}
                        </Text>
                        <Text size={1} muted>
                            The compact JSON has been saved. You can now publish this book.
                        </Text>
                    </Stack>
                </Card>
            )}

            {/* Error Message */}
            {error && (
                <Card padding={3} radius={2} tone="critical">
                    <Stack space={2}>
                        <Text size={1} weight="semibold">❌ Error</Text>
                        <Text size={1}>{error}</Text>
                        <Text size={1} muted>
                            Make sure your plain text follows the correct format:<br />
                            - Chapter headings: "Chapter X: Title"<br />
                            - Headings: "[h] Heading Text"<br />
                            - Page markers: "Page: X"<br />
                            - Each English line followed by Farsi translation
                        </Text>
                    </Stack>
                </Card>
            )}

            {/* Current Value Preview */}
            {value && (
                <Card padding={3} radius={2} tone="transparent" border>
                    <Stack space={2}>
                        <Text size={1} weight="semibold">📦 Stored JSON (Preview):</Text>
                        <Box style={{ maxHeight: '200px', overflow: 'auto' }}>
                            <pre style={{
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}>
                                {typeof value === 'string' ? value.substring(0, 500) + (value.length > 500 ? '...' : '') : ''}
                            </pre>
                        </Box>
                    </Stack>
                </Card>
            )}
        </Stack>
    )
}
