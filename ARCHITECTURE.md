# ARCHITECTURE.md

Engineering decisions, patterns, and preferences for the Zenith frontend.

---

## Data flow

```
External backend API  ←→  axios instance  ←→  React Query (client components)
                                          ←→  Server Actions (mutations / forms)
RSC (server components)   →  fetch directly (no axios, no React Query)
```

Client components read data via React Query + axios. Mutations go through Server Actions. RSC pages fetch directly on the server — no client state layer needed.

---

## Axios instance

A single typed axios instance lives at `lib/api.ts`. All client-side HTTP calls import from there — never call `axios.create()` or `axios.get()` directly from a component or hook.

```ts
// lib/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// attach auth token interceptor here, not in components
api.interceptors.request.use((config) => {
  // e.g. attach session token from cookie/store
  return config;
});
```

---

## React Query

Wrap the app in a `QueryClientProvider` inside a client boundary component (`components/providers.tsx`) that is imported into the root layout.

- Use `useQuery` for reads from client components.
- Use `useMutation` for client-initiated calls that don't fit a form (e.g. cancel booking button).
- Query keys follow the pattern `["resource", id?, filters?]` — define them as constants in the feature's `queries.ts` file, not inline.
- Prefer `staleTime` on queries that back Google Calendar data; calendar events don't need to refetch on every focus.

---

## Server Actions

Server Actions handle all form submissions and data mutations that originate from form elements.

- **Location**: co-located `actions.ts` inside the feature's app directory (e.g. `app/bookings/actions.ts`).
- Mark with `"use server"` at the top of the file, not per-function.
- Always validate input with a zod schema at the top of the action — the same schema is shared with the react-hook-form `resolver` on the client.
- Return a discriminated union `{ success: true, data } | { success: false, error: string }` — never throw from a server action.
- Server actions that need to call the external backend use the axios instance via a server-side import (the instance can be used in server context; just don't attach `withCredentials` behaviour that only makes sense in the browser).

---

## Forms

Use **react-hook-form** with a **zod resolver**. Define the zod schema once and use it for both the RHF resolver and the server action validation.

```ts
// schema lives alongside the feature, e.g. app/bookings/schema.ts
import { z } from "zod";

export const bookingSchema = z.object({
  name: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
```

```tsx
// in the client form component
const form = useForm<BookingInput>({ resolver: zodResolver(bookingSchema) });

// action receives and re-validates
export async function createBooking(input: BookingInput) {
  "use server";
  const parsed = bookingSchema.safeParse(input);
  ...
}
```

---

## Avoiding `useEffect`

`useEffect` is a last resort, not a default tool. Prefer:

| Instead of useEffect for… | Use… |
|---|---|
| Fetching data on mount | `useQuery` (client) or RSC (server) |
| Responding to a form submission | Server Action or `useMutation` |
| Deriving state from props/state | Compute inline during render |
| Subscribing to browser APIs | A dedicated custom hook in `hooks/` that hides the effect |
| Running logic after navigation | Route handlers or `useRouter` callbacks |

If a `useEffect` cannot be avoided (e.g. third-party imperative SDK), isolate it inside a custom hook in `hooks/` — never write one directly in a page or feature component.

---

## Component rules

- **Server Components by default.** Add `"use client"` only when the component needs interactivity, browser APIs, or React Query hooks.
- Keep client boundaries as deep (leaf) as possible — pass serialisable data down from RSC rather than fetching again on the client.
- Feature components live inside the `app/` route they belong to. Only promote to `components/` when shared across two or more routes.
- `components/ui/` is exclusively for shadcn-generated primitives. Do not add hand-written components there.

---

## File naming

| Artefact | Convention |
|---|---|
| Pages | `app/[route]/page.tsx` |
| Layouts | `app/[route]/layout.tsx` |
| Server Actions | `app/[route]/actions.ts` |
| Zod schemas | `app/[route]/schema.ts` |
| React Query keys + fetchers | `app/[route]/queries.ts` |
| Shared utilities | `lib/*.ts` |
| Shared hooks | `hooks/use-*.ts` |

---

## Environment variables

- `NEXT_PUBLIC_API_URL` — base URL for the external backend, consumed by the axios instance.
- Google OAuth credentials and any server-only secrets must not be prefixed with `NEXT_PUBLIC_`.
