/**
 * User enter the theme of the party (spooky etc.)
 */
import { useState } from "react"
import { Button } from "src/app/components/ui/button"
import { Card, CardContent } from "src/app/components/ui/card"
import { Input } from "src/app/components/ui/input"
import { cn } from "src/app/lib/utils"
import PillButton from "src/app/utils/pillButton"

const vibeTags = {
  colors: ["Pastel", "Neon", "Monochrome", "Gold & Glitter"],
  moods: ["Romantic", "Spooky", "Classy", "Chill", "Dreamy", "Playful"],
  music: ["Lo-fi", "Dance Pop", "Classical", "Indie"],
  style: ["Cottagecore", "Retro", "Sci-fi", "Fairytale", "Minimalist"]
}

export default function Theme() {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTheme, setCustomTheme] = useState("")

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

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Pick Your Party Theme</h1>
      <p className="text-muted-foreground">What kind of vibe are you going for?</p>

      {Object.entries(vibeTags).map(([group, tags]) => (
        <div key={group}>
          <h2 className="text-xl font-semibold capitalize mt-4 mb-2">{group}</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Button
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                onClick={() => toggleTag(tag)}
                className={cn("rounded-full px-4 py-2 text-sm")}
              >
                {tag}
              </Button>
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
            <div>
              <p><strong>Tags:</strong> {selectedTags.join(", ")}</p>
              {customTheme && <p><strong>Description:</strong> {customTheme}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-right">
        <PillButton to="/">Home</PillButton>
        <PillButton to="/dateTime">Next</PillButton>
      </div>
    </div>
  )
}
