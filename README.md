# Ranch Hand 🐴

A service tracking and billing reference app for ranch owners/staff (Admins) and horse owners (Users).

> **Billing is for tracking purposes only — no money is processed through this app.**

---

## 🏷️ App Name Options

Here are a few name ideas based on the app's functionality:

| Name | Vibe |
|---|---|
| **Ranch Hand** | Direct, classic — the working person behind the horses |
| **PasturePro** | Professional, modern — emphasizes the service management side |
| **HoofLog** | Playful, memorable — a daily log for hooved animals |
| **StableTrack** | Clear and functional — tracks everything at the stable |
| **CoralBoard** | Warm, southwestern — the "board" where all animals are managed |

---

## 🚀 Setup Instructions

### 1. Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g. `ranchhand-prod`)
3. Once created, click **Add app** → Web (`</>`) → register the app
4. Copy the `firebaseConfig` values

### 2. Fill in Firebase Config

Open `src/firebase/config.js` and replace all `YOUR_*` placeholders:

```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID",
};
```

### 3. Enable Firebase Services

In the Firebase console:

- **Authentication** → Sign-in method → Enable **Email/Password**
- **Firestore Database** → Create database → Start in **test mode** (for dev), then deploy rules below for production
- **Storage** → Get started (for horse photo uploads — Phase 2)

### 4. Deploy Firestore Security Rules

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # select your project
firebase deploy --only firestore:rules
```

Or paste the contents of `firestore.rules` directly into the Firebase console under Firestore → Rules.

### 5. Install & Run

```bash
npm install
npm start
```

---

## 📁 Project Structure

```
src/
├── firebase/
│   ├── config.js          ← Firebase init + exports (fill in YOUR_ placeholders)
│   └── firestore.js       ← All Firestore queries + billing calculation logic
├── context/
│   └── AuthContext.js     ← Auth state, login, register, profile management
├── components/
│   ├── auth/
│   │   ├── AuthPages.js       ← Login + Register pages
│   │   ├── OnboardingPage.js  ← Create ranch OR join with 6-digit code
│   │   └── ProtectedRoute.js  ← Route guards (auth, ranch, admin)
│   └── layout/
│       └── AppShell.js        ← Sidebar + mobile header layout
├── pages/
│   ├── DashboardPage.js    ← Home for both admin and user
│   ├── AnimalsPage.js      ← Admin: all animals, custom sort order
│   ├── ServicesPage.js     ← Admin: create services, assign to animals, approve requests
│   ├── TodoPage.js         ← Admin: daily checklist, check off services per animal
│   ├── BillingPage.js      ← Admin: billing summary per owner/animal (tracking only)
│   ├── MembersPage.js      ← Admin: view members, show ranch code, promote to admin
│   ├── MyAnimalsPage.js    ← User: their animals + service requests
│   ├── RanchBoardPage.js   ← User: public directory of all ranch animals
│   ├── MyBillingPage.js    ← User: their own billing summary (tracking only)
│   └── SettingsPage.js     ← Both: profile + password update
└── styles/
    └── global.css          ← Design tokens, utility classes, base styles
```

---

## 🗂️ Firestore Data Model

```
ranches/{ranchId}
  name, code (6-digit), ownerId, createdAt

users/{uid}
  displayName, email, ranchId, role (admin|user), createdAt

animals/{animalId}
  ranchId, ownerId, name, breed, age, color, photoURL,
  feedDetails, vetName/Phone/Email, farrierName/Phone/Email,
  notes, isPublic, sortOrder, createdAt

services/{serviceId}
  ranchId, name, description, price,
  paymentType (one-time|recurring), frequency (daily|weekly|monthly)

animalServices/{id}
  animalId, serviceId, ranchId, notes, status (active|pending|inactive),
  requestedBy, assignedAt

serviceCompletions/{id}
  animalServiceId, animalId, serviceId, ranchId,
  completedAt, completedBy, month (YYYY-MM)
```

---

## 💰 Billing Logic

Billing is **tracking only** — no money passes through the app.

| Type | Logic |
|---|---|
| **One-time** | $X charged each time the task is marked complete |
| **Recurring (daily)** | $X/month × (days completed ÷ days in month) |

Example: A $30/month daily service completed 20 of 30 days → owner is shown **$20.00** for that month.

---

## 🗺️ Development Roadmap

- **Phase 1 (current):** React web app, mobile-first design
- **Phase 2:** Photo uploads via Firebase Storage, push notifications for service requests
- **Phase 3:** React Native mobile app (iOS + Android)
- **Phase 4:** App Store submission + marketing
