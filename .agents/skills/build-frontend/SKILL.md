---
name: build-frontend
description: Scaffold and develop frontend applications using React, Vite, and Tailwind CSS following a consistent feature-based architecture (React Query for server state, Zustand for client state, React Hook Form + Zod for forms, React Router for routing). Use this skill whenever the user asks to start a new React/Vite/Tailwind project, add a new feature or page, create a component, set up routing/state/API layers, or wants their frontend code organized consistently — even if they don't explicitly mention "architecture" or name this skill. Also use when reviewing or refactoring existing React+Vite+Tailwind code for structure/consistency.
---

# React + Vite + Tailwind Dev

Scaffolds and extends frontend apps using a fixed, opinionated architecture: feature-based folders, Tailwind for styling, TanStack Query for server state, Zustand for client state, React Hook Form + Zod for forms, React Router for routing.

Always follow this architecture unless the user explicitly asks for a different stack/pattern. Don't ask which state library to use, etc. — these are fixed defaults, not choices to re-litigate per task.

## When to consult the reference file

Read `references/architecture.md` before doing any of the following, since it has the full folder layout, naming conventions, and code patterns:
- Scaffolding a brand-new project
- Adding a new feature/domain
- Creating a new page or route
- Setting up state management, API client, or forms
- Reviewing existing code for structural consistency

For a single trivial ask (e.g. "add a Tailwind class to this button"), you don't need the reference file — just do it.

## Workflow

### 1. New project scaffold
1. Read `references/architecture.md`.
2. Run: `npm create vite@latest <name> -- --template react-ts`
3. Install deps: `react-router-dom`, `@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`, `@hookform/resolvers`, `axios`, `clsx`, `tailwind-merge`.
4. Install & init Tailwind (`tailwindcss`, `postcss`, `autoprefixer`) per current Tailwind docs — always verify exact install steps with the tailwindcss install guide since CLI commands change between major versions; don't assume from memory.
5. Build the folder skeleton exactly as described in the reference file (`app/`, `pages/`, `features/`, `components/`, `hooks/`, `lib/`, `store/`, `utils/`, `types/`, `styles/`).
6. Set up path aliases (`@/*`) in both `vite.config.ts` and `tsconfig.json`.
7. Wire up `QueryProvider` and `App` router shell.

### 2. Adding a new feature
1. Create `src/features/<feature-name>/` with `components/`, `hooks/`, `api/`, `types.ts`, `index.ts`.
2. API calls go in `api/`, wrapped by React Query hooks in `hooks/`.
3. Feature-specific UI goes in `components/`; anything reusable across features gets promoted to `src/components/ui/`.
4. A page in `src/pages/` composes the feature into a route — pages stay thin (composition only, no business logic).

### 3. Adding a component
- Decide the category first (UI primitive / layout / feature / page) — see reference file section 2.
- One component per file, PascalCase, co-locate test + story if the project uses Storybook.
- Style with Tailwind utility classes directly; use `clsx`/`tailwind-merge` for conditional variants. Don't reach for `@apply` unless there's a real repeated pattern that can't be a component.

### 4. State management decision
Ask internally: does this data come from the server?
- Yes → React Query (`useQuery`/`useMutation`) in the feature's `hooks/`.
- No, but shared across features → Zustand slice in `src/store/`.
- No, local to one component → `useState`/`useReducer`.

### 5. Reviewing existing code
Check against `references/architecture.md` for: correct folder placement, feature isolation (no cross-feature imports of internals), state living in the right layer, and Tailwind usage patterns. Flag violations concretely (file + what to move/change), don't just say "doesn't match architecture."

## Output expectations

- Always produce real files via the file-creation tools, not just code in chat — this is a scaffolding/dev skill, the deliverable is working files.
- After scaffolding, briefly list what was created (tree view) rather than pasting every file's full contents into the chat.
- If the user's request conflicts with the architecture (e.g. asks for Redux), do what they ask but note the deviation from default.