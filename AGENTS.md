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

## Temporary Tasks
- Project is currently running locally at http://localhost:5173/
- Use MCP tools to open browser directly to view and interact with the page

## Code Architecture Analysis (Current Issues)

### Current Execution Model: "Simulated Execution"
The `runTransaction` function in `useMasterChef.ts` (lines 107-205) uses a **simulated execution** pattern:

1. **Step Generation (Lines 119-192)**:
   - Creates `newSteps` array with all execution steps
   - Each step saves a snapshot of state at that point (`globalState` and `userState`)
   - Steps are generated synchronously in memory
   - Steps: A (updatePool) → B (Settlement) → C (Update Balance) → D (Reset Debt)

2. **State Update (Lines 194-201)**:
   - `setGlobalState(currentGlobal)` - Updates to **final state** immediately
   - `setUsers(...)` - Updates to **final state** immediately
   - `setUserSteps(...)` - Saves all step records
   - `setUserStepIndex(...)` - Sets step index to 0

3. **The Problem**:
   - Steps are just "records" of what happened, not real-time execution
   - React state (globalState, users) is updated to final values immediately
   - Step animation in ControlPanel is just "playback" of pre-recorded steps
   - StateCard shows final state, not intermediate state during step animation

### Why It's "Simulated" Not "Real Execution"
- All calculations happen in synchronous code
- No setTimeout/setInterval for step-by-step execution
- State updates are batched to final values
- Steps are visual decoration, not actual execution flow

### Current Architecture Diagram
```
User clicks Deposit/Withdraw
        ↓
runTransaction() executes synchronously
        ↓
Generates all steps with state snapshots
        ↓
Updates React state to FINAL values
        ↓
Saves step records for animation
        ↓
ControlPanel plays back step animation
        ↓
StateCard shows FINAL state (not step state)
```

### Key Insight
The step animation and state display are **decoupled**:
- Steps = pre-recorded execution log
- State = immediately updated to final result
- They are not synchronized

## Bug: Variable Access Arrows Incorrect

### Problem
The `VarArrows` component (`src/components/VarArrows.tsx`) shows arrows indicating variable read/write operations, but the mapping is incomplete and incorrect.

### Analysis of `LINE_VAR_MAP` vs Actual Step `lineId`

**Missing Mappings (used in steps but not in LINE_VAR_MAP):**
- `line-d-1` / `line-w-1`: Entry line (no arrow shown)
- `line-u-1`: "进入 updatePool" (no arrow shown)
- `line-u-3`: "block <= lastRewardBlock, 直接返回" (no arrow shown)

**Potentially Incorrect Mappings:**
- `line-d-4` / `line-w-4`: Currently mapped to `lastRewardBlock(read), lpSupply(read), accSushiPerShare(write)` - but this is just calling `updatePool()`, not doing the actual update
- `line-u-6`: Currently mapped to `sushiPerBlock(read), lpSupply(read)` - but the step message says "lpSupply == 0, 仅更新 lastRewardBlock"

**Correct Mappings:**
- `line-u-7`: `accSushiPerShare(write), lpSupply(read)` - correct
- `line-u-8`: `lastRewardBlock(write)` - correct
- `line-d-5` / `line-w-5`: `amount(read)` - correct
- `line-d-6`: `amount(read), accSushiPerShare(read), rewardDebt(read)` - correct
- `line-d-7`: `wallet(write)` - correct
- `line-d-9`: `amount(write), lpSupply(write)` - correct
- `line-d-10`: `amount(read), accSushiPerShare(read), rewardDebt(write)` - correct
- `line-w-7`: `amount(write), lpSupply(write)` - correct
- `line-w-8`: `amount(read), accSushiPerShare(read), rewardDebt(write)` - correct

### Task
Fix the `LINE_VAR_MAP` in `VarArrows.tsx` to correctly map variable accesses for each code line.

## Task: Simulate Debugger-like Execution Environment

### Problem Description
Currently, the right-side state display (StateCard) shows the **final state** immediately after transaction execution, not the intermediate state during step animation. This creates a disconnect between the code execution steps and the variable display.

**Current Behavior:**
- User clicks Deposit/Withdraw
- All steps are generated with state snapshots
- React state is updated to **final values** immediately
- Step animation plays back pre-recorded steps
- StateCard shows **final state** throughout the animation

**Expected Behavior (Debugger-like):**
- StateCard should show the state **at the current step**
- When execution reaches a line that modifies a variable, the right-side display should update
- When execution reaches a line that only reads a variable, the display should remain unchanged
- This creates a "real-time execution environment" feel

### Requirements

1. **Real-time State Display:**
   - StateCard should display the state corresponding to the current step
   - Variables should only update when the step actually modifies them
   - Read-only steps should not change the display

2. **Add Execution Bookends:**
   - Add "执行前" (Before Execution) step at the beginning
   - Add "执行完毕" (Execution Complete) step at the end
   - This allows users to see the state before and after the entire transaction

3. **Step Record Enhancement:**
   - Step 0: "执行前" - shows initial state before any changes
   - Steps 1-N: actual execution steps with intermediate states
   - Step N+1: "执行完毕" - shows final state after all changes

### Architecture Impact
This requires refactoring the execution model:
- Current: Steps are "records" of what happened, state is updated immediately
- New: Steps are "execution points", state is derived from current step

### Implementation Approach
1. Keep step generation as-is (with state snapshots)
2. Modify App.tsx to pass step-specific state to StateCard
3. Add "执行前" and "执行完毕" steps to the step array
4. StateCard should display state from current step, not from React state

### Files to Modify
- `src/hooks/useMasterChef.ts` - Add bookend steps
- `src/App.tsx` - Pass step state to StateCard
- `src/components/StateCard.tsx` - Display step-specific state
