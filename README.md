# AEON Bank – Transactions

A React Native (TypeScript) app that lets banking customers browse their latest transactions, open a transaction to see its details, and share it to any app on the device.

---

## Features

| Requirement                                                  | Implementation                                                                                                                                                                                                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| List of latest transactions (transfer details, date, amount) | `TransactionListScreen` shows a `SectionList` grouped by month and sorted newest first. Each row shows the transfer name, recipient, date and signed amount.                                                                                                  |
| Incoming vs. outgoing                                        | Worked out from the sign of `amount`: green `IN +RM` for money in, red `OUT -RM` for money out. A summary card at the top totals both.                                                                                                                           |
| Tap an item to see details                                   | Navigates to `TransactionDetailScreen`, which shows the **Reference ID, date, recipient name and transfer amount**.                                                                                                                                           |
| Share the transfer details externally                        | The **Share** button opens the native share sheet (WhatsApp, Telegram, email, Messages, Save to Files, ...). The receipt card is captured as a PNG and attached together with a plain-text summary. If the capture fails, it falls back to sharing text only. |

Extras:

- **Zustand** store with `loading` / `refreshing` / `success` / `error` states, and a guard that stops duplicate fetches.
- **10,000-transaction history with cursor pagination.** The mock API pages through 10,000 generated transactions, 30 at a time; the list loads the next page as you scroll (infinite scroll) and shows a retry button if a page fails. Responses that arrive after a refresh are dropped, so a slow page can't mix old and new data. Money in/out totals come from the API, because the client only ever holds part of the history.
- **Offline handling.** A banner appears as soon as the device goes offline, and the transactions already loaded stay usable (details and sharing included). A failed refresh says why instead of failing silently. When the connection comes back, only what actually failed is retried, so the user keeps their scroll position. Requests time out after 10 seconds.
- Pull-to-refresh, plus loading, empty and error screens (the error screen has a retry button).
- Dates arrive in UTC and are shown in the device's **local timezone** (via `dayjs`).
- Accessibility labels, roles and hints on interactive elements.
- Unit and integration tests with React Native Testing Library.
- Husky pre-commit hook that runs lint-staged (ESLint + Prettier), a type check and the tests.

---

## Tech stack

- **React Native 0.87** (CLI, New Architecture) + **TypeScript**
- **Zustand** for state management
- **React Navigation 7** (native stack)
- **dayjs** for date formatting
- **react-native-share** + **react-native-view-shot** for sharing
- **Jest** + **@testing-library/react-native** for tests
- **ESLint**, **Prettier**, **Husky**, **lint-staged** for code quality

---

## Getting started

### Prerequisites

