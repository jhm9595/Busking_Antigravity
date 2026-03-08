# Busking Antigravity Test Suite 🚀

This folder contains the official testing tools for the **Busking Antigravity** platform.
It is designed to be a "one-click" testing solution that covers both backend API logic and simulated frontend flows.

## 📂 Project Structure

- `api-tester.js`: A Node.js script that performs automated testing on all key REST endpoints.
- `flow-simulatior.js`: Simulates a complete performance lifecycle (Scheduling -> Going Live -> Chat Interaction -> Ending).
- `one-click-test.sh`: The master script that runs all tests sequentially.
- `visual-dashboard.html`: A luxurious web dashboard to trigger and visualize test results.

## ⚡ How to Run

### Option 1: Terminal (One-Click)
Run the following command while the app is running (`npm run dev`):
```bash
./test-suite/one-click-test.sh
```

### Option 2: Visual Dashboard
Open the standalone dashboard in your browser while your server is running:
- Open `test-suite/visual-dashboard.html` directly in your browser.
  - *Note: Ensure localhost:3000 is accessible for API calls.*

## 🧪 Test Coverage

1. **Singer Lifecycle**:
   - Profile creation & verification.
   - Song repertoire management.
2. **Performance Lifecycle**:
   - Scheduling a performance.
   - Starting a live session (Status transition).
   - Auto-status update (API level).
3. **Audience Interactions**:
   - Joining a live performance.
   - Sending song requests.
   - Following/Unfollowing singers.
4. **Chat & Real-time**:
   - Room capacity checks.
   - System alerts (5-minute warning).
   - Automatic closing logic.
