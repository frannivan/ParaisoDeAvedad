# Point of Sale (POS) - Hotel Shop (Paraíso de Avedad)

This is an **independent and standalone** project designed to run strictly on a local machine **without internet connection (Offline-first)** for managing the hotel's shop.

---

## Key Features

1. **100% Offline (No Internet Needed)**:
   * All data persistence (product catalog, inventory stocks, cash register logs, and sales) is stored locally using the web browser / Electron engine's `localStorage` securely.
   * All assets, including Tailwind CSS v4 styles and FontAwesome icons, are compiled and bundled locally for offline use.
2. **Shift and Cash Management (Reconciliation)**:
   * **Open shift**: Cashier must set a starting register cash amount.
   * **Audit Trail**: Logs manual cash deposits (inflow), withdrawals (outflow), sales, and register events.
   * **Reconciliation (Close Shift)**: Compares the theoretical system balance with the actual physical cash count, calculates discrepancies (surplus/deficit), and records shift history.
3. **Flexible Payment Checkout**:
   * Cash (computes change automatically).
   * Card (stores transaction authorization code).
   * Room Charge (registers room number and guest name for room charges).
4. **Built-in Calculator with Direct Integration**:
   * Accessible via a sliding drawer on the right sidebar.
   * Full **physical keyboard** support (numbers, arithmetic operators `+`, `-`, `*`, `/`, `Enter` to calculate, and `Esc` to clear display).
   * Special **"Use in register"** button which automatically injects the calculated value into the active checkout or cash adjustment fields.
5. **Stock Level Warnings**:
   * Custom low-stock alert thresholds for each product.
   * Live visual alert triggers (inventory health status badges) for quick restocking.

---

## Getting Started

### 1. Install Dependencies
Open your terminal inside this project directory (`pos`) and execute:
```bash
npm install
```
*This downloads and configures all dependencies (React 19, Tailwind CSS v4, Electron) locally inside the `node_modules` directory.*

### 2. Run in Development (Web Browser)
To run the web app in your browser at port `3035`:
```bash
npm run dev
```
Open [http://localhost:3035](http://localhost:3035) in your web browser.

### 3. Run as a Native Desktop App (Recommended)
To launch the POS as a dedicated, native desktop window (using Electron):
```bash
npm run electron:dev
```
*This opens a clean, dedicated window without browser navbars, ideal for shop workstations.*

### 4. Build for Production (Offline Distribution)
To compile the project into fully static, self-contained files:
```bash
npm run build
```
Vite will compile the code to the `dist/` directory. You can copy this directory to any offline computer and open `index.html` to run the POS with 100% functionality and no internet required.
