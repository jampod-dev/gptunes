# GPTunes

**AI-Powered Playlist Generation**

GPTunes transforms natural language descriptions into curated playlists using Google's Gemini AI. Simply describe the vibe, mood, or style you're looking for, and GPTunes creates a personalized playlist in seconds. GPTunes leverages Google Gemini AI for:

1. **Natural Language Understanding**: Parses complex, contextual playlist descriptions
2. **Musical Context**: Understands mood, genre, era, cultural references, and activities
3. **Smart Curation**: Generates diverse, coherent track lists with reasoning
4. **Iterative Refinement**: Maintains context across multiple refinement requests
5. **Playlist Naming**: Creates creative, relevant playlist titles

---

## Features

- **Natural Language Playlist Creation**: Describe your playlist in plain English - from "late-night lo-fi for coding in Tokyo cafés" to "up-tempo Quebec fiddle tunes that aren't on every tourist mix"
- **AI-Powered Curation**: Leverages Google Gemini AI to understand context, mood, and musical preferences
- **Intelligent Refinement**: Iteratively refine playlists with additional instructions without starting over
- **Interactive Preview**: Play 30-second previews of tracks before saving
- **Drag-and-Drop Reordering**: Customize track order with intuitive drag-and-drop interface
- **Smart Recommendations**: AI explains why each track was selected for your playlist

---

## Usage

1. **Describe Your Playlist**: Enter a description of what you're looking for
    - Example: _"Rainy bus rides in Seattle, 1997"_
    - Example: _"High-energy workout music with 80s synth vibes"_

2. **AI Generation**: Google Gemini analyzes your description and generates a playlist
    - Understands context, mood, genre, era, and cultural references
    - Provides reasoning for each track selection

3. **Preview & Refine**: Listen to tracks and refine the playlist
    - Add/remove tracks manually
    - Request modifications: _"More upbeat"_, _"Add some acoustic versions"_
    - Reorder tracks by dragging

---

### Technologies

- Nuxt 3
- Vue 3
- TypeScript

### AI & APIs

- **Google Gemini API** - Advanced AI for natural language understanding and music curation
- **YouTube & Spotify Web APIs** - Music search 
- **YouTube & Spotify Embed API** - In-app track previews

---

## Usage Examples

### Mood-Based Playlists

```
"Cozy autumn evening with a book and tea"
"Confident energy for a job interview"
"Nostalgic summer road trip vibes"
```

### Genre & Era Specific

```
"90s alternative rock without the overplayed hits"
"Modern jazz fusion with electronic elements"
"Classic soul that would fit in a Tarantino film"
```

### Activity-Based

```
"Focus music for deep work - no lyrics, minimal percussion"
"High-energy cardio workout, 160+ BPM"
"Dinner party background music, sophisticated but not boring"
```

### Cultural & Contextual

```
"Songs that sound like driving through Tokyo at night"
"French café music that's not cliché"
"Eastern European metal polka"
```
