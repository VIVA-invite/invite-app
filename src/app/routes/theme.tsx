/**
 * User enter the theme of the party (spooky etc.)
 */
import { useEffect, useState } from "react"
import { Card, CardContent } from "src/app/components/ui/card"
import { Input } from "src/app/components/ui/input"
import PillButton from "src/app/utils/pillButton"
import { useInvitation } from "../utils/invitationContext" // context holding event info

const vibeTags = {
  colors: ["Pastel", "Neon", "Monochrome", "Gold & Glitter"],
  moods: ["Romantic", "Spooky", "Classy", "Chill", "Dreamy", "Playful"],
  music: ["Lo-fi", "Dance Pop", "Classical", "Indie"],
  style: ["Cottagecore", "Retro", "Sci-fi", "Fairytale", "Minimalist"]
}

const STORAGE_KEY = "viva:theme"

export default function Theme() {
  const { theme, setTheme } = useInvitation()
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTheme, setCustomTheme] = useState("")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as {
          selectedTags?: string[]
          customTheme?: string
        }
        if (Array.isArray(saved.selectedTags)) setSelectedTags(saved.selectedTags)
        if (typeof saved.customTheme === "string") setCustomTheme(saved.customTheme)
      }
    } catch {
      // ignore
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ selectedTags, customTheme })
    )
    setTheme([...selectedTags, ...(customTheme ? [customTheme] : [])])
  }, [hydrated, selectedTags, customTheme, setTheme])

  // 刷新 / 关闭前：清除 localStorage
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem(STORAGE_KEY)
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const getSuggestion = () => {
    if (selectedTags.includes("Romantic") && selectedTags.includes("Red")) {
      return "Sounds like you’re going for a Valentine’s Day vibe! Want to switch your Party Type?"
    }
    if (selectedTags.includes("Spooky")) {
      return "Is this a Halloween party? You might want to update your Party Type!"
    }
    return null
  }

  const suggestion = getSuggestion()

  const handleReset = () => {
    setSelectedTags([])
    setCustomTheme("")
    setTheme([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Pick Your Party Theme</h1>
      <p className="text-muted-foreground">What kind of vibe are you going for?</p>

      {Object.entries(vibeTags).map(([group, tags]) => (
        <div key={group}>
          <h2 className="text-xl font-semibold capitalize mt-4 mb-2">{group}</h2>
          <div className="flex flex-wrap gap-3">
            {tags.map(tag => (
              <PillButton
                key={tag}
                onClick={() => toggleTag(tag)}
                isSelected={selectedTags.includes(tag)}
              >
                {tag}
              </PillButton>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-6">
        <h2 className="text-lg font-medium mb-2">Custom Theme Description (optional)</h2>
        <Input
          placeholder="e.g. Pink Galaxy Pajama Party"
          value={customTheme}
          onChange={e => setCustomTheme(e.target.value)}
        />
      </div>

      {suggestion && (
        <Card className="mt-4 border-dashed border-2 border-pink-500 animate-pulse">
          <CardContent className="p-4 text-pink-700">
            {suggestion}
          </CardContent>
        </Card>
      )}

      {/* Moodboard Preview */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Your Theme Vibe Preview</h2>
        <div className="border rounded-xl p-4 bg-muted text-muted-foreground">
          {selectedTags.length === 0 && !customTheme ? (
            <p>No vibes selected yet! Pick a few tags or write your own above ✨</p>
          ) : (
            <div className="space-y-2">
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <PillButton
                      key={tag}
                      isSelected
                      onClick={() => toggleTag(tag)} // clicking removes it
                    >
                      {tag}
                    </PillButton>
                  ))}
                </div>
              )}
              {customTheme && (
                <p>
                  <strong>Description:</strong> {customTheme}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-6 right-6 flex gap-2">
        <PillButton to="/">Home</PillButton>
        <PillButton type="button" onClick={handleReset}>
          Reset
        </PillButton>
        <PillButton to="/dateTime">Next</PillButton>
      </div>
    </div>
  )
}
