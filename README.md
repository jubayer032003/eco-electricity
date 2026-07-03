# Eco Electricity: AI-Powered Smart Office IoT & Energy Analytics Dashboard

An enterprise-ready full-stack Office IoT Power Monitoring & Smart Automation System. This system monitors 15 simulated electrical devices (2 fans and 3 lights across 3 rooms) from a single shared backend, exposing real-time status, analytics, and control through a **React Web Dashboard** (featuring interactive 2D/3D Floor Plan Schematics), an **AI Assistant Chatbot** powered by Google Gemini (`gemini-2.5-flash`), a **Discord Gateway Operations Bot**, and a fully customizable **Automation Rules Engine**.

All energy and financial audits are calculated in real-time in **Bangladeshi Taka (৳ / Tk)** using the official **Bangladesh Commercial Tariff Rate of Tk 12.39 per kWh**.

---

## 🏗 System Architecture

The project guarantees a **single source of truth** by coupling all event publishers and command interfaces to a central Node.js backend.

```
Simulated Device Layer (15 Nodes)
        ↓ (Random Toggles / 10-30s / Speed Multiplier)
Node.js Express + TS Backend (Shared Repository State)
        ↓
  +-----+-------------------+
  ↓                         ↓
Socket.IO Event Stream    REST HTTP Controller
  ↓                         ↓
React Web Dashboard       Discord Bot Gateway
(Real-time UI updates)    (Chatbot commands & notifications)
```

---

## 📁 Folder Structure

```
root
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── controllers/      # Express controllers (Devices, Simulation, Power, Alerts)
│   │   │   └── routes/           # Express router endpoints
│   │   ├── services/             # Core business logic (Repository, PowerCalc, AlertStore)
│   │   ├── simulation/           # Simulator timer and toggling engine
│   │   ├── alerts/               # Alert validation and rules engine
│   │   ├── socket/               # Socket.IO WebSocket broadcasts
│   │   ├── discord/              # Discord.js bot listener and formatters
│   │   ├── types/                # TypeScript shared types
│   │   ├── config/               # Environment configuration
│   │   └── index.ts              # Entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/           # UI elements (OfficeMap, Analytics, DevicePanel, etc.)
│   │   ├── context/              # SocketContext.tsx state sync provider
│   │   ├── types/                # Frontend Types
│   │   ├── App.tsx               # Main Dashboard page
│   │   ├── main.tsx
│   │   └── index.css             # Glassmorphism theme and animations
│   ├── package.json
│   ├── postcss.config.js
│   └── tailwind.config.js
├── docs/
│   ├── requirements_validation.md
│   ├── architecture.md
│   └── SCHEMATIC.md              # Hardware wiring and pin details
├── .env                          # Shared environment variables
└── README.md
```

---

## ⚙ Environment Variables (`.env`)

Create a `.env` file in the root workspace folder:

```env
PORT=5000
SIMULATION_SPEED=1.0
OFFICE_HOURS_START=9
OFFICE_HOURS_END=17
POWER_THRESHOLD=800
NODE_ENV=development

# Discord Bot Credentials (runs in Mock Mode if empty)
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_guild_id_here
DISCORD_CHANNEL_ID=your_alert_channel_id_here
```

---

## 🌐 Deploying to Render (Free Tier)
This project is configured with a Render Blueprint configuration file (`render.yaml`) in the root directory. To deploy both the Node.js backend and the React/Vite frontend:
1. Log in to [Render](https://dashboard.render.com/).
2. Click **New +** and select **Blueprint**.
3. Link your GitHub repository (`eco-electricity`).
4. When prompted, fill in the environment variable values:
   - `GEMINI_API_KEY`: Your Google Gemini API Key
   - `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`, `DISCORD_CHANNEL_ID`: Discord bot config
   - `VITE_BACKEND_URL`: Paste the URL of your deployed backend service (e.g. `https://eco-electricity-backend.onrender.com`)
5. Click **Apply**. Render will install, compile, and host both services automatically on the Free Tier!

---

## 🚀 Installation & Running

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (v9 or higher)

### 1. Running the Backend
```bash
cd backend
npm install
npm run dev
```
The server will start on `http://localhost:5000`. If no Discord token is configured, the bot will log commands and alerts to the console in **Mock Mode**.

### 2. Running the Frontend
```bash
cd frontend
npm install
npm run dev
```
The dashboard will start on `http://localhost:5173`. Open this URL in your web browser.

---

## 🔌 API Endpoint Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/devices` | Retrieve list of all 15 devices |
| `GET` | `/devices/:id` | Retrieve status of a specific device |
| `POST` | `/devices/:id/toggle` | Manually toggle device status (`{"status": "ON"\|"OFF"}`) |
| `GET` | `/rooms` | Retrieve room-level active devices and load |
| `GET` | `/power` | Retrieve total office wattage and room breakdowns |
| `GET` | `/usage` | Retrieve today's estimated energy consumption in kWh |
| `GET` | `/alerts` | Retrieve list of active and resolved system alerts |
| `POST` | `/alerts/:id/resolve` | Resolve an active system alert |
| `GET` | `/simulation/status` | Get simulation running state and speed multiplier |
| `POST` | `/simulation/start` | Start the random device simulator |
| `POST | `/simulation/stop` | Stop/Pause the random device simulator |
| `POST` | `/simulation/reset` | Reset all devices to OFF and clear accumulated energy |

---

## 💬 Discord Commands

The bot supports prefix commands. It replies in friendly, natural-language sentences:

- `!status` - Returns total active power load and active devices count.
- `!room drawing | work1 | work2` - Returns active lights/fans and load in that room.
- `!usage` - Displays estimated energy consumption today (in kWh).
- `!alerts` - Lists all currently active system warnings.
- `!help` - Displays the command list.

*Example Output*:
> "Drawing Room currently has 2 lights ON and 1 fan running, consuming about 90W."

---

## 🚨 Alert Engine Rules

The backend evaluates rules on every device state transition and timer tick:
1. **After Hours Alert** (Warning): Triggers if any light or fan is turned ON between 5 PM and 9 AM. Resolves automatically when the device is turned OFF.
2. **Overtime Alert** (Critical): Triggers if all devices (2 fans, 4 lights) in a room remain ON continuously for > 2 hours. Resolves when any device in the room is turned OFF.
3. **High Power Alert** (Critical): Triggers if total office power exceeds the threshold (default 800W). Resolves when the load drops below the threshold.

---

## 🛠 Testing Guide

We provide pre-packaged test scripts under `backend/src/` to verify operations without setting up external clients:

1. **Simulation Engine Test**:
   ```bash
   npx ts-node src/test-simulator.ts
   ```
2. **WebSocket Integration Test**:
   ```bash
   npx ts-node src/test-websocket.ts
   ```
3. **Discord Response Formatter Test**:
   ```bash
   npx ts-node src/test-discord.ts
   ```
4. **Alert Rules Engine Test**:
   ```bash
   npx ts-node src/test-alerts.ts
   ```

---

## 📄 License & Team Credits

- **License**: Licensed under the [MIT License](LICENSE) - open-source for hackathon evaluation.
- **Developers**: Developed with ❤️ by the Hackathon IoT Innovations Team.

