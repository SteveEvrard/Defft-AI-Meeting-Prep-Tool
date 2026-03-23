# Meeting Prep Tool Prototype

Desktop-first React + TypeScript prototype for a Defft feature that helps packaging distribution reps prepare for customer and prospect meetings.

## Authentication

The app is locked behind Firebase Authentication. Users can sign in with an approved Defft email/password account or continue with Google from the existing sign-in screen.

1. Copy `.env.example` to `.env.local`
2. Set the Firebase web app values from your project:
   `VITE_FIREBASE_API_KEY`
   `VITE_FIREBASE_AUTH_DOMAIN`
   `VITE_FIREBASE_PROJECT_ID`
   `VITE_FIREBASE_STORAGE_BUCKET`
   `VITE_FIREBASE_MESSAGING_SENDER_ID`
   `VITE_FIREBASE_APP_ID`
3. Set `VITE_GOOGLE_CLIENT_ID` for Google sign-in
4. Optionally set `VITE_FIREBASE_MEASUREMENT_ID`
5. Optionally set `VITE_COMPANY_BRIEF_ENDPOINT` to a backend endpoint that returns AI-enriched company snapshots for the selected meeting domain

Important Firebase requirements:

- Enable `Email/Password` and `Google` in Firebase Authentication
- Add `localhost` to Firebase Authentication authorized domains for local development
- Pre-create any email/password users in Firebase Authentication because this app does not expose sign-up
- Google sign-in uses Google Identity Services on the existing sign-in page and only allows users with `@defft.ai` email addresses
- The company snapshot card can call an optional backend enrichment endpoint; secrets for AI or research APIs should stay on that backend, not in the browser

Firebase manages the browser session, restores it on refresh, and clears access on sign-out.

## What is included

- Calendar-style upcoming meetings sidebar with 5 seeded meetings
- Selected meeting detail view with mock integration metadata
- AI-style prep report generated from modular mock data sources
- Existing customer and prospect logic paths
- Polished demo UI with loading, empty, summary, and action states

## Architecture

The app is intentionally split so the prototype can later move into the broader Defft product with minimal rewrite.

- `src/components`: reusable UI primitives such as cards, badges, and source pills
- `src/features/calendar`: top bar and calendar-oriented controls
- `src/features/meetings`: meeting list and selected meeting header
- `src/features/report`: report presentation, right rail, and generating state
- `src/data/mock`: seed data grouped by account, meeting, commercial, and market domains
- `src/types`: production-minded domain types for meetings, accounts, CRM, ERP, supplier, and intelligence data
- `src/lib`: report generation logic that combines the datasets into a rep-ready briefing
- `src/adapters`: connector interfaces and mock connector registry for future integrations

## Report generation

`src/lib/report-generator.ts` is the main orchestration layer. It:

1. Resolves the meeting, account, and contacts
2. Pulls related purchase history, quote activity, CRM notes, supplier promotions, catalog data, industry trends, and account news
3. Applies different logic for existing customers vs prospects
4. Produces a structured prep report with source-backed recommendations

## Future connector plug-in points

The prototype already includes adapter interfaces in `src/adapters/connectors.ts`.

- Calendar connector: replace `getUpcomingMeetings()` with Google or Microsoft calendar sync
- CRM connector: map account, contact, note, and opportunity payloads from Salesforce, HubSpot, or another CRM
- ERP connector: map order and quote data from ERP APIs into the `PurchaseOrder` and `QuoteActivity` types
- Supplier connector: ingest promotions, product metadata, and program rules from supplier feeds
- Intelligence connector: swap mock trend/news data for external news, market research, or enrichment APIs

Because the report generator consumes typed repository data rather than raw API responses, each future connector only needs to normalize its source into the domain models.
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
# Defft-AI-Meeting-Prep-Tool
