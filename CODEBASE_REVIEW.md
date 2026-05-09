# Keystone SME Codebase Review

## 1. Project Overview & Architecture
The project is a React-based web application tailored for Small and Medium Enterprises (SMEs), particularly focusing on Agro/Poultry businesses. It provides features like Khata (ledger), Receipt Scanning, Challan Generation, Inventory Management, and AI-driven insights (Loan Predictor, Agro Guide).

The architecture is a Single Page Application (SPA) built with Vite and React, served alongside a lightweight Express.js backend (`server.ts`) which acts as an API layer for specific logic (like credit scoring and SMS mock) and serves the Vite app in development/production.

## 2. Tech Stack
- **Frontend Framework:** React 19 with Vite.
- **Styling:** Tailwind CSS v4 and `framer-motion` for animations.
- **Language:** TypeScript.
- **Backend/API:** Express.js (`server.ts`).
- **Database & Auth:** Firebase (Firestore, Authentication).
- **AI Integration:** `@google/genai` (Gemini 3 Flash Preview) for NID OCR and Receipt Analysis.
- **Forms & Validation:** `react-hook-form` and `zod`.

## 3. Key Components
- **`src/App.tsx`:** Acts as the main entry point and handles routing via a state variable (`currentView`). It also manages global states like user session, theme (dark mode), and notifications.
- **`src/components/views/`:** Contains the main feature views (e.g., `Dashboard`, `KhataView`, `ReceiptScanner`, etc.).
- **`src/lib/gemini.ts`:** Encapsulates the AI logic, sending images to Gemini to extract structured JSON data for NIDs and receipts.
- **`src/lib/firebase.ts`:** Initializes Firebase and handles Firestore error reporting.

## 4. Potential Areas for Improvement
- **Routing:** Currently, navigation is managed using a state variable (`currentView`) in `App.tsx`. As the app grows, this will become difficult to maintain and doesn't support browser history, deep linking, or code splitting out of the box.
  - **Recommendation:** Implement a standard routing library like `react-router-dom` or `@tanstack/react-router`.
- **State Management:** Global states (like `profile`, `transactions`, `darkMode`, `lang`) are managed in `App.tsx` and passed down as props. This can lead to "prop drilling".
  - **Recommendation:** Use React Context or a lightweight state management library like `Zustand` or `Jotai` to manage global state.
- **API Organization:** `server.ts` handles API routes directly in the main server file.
  - **Recommendation:** If the backend grows, extract routes and controllers into a separate `routes/` or `controllers/` directory.
- **Error Handling:** While there is a `handleFirestoreError` in `firebase.ts`, the UI relies on console logs for many errors.
  - **Recommendation:** Introduce React Error Boundaries and a global toast notification system (e.g., `react-hot-toast` or `sonner`) for better user feedback on errors.
- **Code Splitting:** The entire app might be bundled into a few large chunks.
  - **Recommendation:** With a proper router, implement React's `lazy` and `Suspense` to load views only when needed.

## 5. Security & Environment
- API keys (Gemini, Google Maps) are properly managed via `.env` files and `process.env`.
- Firebase rules (`firestore.rules`) dictate database security, which is good practice. Ensure they are correctly configured for production.
