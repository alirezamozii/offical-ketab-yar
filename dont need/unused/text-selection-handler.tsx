"use client"

import { useState, useEffect } from "react"

import { motion, AnimatePresence } from "framer-motion"
import { Copy, Highlighter, Languages, BookmarkPlus, VolumeIcon as VolumeUp } from "lucide-react"

import { cn } from "@/lib/utils"

interface TextSelectionHandlerProps {
  onTranslate: (text: string) => void
  onHighlight: (text: string) => void
  onCopy: (text: string) => void
  onBookmark?: (text: string) => void
  onSpeak?: (text: string) => void
}

export function TextSelectionHandler({
  onTranslate,
  onHighlight,
  onCopy,
  onBookmark,
  onSpeak,
}: TextSelectionHandlerProps) {
  const [selectedText, setSelectedText] = useState("")
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection()
      if (selection && selection.toString().trim().length > 0) {
        const text = selection.toString().trim()
        setSelectedText(text)

        // محاسبه موقعیت پاپ‌آپ
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        })
        setShowPopup(true)
      } else {
        setShowPopup(false)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(".selection-popup")) {
        setShowPopup(false)
      }
    }

    document.addEventListener("selectionchange", handleSelectionChange)
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  if (!showPopup) return null

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={cn(
            "bg-background fixed z-50 flex items-center justify-center gap-2 rounded-lg p-2 shadow-lg",
            "transition-transform duration-200 ease-in-out"
          )}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="flex items-center p-1">
            <button
              className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                onTranslate(selectedText)
                setShowPopup(false)
              }}
              title="ترجمه"
            >
              <Languages className="size-4" />
            </button>
            <button
              className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                onHighlight(selectedText)
                setShowPopup(false)
              }}
              title="هایلایت"
            >
              <Highlighter className="size-4" />
            </button>
            <button
              className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                onCopy(selectedText)
                setShowPopup(false)
              }}
              title="کپی"
            >
              <Copy className="size-4" />
            </button>
            {onBookmark && (
              <button
                className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => {
                  onBookmark(selectedText)
                  setShowPopup(false)
                }}
                title="ذخیره به عنوان یادداشت"
              >
                <BookmarkPlus className="size-4" />
              </button>
            )}
            {onSpeak && (
              <button
                className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => {
                  onSpeak(selectedText)
                  setShowPopup(false)
                }}
                title="خواندن متن"
              >
                <VolumeUp className="size-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
