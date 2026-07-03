# Requirement Validation & Checklist

This document validates the requirements for the Office IoT Power Monitoring System, identifying device profiles, constraints, and open items.

## 1. Device Specifications

There are exactly **15 devices** across **3 rooms**:
- **Drawing Room** (`drawing`): 2 Fans, 3 Lights
- **Work Room 1** (`work1`): 2 Fans, 3 Lights
- **Work Room 2** (`work2`): 2 Fans, 3 Lights

### Device Data Model
Each device contains the following properties:
```typescript
interface Device {
  id: string;                    // unique identifier, e.g., "drawing-fan-1"
  name: string;                  // display name, e.g., "Drawing Fan 1"
  room: 'drawing' | 'work1' | 'work2';
  type: 'fan' | 'light';
  status: 'ON' | 'OFF';
  powerDraw: number;             // current power draw in Watts
  lastChanged: string;           // ISO timestamp of last state change
  runtimeToday: number;          // total runtime today in seconds
  runtimeCurrentSession: number; // runtime in the current ON session in seconds
}
```

### Power Specifications (Assumptions)
- **Fan**: 75W when ON, 0W when OFF.
- **Light**: 15W when ON, 0W when OFF.

---

## 2. API Schema Validation

### REST Endpoints
- `GET /api/devices`: Returns list of all 15 devices.
- `GET /api/rooms`: Returns summary of power usage per room.
- `GET /api/power`: Returns current total office power draw (Watts) and history.
- `GET /api/alerts`: Returns active/past alerts.
- `GET /api/usage`: Returns cumulative energy consumption (kWh) today.
- `POST /api/simulation/start`: Starts the state simulation.
- `POST /api/simulation/stop`: Pauses/stops the state simulation.
- `POST /api/simulation/reset`: Resets all runtime metrics and sets all devices to OFF.

### WebSocket Events
- `deviceUpdated`: Emitted when any device changes state.
- `roomUpdated`: Emitted when room-level stats change.
- `powerUpdated`: Emitted when overall office power draw updates.
- `alertCreated`: Emitted when a new alert is triggered.
- `simulationStarted` / `simulationStopped`: Emitted on simulator state toggle.

---

## 3. Alert Conditions & Severity
- **After Hours Alert**: Any device ON between 5 PM and 9 AM. (Severity: `WARNING`).
- **Overtime Alert**: Any room having devices ON continuously for > 2 hours. (Severity: `CRITICAL`).
- **High Power Usage Alert**: Total office power exceeding a configurable threshold (e.g., 800W). (Severity: `CRITICAL`).

---

## 4. Discord Bot Integration
- Prefix commands: `!status`, `!room drawing`, `!room work1`, `!room work2`, `!usage`, `!alerts`, `!help`.
- Live alerts: Emitted automatically to a designated channel (if `CHANNEL_ID` is set) or DMs.
- LLM Summarization: Optional integration with an OpenAI-compatible API to generate natural language summaries of office status (e.g., "Summarize today's office power usage").

---

## 5. Verification Strategy
- **Backend Tests**: Verify state calculation, simulator transitions, and REST controllers.
- **Frontend Dashboard**: Verify layout, component rendering (fan animations, glow effects), React Query caching, and WebSocket event integration.
- **Discord Mocking**: Unit tests verifying bot message formatters when Discord API tokens are absent.
