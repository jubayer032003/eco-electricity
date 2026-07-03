# Hardware Documentation & Schematic

This document outlines the pin mappings, electrical wiring, and physical design for integrating a representative room (e.g., Drawing Room containing 2 Fans and 3 Lights) using an **ESP32 microcontroller**, a **Relay Board**, and a **Current Sensor**.

---

## 1. GPIO Pin Mapping Table (ESP32)

We select GPIO pins that do not interfere with the ESP32 strapping pins (GPIO 0, 2, 5, 12, 15) to guarantee reliable booting.

| Device ID | Device Name | ESP32 GPIO Pin | Connection Type | Electrical Component |
| :--- | :--- | :--- | :--- | :--- |
| `room-fan-1` | Room Fan 1 | `GPIO 13` | Digital Output | Relay Channel 1 |
| `room-fan-2` | Room Fan 2 | `GPIO 14` | Digital Output | Relay Channel 2 |
| `room-light-1` | Room Light 1 | `GPIO 25` | Digital Output | Relay Channel 3 |
| `room-light-2` | Room Light 2 | `GPIO 26` | Digital Output | Relay Channel 4 |
| `room-light-3` | Room Light 3 | `GPIO 27` | Digital Output | Relay Channel 5 |
| `room-current` | Room Current Sensor | `GPIO 34 (ADC1_CH6)`| Analog Input | SCT-013-030 (0-30A) Current Trans. |

---

## 2. Electrical Wiring Connection List

### Low Voltage DC Control Connections
1. **ESP32 Power**:
   - `5V` (or Vin) connected to `VCC` (+5V) of Relay Board.
   - `GND` connected to `GND` of Relay Board and Sensor Ground.
   - `3.3V` connected to Current Sensor supply pin (`VCC` if 3.3V compatible, otherwise use 5V with level-shifting).
2. **Relay Signal Inputs**:
   - `GPIO 13` → Relay Channel 1 IN (Fan 1)
   - `GPIO 14` → Relay Channel 2 IN (Fan 2)
   - `GPIO 25` → Relay Channel 3 IN (Light 1)
   - `GPIO 26` → Relay Channel 4 IN (Light 2)
   - `GPIO 27` → Relay Channel 5 IN (Light 3)
3. **Current Sensor Inputs**:
   - SCT-013-030 sensor output connected to `GPIO 34` through a burden resistor and a 1.65V bias divider network (to scale the AC signal to the ESP32 0-3.3V ADC range).

### High Voltage AC Load Connections (220V AC Grid)
- **Neutral (N)**: Directly connected to the neutral terminal of all 5 appliances (Fans 1-2, Lights 1-3).
- **Live / Line (L)**:
   1. Feeds through the center clamp of the **SCT-013 Current Sensor** to measure total room current.
   2. Splits and connects to the **Common (COM)** terminals of all 5 relays on the board.
   3. The **Normally Open (NO)** terminal of each relay connects to the live terminal of its corresponding appliance:
      - Relay 1 NO → Fan 1 Live
      - Relay 2 NO → Fan 2 Live
      - Relay 3 NO → Light 1 Live
      - Relay 4 NO → Light 2 Live
      - Relay 5 NO → Light 3 Live

---

## 3. Representative Room Schematic (ASCII Layout)

```
                     AC MAINS POWER SUPPLY (220V AC, 50Hz)
                    =====================================
                             L (Live)             N (Neutral)
                                |                      |
                        [SCT-013 Sensor]               |
                                |                      |
        +-----------------------+                      |
        |                                              |
        |    +------------------+                      |
        |    | Relays (COM)     |                      |
        |    |                  |                      |
        +----+--[ Relay 1 ]--NO-+----> [ Fan 1 ] ------+
        +----+--[ Relay 2 ]--NO-+----> [ Fan 2 ] ------+
        +----+--[ Relay 3 ]--NO-+----> [ Light 1 ] ----+
        +----+--[ Relay 4 ]--NO-+----> [ Light 2 ] ----+
        +----+--[ Relay 5 ]--NO-+----> [ Light 3 ] ----+
        |    +------------------+                      |
        |                                              |
        |                                              |
  +-----+-----------------------------------+          |
  |     |   ESP32 Microcontroller           |          |
  |     |                                   |          |
  |   GPIO13 ------> Relay 1 IN             |          |
  |   GPIO14 ------> Relay 2 IN             |          |
  |   GPIO25 ------> Relay 3 IN             |          |
  |   GPIO26 ------> Relay 4 IN             |          |
  |   GPIO27 ------> Relay 5 IN             |          |
  |                                         |          |
  |   GPIO34 <------ [SCT-013 Output]       |          |
  |                  (Analog ADC Signal)    |          |
  +-----------------------------------------+
```

---

## 4. Electrical Reasoning & Component Details

### Relay Modules (Low-Level Driver & Isolation)
- **Reasoning**: Relays provide physical and galvanic isolation between the low-voltage microcontrollers (3.3V/5V DC) and the high-voltage mains AC circuits (220V AC).
- **Optocoupler Isolation**: The relay board should feature opto-isolation (e.g., PC817 optocouplers). This means the ESP32 GPIO only powers an internal LED inside the optocoupler, which activates a phototransistor to pull the relay coil current. No direct electrical path exists between the ESP32 and the relay coil, protecting the GPIO pins from back-EMF spikes when the coils de-energize.

### SCT-013-030 Non-Invasive Current Sensor
- **Reasoning**: Hall-effect inline sensors (like ACS712) require cutting the mains line and running it through the PCB, which poses safety risks. The **SCT-013-030** is a split-core current transformer that clamps around the insulated Live conductor. This is non-invasive and much safer.
- **Signal Conditioning**: The SCT-013 outputs an AC current/voltage proportional to the primary load current. Because the ESP32 ADC only reads positive DC voltages (0V to 3.3V), a voltage divider circuit is used to apply a 1.65V DC offset to the sensor output, ensuring the negative half-cycles of the AC signal do not clip and damage the ADC.

### Power & Voltage Assumptions
- **Line Voltage**: Assumed to be a stable **220V AC** RMS.
- **Power Calculation Formula**:
  \[P_{\text{watts}} = V_{\text{rms}} \times I_{\text{rms}} \times \text{PF}\]
  Where:
  - \(V_{\text{rms}}\) is assumed to be 220V.
  - \(I_{\text{rms}}\) is computed by sampling the analog waveform on GPIO 34 over a full grid cycle (20ms for 50Hz) to get the Root-Mean-Square voltage difference, then multiplying by the sensor calibration coefficient.
  - \(\text{PF}\) (Power Factor) is assumed to be **1.0** for resistive loads (lights) and **0.85** for inductive loads (fans).