- **Node.js ≥ 22.11**
- Set up your environment by following the official [React Native environment setup guide](https://reactnative.dev/docs/set-up-your-environment) (React Native CLI, not Expo):
  - **Android:** Android Studio, Android SDK, JDK 17, and an emulator or a device with USB debugging on
  - **iOS (macOS only):** Xcode, CocoaPods (`bundle install` installs it through the provided `Gemfile`)

### 1. Install dependencies

```sh
git clone https://github.com/risto23/AeonBankTransaction.git
cd AeonBankTransaction
npm install
```

### 2. Start Metro

```sh
npm start
```

### 3. Run the app

Leave Metro running and open a second terminal.

**Android**

```sh
npm run android
```

**iOS**

```sh
bundle install                       # first time only
cd ios && bundle exec pod install && cd ..
npm run ios
```

### 4. Build a release APK (Android)

```sh
cd android
./gradlew assembleRelease        # Windows: gradlew.bat assembleRelease
```

The APK is written to `android/app/build/outputs/apk/release/app-release.apk`. Install it on a connected device with `adb install -r android/app/build/outputs/apk/release/app-release.apk`.

**Signing:** release builds read their credentials from `android/keystore.properties`, which is git-ignored:

```properties
storeFile=release.keystore        # relative to android/app
storePassword=********
keyAlias=********
keyPassword=********
```

If that file is missing, the release build falls back to the debug keystore. It still builds and installs, but it can't be uploaded to the Play Store. To create your own keystore:

```sh
keytool -genkeypair -v -storetype PKCS12 -keystore android/app/release.keystore -alias <alias> -keyalg RSA -keysize 2048 -validity 10000
```

> If the build fails after you change native dependencies, clean it and try again:
> Android: `cd android && ./gradlew clean`. iOS: delete `ios/Pods` and run `pod install` again.

---

## Scripts

| Command                           | Description                          |
| --------------------------------- | ------------------------------------ |
| `npm start`                       | Start the Metro bundler              |
| `npm run android` / `npm run ios` | Build and launch the app             |
| `npm test`                        | Run the test suite                   |
| `npm run test:coverage`           | Run the tests with a coverage report |
| `npm run lint`                    | Lint the project with ESLint         |
| `npm run typecheck`               | Type-check the project with `tsc`    |

---

## Project structure

```
src/
├── api/            # Data access: mock backend payload and fetchTransactions()
├── components/     # Presentational, reusable UI (list item, summary card, button, ...)
├── constants/      # App-wide constants (currency)
├── hooks/          # useShareTransaction (receipt capture + share sheet), useNetworkStatus
├── navigation/     # Native stack navigator and typed route params
├── screens/        # TransactionListScreen, TransactionDetailScreen
├── store/          # Zustand store (useTransactionStore) and selectors
├── theme/          # Colors, spacing, radius, typography tokens
├── types/          # Domain types (Transaction, API response)
└── utils/          # Pure helpers: formatting, sorting, grouping, summarising
__tests__/
├── integration/    # App-level flows: list → detail → share, error → retry
├── store/          # Store behaviour
└── utils/          # Pure function tests
```

### Architecture notes

- **Layers only depend downwards:** `screens` → `store` / `hooks` / `components` → `utils` / `api` / `types`. The screens never call the API directly; they only read from and trigger actions on the store.
- **API boundary:** `fetchTransactions({ cursor })` in `src/api/transactionApi.ts` returns one page from an in-memory mock "server" (the backend's sample payload plus 9,996 generated transactions) after a short simulated delay. The mock checks NetInfo so offline behaviour can be tried on a device. To use a real backend, replace the body of `mockRequest`. Nothing else needs to change.
- **Business logic lives in pure functions** (`src/utils`) so it can be unit tested without rendering anything. Examples: direction from the amount sign, month grouping, totals, the share message.
- **Only the reference ID goes through navigation.** The detail screen looks up the transaction from the store (`selectTransactionById`), so route params stay small and serialisable, which will make deep linking easier later.
- **Path alias:** `@/` maps to `src/` (set up in both `babel.config.js` and `tsconfig.json`).
- **Currency formatting** is written by hand instead of using `Intl.NumberFormat`, because Hermes on some Android builds ships with limited `Intl` locale data.

---

## Testing

```sh
npm test
```

- `__tests__/utils` covers currency and date formatting, sorting, grouping, totals and the share message.
- `__tests__/api` pages through all 10,000 mock transactions (no gaps, no duplicates, newest first) and checks the offline error.
- `__tests__/store` covers the loading, refreshing, success and error transitions, pagination, the duplicate-fetch guards, dropping stale pages after a refresh, and the selector.
- `__tests__/integration` renders the whole app. It checks that the list renders, that tapping a row opens the details, that Share passes the right payload to the share sheet, that the error screen's retry works, infinite scroll, and going offline and back online.

Tests run with `TZ=UTC` (set in `jest.config.js`) so the date assertions give the same result on any machine.

---

## Possible next steps

- Connect a real API with a data-fetching layer (e.g. TanStack Query) for caching and background refetching.
- Encrypted on-device cache (e.g. MMKV with a Keystore/Keychain key) so the last transactions are available after a cold start while offline.
- FlashList for even longer lists.
- Search and filters (by type, date range or amount).
- Dark mode (all colours already come from `src/theme`, so this mostly means adding a second palette).
- Localisation (i18n) for strings and currency.
- End-to-end tests with Detox or Maestro.
