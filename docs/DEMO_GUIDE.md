# 🏆 Hackathon Demo Guide & Presentation Script

This guide prepares the presenter for a flawless **3-minute live presentation** of the Office IoT Power Monitoring system.

---

## 📋 Pre-Flight Checklist (Run 5 Mins Before Demo)
1. **Restart Server**: Kill any active instances, then run `npm run dev` in `/backend` to boot the server cleanly.
2. **Start Dashboard**: Run `npm run dev` in `/frontend` and open `http://localhost:5173`.
3. **Reset State**: Click the **Reset** button in the Simulation Console to ensure all metrics and logs start at zero.
4. **Discord Bot check**: Verify that the backend command-line outputs `[Discord] Bot token is missing... running in MOCK MODE` or logs in successfully.
5. **Close Extra Tabs**: Keep only the React Dashboard tab and the terminal window visible.

---

## ⏱ 3-Minute Demo Flow

### Minute 1: The Pitch & The Map (Value Proposition)
- **Presenter Action**: Show the home page. Do NOT hover or click yet. Point at the header stats.
- **Speaker Script**:
  > "Hello judges. Commercial buildings consume up to 40% of global electricity, and a significant portion is wasted on empty rooms and active devices after hours. We built the **Office IoT Power Monitoring System** to solve this.
  > Our architecture is built as a single source of truth: our simulated devices feed a Node.js TypeScript API, streaming live metrics instantly via Socket.IO to this React dashboard and our Discord bot.
  > Let's look at the center of the screen: a live top-down office map. If I hover or click on a light or a fan, we can interactively toggle them on the schematic. Notice the pulsing lines? That represents real-time current draw flowing to active devices."

---

### Minute 2: Demo Mode & Telemetry (The "Wow" Factor)
- **Presenter Action**: Click the **Demo Mode** button in the Simulation Console.
- **Speaker Script**:
  > "Because we only have three minutes, let's fast-forward the day. I am activating **Demo Mode**, which accelerates the simulation speed to 30x.
  > Notice the real-time load curve shifting dynamically on our chart. Since all devices in our Drawing Room are active, the simulated session runtime accumulates rapidly.
  > Look at our ESG metrics: our algorithm calculates the building's **Carbon Footprint** in real-time and evaluates a **Building Energy Grade**. Because devices are active during after-hours, our building grade has dropped to a 'D'. Let's see what happens when the system detects anomalies."

---

### Minute 3: Alerts, Discord, & Resolution (Closing the Loop)
- **Presenter Action**: Point at the **Alerts Log** panel where the overtime and after-hours alerts are popping up. Show the terminal window containing the Discord bot mock logs.
- **Speaker Script**:
  > "Look at our Alerts Log. The Alert Engine has generated critical alerts: our Drawing Room has been left fully active for over 2 hours, and our load has crossed safety thresholds.
  > At the same time, this alert was pushed directly to our building managers via our Discord integration. Here in the console logs, you can see the natural-language warnings that our Discord bot automatically pushed.
  > If I click **Resolve** on the dashboard or turn off the devices, the alert clears immediately, the current flow animation stops, and the building grade recovers. We have built a robust, end-to-end IoT gateway ready for real-world hardware deployment. Thank you, and I am open to your questions."

---

## 💬 Judge Q&A Talking Points

### Q1: How does this scale to real hardware devices?
- **Answer**:
  > "The backend uses the **Repository Pattern** to abstract data access. The Simulation Service modifies states using an `IDeviceRepository` interface. To plug in physical ESP32 chips or smart plugs, we simply swap the in-memory repository with a database-backed or MQTT-backed gateway repository. The REST endpoints and WebSockets remain completely unchanged."

### Q2: Hall-effect current sensors like ACS712 can be dangerous to install. Is this safe?
- **Answer**:
  > "Yes. In our hardware specifications (found in [docs/SCHEMATIC.md](file:///c:/Users/scs/Desktop/visionHack/docs/SCHEMATIC.md)), we specified **SCT-013 split-core current transformers** instead of inline hall-effect sensors. These clamp around insulated wires non-invasively, eliminating the need to cut live AC copper, making it 100% safe for building maintenance staff."

### Q3: Why use Socket.IO instead of basic native WebSockets?
- **Answer**:
  > "Socket.IO handles automatic reconnections, connection fallbacks, and multiplexing out-of-the-box. If the network drops during operations, the client automatically reconnects and receives the latest synchronized building state immediately upon reconnection."

---

## 🚨 Disaster Recovery (Backup Plan)

| Failure Scenario | Immediate Workaround during Demo |
| :--- | :--- |
| **WebSockets fail to connect** | Refresh the browser. React Query will trigger an initial REST pull (`GET /devices`), which will load the current states even if live streaming is disconnected. |
| **Discord API is rate-limited** | Explain that the bot is running in **Mock Mode** to prevent API throttling during public demonstrations, and show the console outputs which reflect the exact bot responses. |
| **Telemetry is too slow/static** | Double-check that **Demo Mode** is enabled (30x Speed). If needed, click the **Reset** button to start a fresh simulation sequence. |
