---
trigger: always_on
---

## Local-First & Instant Sync Architecture
### Building "Instant" Apps with Self-Hosted Backends

This guide explains how to build a web application that feels lightning-fast by saving data locally first and syncing it to your own self-hosted infrastructure later[cite: 3].

---

### 1. The Core Philosophy: "Local-First"
In a traditional app, you click "Save," wait for the server, and then see the result[cite: 3]. In a **Local-First** app:
*   **Instant Action:** Data is written to the browser's storage immediately[cite: 3].
*   **Background Sync:** The app talks to your server in the background[cite: 3].
*   **Cross-Device Recall:** When you log in on another device, the server pushes the data back down[cite: 3].

---

### 2. How to Achieve "Instant" (Optimistic UI)
To make the user feel like there is zero lag, we use **Optimistic Updates**[cite: 3]. 
*   **Tool:** `useOptimistic` (Built into Next.js/React) or **TanStack Query**[cite: 3].
*   **The Logic:** When a user hits "Submit," you manually update the UI state *before* the network request even starts[cite: 3]. If the server eventually says "Error," you roll the UI back[cite: 3].

---

### 3. Storage: Where the data lives
Since we are avoiding third-party clouds, we handle storage in two places[cite: 3]:

#### A. The Browser (Client-Side)
*   **IndexedDB:** A powerful database inside the browser[cite: 3].
*   **Library Recommendation:** **Dexie.js**[cite: 3]. It is a wrapper for IndexedDB that handles large datasets and complex queries without making the browser slow[cite: 3].

#### B. The Server (Self-Hosted Backend)
Since you mentioned **Payload CMS**, that is an excellent choice[cite: 3].
*   **Payload CMS:** You host this on your own VPS (Virtual Private Server) using MongoDB or PostgreSQL[cite: 3].
*   **Custom API:** You use Next.js Server Actions or Payload's REST/GraphQL API to receive the data from the browser[cite: 3].

---

### 4. The Sync Strategy (The "Glue")
To connect your local browser storage (Dexie) with your self-hosted backend (Payload)[cite: 3]:

1.  **The Change Feed:** Every time a user changes something locally, mark that row in Dexie as `synced: false`[cite: 3].
2.  **The Sync Worker:** A background function tries to send all `synced: false` items to your Payload CMS[cite: 3].
3.  **The Resolution:** Once Payload confirms the save, update the local Dexie row to `synced: true`[cite: 3].
4.  **Device Change:** On login, the app fetches all data from Payload CMS and populates the local IndexedDB[cite: 3].

---

### 5. Recommended Tech Stack
| Layer | Technology | Why? |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router) | Best for performance and built-in SEO[cite: 3]. |
| **Local DB** | Dexie.js (IndexedDB) | Reliable, fast, and stays on the user's device[cite: 3]. |
| **Self-Hosted CMS**| Payload CMS | You own the data, the database, and the server[cite: 3]. |
| **State/Sync** | TanStack Query | Handles the "Optimistic" UI and background fetching[cite: 3]. |

---

### 6. Implementation Steps for Your Project

1.  **Set up Payload CMS:** Host it on your own server and define your Collections[cite: 3].
2.  **Configure Dexie.js:** Create a local schema in your Next.js frontend that matches your Payload collections[cite: 3].
3.  **Write "Sync" Logic:** 
    *   Create a function that pulls from Dexie and POSTs to Payload[cite: 3].
    *   Create a function that GETs from Payload and refills Dexie[cite: 3].
4.  **UI Feedback:** Use a small "Cloud" icon in your UI to show if data is synced (Green) or saving locally (Yellow)[cite: 3].

---

### Summary
By combining **Dexie.js** for local storage and **Payload CMS** for your self-hosted backend, you get the speed of a local app and the persistence of a cloud app while maintaining total control over your data[cite: 3].