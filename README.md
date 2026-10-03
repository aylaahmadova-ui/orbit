# 🌌 Orbit — 3D Personal Relationship Web

Orbit is a local-first, interactive 3D web application that visualizes personal relationships as a glowing, explorable network. You sit as the central node ("YOU") at the origin, with everyone else orbiting around you.

Relationship strength dynamically controls how bright, close, and prominent each person and connection appear in the 3D void.

---

## ✨ Features

- **Cinematic 3D Visual Engine**: Three.js WebGL + CSS2D labels, glow halos, curved connections with traveling light pulses, parallax dust particles, and out-of-focus bokeh flares.
- **Post-Processing**: Bloom glow, vignette, and subtle film grain overlay.
- **Relationship Strength Formula**: Pure unit-tested formula considering closeness rating (1–5), contact frequency, recency decay, and category floors (`partner`, `family`).
- **3D Physics Layout**: `d3-force-3d` layout with radial target forces, collision avoidance, and 3D shell constraints.
- **Interactive Controls**: Orbit/pan/zoom, hover raycast highlights, click-to-focus camera fly-to, search (`/`), and node drag & pinning.
- **Local-First & Offline**: All data persists in `localStorage` with full JSON Export and Import capabilities.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)

### Installation & Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Run Vitest unit tests
npm run test

# Build for production
npm run build
```

---

## 🛠️ Tech Stack

- **Vite + TypeScript**
- **Three.js** (WebGL, CSS2DRenderer, EffectComposer, UnrealBloomPass)
- **d3-force-3d** (3D Physics Layout)
- **Vitest** (Unit Testing)
