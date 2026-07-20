# Architecture Reference

Full detail backing the SKILL.md workflow. Read the relevant section only.

## 1. Folder Structure

```
src/
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   └── providers/
│       ├── QueryProvider.tsx
│       └── ThemeProvider.tsx
├── pages/
│   └── <PageName>/
│       ├── <PageName>.tsx
│       └── index.ts
├── features/
│   └── <feature-name>/
│       ├── components/
│       ├── hooks/
│       ├── api/
│       ├── types.ts
│       └── index.ts
├── components/
│   ├── ui/
│   └── layout/
├── hooks/
├── lib/
│   ├── api-client.ts
│   └── queryClient.ts
├── store/
├── utils/
├── types/
├── assets/
├── styles/
│   └── index.css
├── main.tsx
└── vite-env.d.ts
```

Rules:
- Feature folders are self-contained. Other features must not import another feature's internals directly — only through its `index.ts` public exports, and only if truly necessary (prefer composing at the page level instead).
- `components/ui` = zero business logic, fully generic (Button, Card, Modal, Input).
- `components/layout` = structural (Header, Sidebar, PageWrapper) — may know about routes/auth state but not domain data.

## 2. Component Categories

1. **UI Primitives** — `components/ui/`. No business logic.
2. **Layout** — `components/layout/`. Page structure.
3. **Feature components** — `features/*/components/`. Business logic, tied to one domain.
4. **Pages** — `pages/`. Compose features + layout, minimal own logic.

Conventions:
- One component per file, PascalCase filename = component name.
- Co-locate styles/tests/stories.
- Extract subcomponents/hooks once a component exceeds ~200 lines.

```
Button/
├── Button.tsx
├── Button.test.tsx
├── Button.stories.tsx
└── index.ts
```

## 3. Styling (Tailwind)

- Utility classes directly in JSX for most styling.
- Design tokens (colors, spacing, fonts) centralized in `tailwind.config.js`.
- Conditional/variant classes via `clsx` + `tailwind-merge`, or `class-variance-authority` for components with many variants.
- CSS Modules only for animations/styles Tailwind can't express cleanly.
- Avoid `@apply` sprawl — repeated utility combos become components, not custom CSS classes.

Example config excerpt:
```js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { primary: { 50: '#eff6ff', 500: '#3b82f6', 900: '#1e3a8a' } },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
```

## 4. State Management

| State type | Tool | Example |
|---|---|---|
| Server/remote | TanStack Query | API data, caching, refetch |
| Global client | Zustand | Auth session, theme, UI toggles |
| Local | `useState`/`useReducer` | Form inputs, modal open/close |
| URL | React Router search params | Filters, pagination, tabs |

Zustand slice pattern:
```ts
// store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

React Query hook pattern (inside a feature):
```ts
// features/users/hooks/useUsersQuery.ts
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../api/users';

export function useUsersQuery() {
  return useQuery({ queryKey: ['users'], queryFn: getUsers });
}
```

## 5. Routing

- Centralized route config in `app/routes.tsx`.
- Lazy-load route components with `React.lazy` + `Suspense`.
- Protected routes wrapped in a guard component.

```tsx
const routes = [
  { path: '/', element: <Home /> },
  { path: '/dashboard', element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
];
```

## 6. API Layer

- Single typed client in `lib/api-client.ts` (Axios instance with interceptors for auth headers + error handling).
- Each feature's `api/` folder defines functions using that client.
- Validate responses with Zod schemas where the contract matters (auth, payments, anything with financial/security impact at minimum).
- All fetching happens through React Query hooks — components never call `api/` functions directly.

```ts
// lib/api-client.ts
import axios from 'axios';

export const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_URL });

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().user?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

## 7. Forms

- React Hook Form for form state, Zod for schema validation, `@hookform/resolvers` to connect them.

```tsx
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

## 8. Build Config

- Path aliases: `@/*` → `src/*` in both `vite.config.ts` and `tsconfig.json`.
- Env vars prefixed `VITE_` to be exposed client-side.

```ts
// vite.config.ts
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
```

## 9. Code Quality & Testing

- ESLint (React hooks rules, import order) + Prettier, enforced via Husky + lint-staged pre-commit.
- TypeScript strict mode on.
- Vitest + React Testing Library for unit/component tests.
- Playwright for E2E, run in CI on merge to main.

## 10. Review Checklist (for existing codebases)

When reviewing code against this architecture, check:
- [ ] Feature folders self-contained, no reaching into another feature's internals
- [ ] Server data goes through React Query, not manual `useEffect` + `fetch`
- [ ] Global client state in Zustand, not prop-drilled or duplicated Context providers
- [ ] Pages contain composition only, not business logic or direct API calls
- [ ] Tailwind classes not duplicated excessively without being extracted to a component
- [ ] API calls centralized through `lib/api-client.ts`, not ad-hoc `axios`/`fetch` calls scattered in components