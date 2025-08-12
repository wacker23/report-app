# Copilot Instructions for stlas-v2 (AS Report App)

## Project Overview
- This is a React web application for AS (After Service) report management, bootstrapped with Create React App.
- Main features: address-based reporting, photo uploads, voice-to-text input, and dashboard/map views.
- Firebase is used for authentication, Firestore database, and file storage (see `src/components/DB.js`).
- The app is containerized for deployment using Docker (see `Dockerfile`).

## Key Components & Data Flow
- **src/components/AddReport.js**: Main form for submitting AS reports. Handles voice-to-text (SpeechRecognition), file uploads to Firebase Storage, and form submission to Firestore.
- **src/components/Dashboard.js**: Main dashboard UI, includes navigation, logout, and map/search views.
- **src/components/DB.js**: Centralizes Firebase initialization and exports `db`, `storage`, and `auth` for use throughout the app.
- **src/components/Map.js**, **SearchList.js**, **Login.js**: Support location, search, and authentication workflows.

## Developer Workflows
- **Start development server**: `npm start` (runs on http://localhost:3000)
- **Run tests**: `npm test` (Jest, see `src/setupTests.js`)
- **Build for production**: `npm run build` (outputs to `build/`)
- **Docker build & run**: Use the provided `Dockerfile` to build and serve the production build with `serve`.
- **Firebase config**: Uses environment variables prefixed with `REACT_APP_FIREBASE_` (see `.env` and `DB.js`).

## Project-Specific Patterns & Conventions
- **Voice-to-text fields**: Use `FaMicrophone` icons and `handleSTT` for toggling speech recognition. The transcript is set directly to the field while listening.
- **Photo uploads**: Use `<input type="file" multiple accept="image/*" />` for uploads. Camera integration is optional and can be removed for file-only uploads.
- **Firestore data model**: Reports are stored in the `asAddress` collection with nested photo URLs and metadata.
- **Styling**: CSS files are in `src/styles/`. Use class-based and inline styles as seen in components.
- **Routing**: Uses `react-router-dom` for navigation and passing state (e.g., address info).
- **Environment variables**: Sensitive Firebase config is loaded from `.env` and not hardcoded.

## Integration Points
- **Firebase**: All data and file storage is via Firestore and Firebase Storage. Auth is via Firebase Auth.
- **SpeechRecognition**: Used for voice input in form fields (see AddReport.js).
- **Docker**: Multi-stage build for production, runs with non-root user and exposes port 3000.

## Examples & Patterns
- To add a new form field with voice-to-text:
  ```jsx
  <input type="text" value={field} onChange={...} />
  <FaMicrophone onClick={() => handleSTT(setField, "fieldName")} ... />
  ```
- To upload files to Firebase Storage:
  See `uploadFiles` function in `AddReport.js`.
- To add a new Firestore collection or document:
  Use `addDoc(collection(db, "collectionName"), data)`.

## References
- For build/test commands, see `README.md`.
- For Firebase setup, see `src/components/DB.js`.
- For Docker deployment, see `Dockerfile`.

---
If any section is unclear or missing, please provide feedback so this guide can be improved for your team.
