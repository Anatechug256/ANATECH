# ANATECH MARKET: AI Agent Developer Context & Knowledge Base

This document contains everything an AI Agent or engineer needs to know to understand, develop, debug, and answer questions about **ANATECH MARKET** (Uganda & East Africa's Verified Local Classifieds & Marketplace Platform).

---

## 1. Executive Summary & Brand Identity
* **App Name**: ANATECH MARKET
* **Owner/Organization**: ANATECH UG (`anatechug@gmail.com`)
* **Target Audience**: Ugandan and East African buyers, sellers, farmers, traders, mechanics, and businesses.
* **Core Philosophy**: Safe, fraud-free peer-to-peer commerce in Uganda, anchored by:
  1. Mandatory seller verification (NIN, verified phone, business details).
  2. Safe Meetup & Mobile Money escrow trade recommendations.
  3. Offline-first local data synchronization for unstable cellular networks.
  4. Web Speech API voice search in Ugandan English and local accents.
  5. Dedicated Android APK with native camera and gallery integration.

---

## 2. Technology Stack & Runtime Architecture

| Layer | Technologies / Libraries |
|---|---|
| **Framework & UI** | React 19, TypeScript, Tailwind CSS v4, Lucide React icons, Motion (`motion/react`) |
| **Bundler & Server** | Vite 8, Express backend (`server.ts`) running on port 3000 via `tsx` |
| **Data Persistence** | Reactive Store (`MarketplaceStore`) backed by `localStorage` with offline sync service |
| **Mobile & PWA** | Progressive Web App (Service Worker, Manifest) + Standalone Android APK (`aapt`, `dx`, `apksigner`) |
| **Audio & Voice** | Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`) with Luganda/English command parser |
| **Hardware Access** | Camera & Photo capture via HTML5 `<input type="file" capture="environment">` + Android `WebChromeClient.openFileChooser` |

---

## 3. Directory Layout & Key Files

```text
/
├── server.ts                             # Express server mounted with Vite middleware for dev & prod
├── package.json                          # Scripts: dev, build, lint (tsc --noEmit)
├── metadata.json                         # Permissions (camera, geolocation) and major capabilities
├── scripts/
│   ├── build-apk.sh                      # Shell script that compiles standalone signed Android APK
│   ├── package-android.js                # Dalvik bytecode builder & asset packager
│   └── generate-icons.js                 # PWA & Android launcher icon generator
├── public/
│   ├── anatech-market.apk                # Downloadable signed Android APK (v1/v2/v3 schemes)
│   ├── anatech-market-android-bundle.zip # Complete Android project source bundle
│   ├── manifest.json                     # PWA manifest
│   └── sw.js                             # Service worker for offline caching
└── src/
    ├── App.tsx                           # Main container, routing tabs, topbar, bottom nav
    ├── types/index.ts                    # All core interfaces (User, ProductListing, Conversation, etc.)
    ├── data/
    │   ├── categoriesAndDistricts.ts     # 146+ Ugandan districts & 10 primary marketplace categories
    │   └── initialData.ts                # Seed data for users, listings, conversations, and reviews
    ├── services/
    │   ├── marketplaceStore.ts           # Central state machine, localStorage sync, seller validation
    │   └── offlineSyncService.ts         # Connectivity detection, offline queueing
    ├── hooks/
    │   └── useVoiceSearch.ts             # Web Speech recognition hook with Ugandan accents
    ├── utils/
    │   ├── pushNotifications.ts          # Web Push and in-app alert dispatcher
    │   ├── speechRecognition.ts          # NLP parser for Ugandan marketplace voice queries
    │   └── safeTrade.ts                  # Verification scores, police station safe zones
    └── components/
        ├── HomeView.tsx                  # Search, filter tags, search history, listing feed
        ├── SellerRegistrationModal.tsx   # Mandatory NIN, ID photo, and phone registration modal
        ├── SellModal.tsx                 # Post listing modal (gated by seller registration)
        ├── ProductDetailModal.tsx        # Listing details, seller verification badge, reviews, chat
        ├── ChatView.tsx                  # Buyer-seller real-time chat, offer bargaining
        ├── ApkDownloadModal.tsx          # Direct APK installer with step-by-step Android instructions
        └── ...
```

---

## 4. Key Business Logic & Policies

### 4.1. Mandatory Seller Registration (No Selling Without Registration)
* **Rule**: Unregistered users **cannot post items for sale**.
* **Trigger**: Clicking "+ Post Listing", "Sell", or opening `SellModal` checks `currentUser.isRegisteredSeller` or `currentUser.isVerifiedSeller`.
* **Flow**: If not registered, the app blocks the listing form and presents `SellerRegistrationModal`.
* **Required Data**:
  - Full Legal Name / Business Name
  - Ugandan National ID Number (NIN: 14-character alphanumeric starting with `CM` or `CF`)
  - Verified Ugandan Phone Number (`+256 7...` MTN or Airtel)
  - District & Trading Center
  - ID Card Photo / Selfie proof
* **Outcome**: The seller receives a verified checkmark (`verified: true`), a dedicated seller profile, and can immediately post listings.

### 4.2. Search History & Tag Quick Access
* **Storage Key**: `anatech_market_search_history` in `localStorage`.
* **Capacity**: Max 10 recent searches, case-insensitive deduplication, ordered newest-first.
* **Pre-seeded**: If empty, seeds Ugandan queries: `['Samsung Galaxy', 'Toyota Premio', 'Fresh Matooke', 'Boda Boda']`.
* **Triggers**:
  - Pressing `Enter` in the search input.
  - Executing a Voice Command.
  - Clicking a listing from search results.
* **UI Features**: Clickable horizontal chip strip under search bar, individual `✕` dismissal per tag, and "Clear" all button.

### 4.3. Ugandan Currency & Pricing Slider
* Default currency is **UGX (Ugandan Shillings)**, with real-time conversion support to **KES**.
* Slider ceiling is set to **10,000,000 UGX** with quick step markers (500k, 1M, 2.5M, 5M, 10M+).
* Number formatting uses standard Ugandan comma separators (e.g., `UGX 1,500,000`).

### 4.4. 146+ Ugandan Districts
* All districts across Central (Kampala, Wakiso, Mukono), Western (Mbarara, Kabale, Fort Portal), Eastern (Jinja, Mbale, Soroti), and Northern (Gulu, Lira, Arua) regions are supported.
* Automatic geolocation matching maps latitude/longitude to the closest district.

### 4.5. Voice Search with Ugandan Market NLP
* Uses Web Speech API with fallback to `en-UG` and `en-GB`.
* Commands handled:
  - `"Search [query]"` or `"[query]"` -> Sets search query and stores in history.
  - `"Clear search"` or `"Reset filters"` -> Clears search and resets sliders.
  - `"Vehicles"`, `"Electronics"`, `"Farm produce"` -> Directly opens category.
  - `"Verified sellers only"` -> Toggles verified filter.

---

## 5. Storage Keys & Local State Architecture

All state is managed synchronously through `src/services/marketplaceStore.ts` using the following keys:

| Key | Description |
|---|---|
| `anatech_market_users` | All registered users, seller verification details, and avatars |
| `anatech_market_current_user_id` | Active logged-in user ID |
| `anatech_market_listings` | Array of product listings (active, sold, pending moderation) |
| `anatech_market_conversations` | Chat threads between buyers and sellers |
| `anatech_market_messages` | Real-time messages with price offer cards |
| `anatech_market_search_history` | Array of up to 10 recent search queries |
| `anatech_market_saved_searches` | Saved search criteria with push alert configurations |
| `anatech_market_seller_reviews` | Ratings & reviews (1–5 stars) linked to verified transactions |
| `anatech_market_recently_viewed` | List of listing IDs recently opened by the user |
| `anatech_market_low_data_mode` | Boolean flag to optimize image loading on 2G/3G connections |

---

## 6. Android APK Generation Pipeline

To rebuild the APK after making code modifications:
1. Run `compile_applet` or `npm run build` to verify the frontend builds into `dist/`.
2. Run `bash scripts/build-apk.sh` via `run_command`.
   - Compiles Java Android WebView wrapper (`MainActivity.java`).
   - Copies production web bundle to `assets/`.
   - Packages resources with `aapt`.
   - Compiles Dalvik bytecode with `dx`.
   - Signs with `apksigner` using the persistent release keystore.
   - Outputs: `public/anatech-market.apk` and updates `.aistudio/artifacts/brain/d2987fa7-bfeb-4712-a59f-4447b93097f0/anatech-market.apk`.

---

## 7. Frequently Asked Questions (FAQ)

### Q: Why can't I post a listing without registering?
**A**: ANATECH MARKET enforces a mandatory seller verification rule to eliminate scams, counterfeit goods, and ghost sellers. Every seller must register their phone number, National ID Number (NIN), and district before posting items.

### Q: How do users take photos of products using their phone camera?
**A**: The app supports direct camera capture using the HTML5 media capture API and Android `WebChromeClient.openFileChooser`. Clicking "Add Photo" opens the native camera or photo gallery.

### Q: How do search history tags work?
**A**: When a user searches for an item (by hitting Enter, speaking via voice search, or tapping an item), the query is saved into `localStorage`. These appear as clickable tags under the search bar for one-tap re-querying. Users can delete individual tags or click "Clear" to wipe history.

### Q: Can ANATECH MARKET work without internet?
**A**: Yes. The app is a Progressive Web App (PWA) with a Service Worker (`sw.js`) and IndexedDB/localStorage sync. Users can view cached listings, draft listings, and compose messages offline; items sync once back online.

### Q: How are payments and safe transactions handled?
**A**: The platform supports MTN Mobile Money, Airtel Money, and cash-on-delivery. It also provides verified safe meeting spots (e.g., Kampala Central Police Station, Ntinda Shopping Mall, Garden City) to protect buyers and sellers during physical handovers.

---

## 8. Development Instructions for Future AI Agents

1. **Verify First**: Always run `lint_applet` (`tsc --noEmit`) and `compile_applet` before reporting task completion.
2. **Never break TypeScript typings**: Lucide icons should not have direct `title` props in strict TypeScript; place titles on the enclosing `<button>` or `<span>`.
3. **Keep APK in Sync**: If you modify core navigation, camera permissions, or root assets, rerun `bash scripts/build-apk.sh` so the downloadable APK matches the live web build.
4. **Preserve Seller Gate**: Never bypass `isRegisteredSeller` verification checks when creating listings.
