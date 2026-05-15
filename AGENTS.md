# AGENTS.md — SushiSwap Pool Simulator

## Project Overview
React + TypeScript frontend for visualizing and simulating SushiSwap MasterChef pool mechanics (stake, harvest, emergency withdraw, auto-play rounds).

## Tech Stack
- React 18, TypeScript, Vite
- TailwindCSS, framer-motion, lucide-react, ethers.js

## Build & Dev
```bash
npm run dev       # Vite dev server (port 5173)
npm run build     # Production build to dist/
npm run preview   # Preview production build
```

## TypeScript Config (Strict)
`tsconfig.json` has these enabled — they WILL cause compile errors:
- `noUnusedLocals`
- `noUnusedParameters`
- `verbatimModuleSyntax`

All imports must be used. No default imports for project hooks — use named imports.

## Entry Point
- `index.html` → `<div id="app">` (NOT "root")
- `src/main.tsx` mounts React app to `document.getElementById("app")`

## Key Files
| File | Role |
|------|------|
| `src/main.tsx` | Entry point, mounts App to `#app` |
| `src/App.tsx` | Top-level layout, orchestrates hooks + components |
| `src/hooks/useMasterChef.ts` | Core state machine: pool state, stake/harvest/withdraw logic, auto-play |
| `src/components/ControlPanel.tsx` | User input buttons and sliders |
| `src/components/StateCard.tsx` | Displays current pool state values |
| `src/components/CodeSection.tsx` | Shows Solidity code references |
| `src/index.css` | TailwindCSS imports + global styles |

## Code Conventions
- Use named imports for project hooks: `import { useMasterChef } from './hooks/useMasterChef'`
- Do NOT import lucide-react icons that aren't used (compile error)
- Do NOT leave unused variables or parameters (compile error)
- Use `framer-motion` for animations
- Tailwind utility classes for styling (no CSS modules)
