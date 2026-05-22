# Paraiso De Avedad - Technical Guide & Access

This document serves as a quick reference for the development, access, and architecture of the Paraiso De Avedad portal.

## 🔑 Access Credentials

| Module | URL / Hash | Password |
| :--- | :--- | :--- |
| **Staff Portal (Admin)** | `#/login` | `paraiso2026` |
| **Kitchen Monitor (KDS)** | `#/kitchen` | No password (Internal) |
| **Order Entry (POS)** | `#/order` | No password (Internal) |
| **Mission Control** | `PARAISO_DE_AVEDAD_TERMINAL.html` | System Access |

---

## 🚀 Testing Guide

### 1. Booking Flows
*   **Pool (`#/booking/pool`)**: Test the demographic counters (Adults/Kids) and the add-ons (Pets/Massage).
*   **Restaurant (`#/booking/restaurant`)**: 
    *   Test the "Pre-select menu" vs "At restaurant" toggle.
    *   Test **GCash Payment**: Upload a dummy receipt image to verify the flow.
*   **Accommodation (`#/booking/accommodation`)**: Standard luxury booking flow with Stripe integration (Test mode).

### 2. Gastronomy System
*   **Order Entry (`#/order`)**: Simulate a waiter taking an order. Select a restaurant (e.g., "Dady Cafe"), add dishes, and send to kitchen.
*   **Kitchen Monitor (`#/kitchen`)**: Open this in a separate window. You should see orders appearing instantly. Use the buttons to "Start Prep", "Ready", and "Serve".

### 3. Administrative Control
*   **Inventory Tab**: Access `#/admin/inventory` to see the structure for managing Rooms, Dishes, and Services.
*   **Graphic Calendar**: View and drag bookings in the Tape Chart.

---

## 🏗️ Technical Architecture

### Tech Stack
*   **Frontend**: React (Vite) + TailwindCSS (for custom luxury styling).
*   **Backend**: Node.js + Express.
*   **Database**: SQLite via **Prisma 7** and **LibSQL** for high performance.
*   **Terminal Bridge**: Custom Node script (`terminal-bridge.js`) running on port `3060`.

### Database Schema
*   `Hotel`: Main hotel configuration.
*   `Restaurant`: Configuration for the 4 internal cafes.
*   `Dish`: Menu items linked to restaurants.
*   `Order` / `OrderItem`: Live kitchen management system.
*   `Booking`: Room and service reservations.

---

---

## 🛠️ Maintenance & Launch Commands

### 1. Starting the Application
Paraiso De Avedad is a split architecture. You must run the frontend and backend separately:

**Frontend (Client):**
```bash
cd client && npm run dev
```
*Accessible at: http://localhost:3040*

**Backend (Server):**
```bash
cd server && npm start
```
*Running on: http://localhost:3041*

### 2. Database & Sync
If you add new models to `schema.prisma` or change translations in `seed.js`, run:

```bash
# Update schema
cd server && npx prisma db push

# Regenerate Client
npx prisma generate

# Reset/Populate data
node prisma/seed.js
```


---
*Paraiso De Avedad - Luxury Experience Engineering*
