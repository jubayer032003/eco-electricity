import { Device, RoomId, DeviceType } from '../types';

export interface IDeviceRepository {
  getAll(): Promise<Device[]>;
  getById(id: string): Promise<Device | undefined>;
  update(id: string, updates: Partial<Device>): Promise<Device | undefined>;
  resetAll(): Promise<Device[]>;
}

export class InMemoryDeviceRepository implements IDeviceRepository {
  private devices: Device[] = [];

  constructor() {
    this.initializeDevices();
  }

  private initializeDevices() {
    const rooms: { id: RoomId; name: string }[] = [
      { id: 'drawing', name: 'Drawing Room' },
      { id: 'work1', name: 'Work Room 1' },
      { id: 'work2', name: 'Work Room 2' }
    ];

    rooms.forEach((room) => {
      // 2 Fans
      for (let i = 1; i <= 2; i++) {
        const id = `${room.id}-fan-${i}`;
        this.devices.push({
          id,
          name: `${room.name} Fan ${i}`,
          room: room.id,
          type: 'fan',
          status: 'OFF',
          powerDraw: 0,
          lastChanged: new Date().toISOString(),
          runtimeToday: 0,
          runtimeCurrentSession: 0
        });
      }
      // 3 Lights
      for (let i = 1; i <= 3; i++) {
        const id = `${room.id}-light-${i}`;
        this.devices.push({
          id,
          name: `${room.name} Light ${i}`,
          room: room.id,
          type: 'light',
          status: 'OFF',
          powerDraw: 0,
          lastChanged: new Date().toISOString(),
          runtimeToday: 0,
          runtimeCurrentSession: 0
        });
      }
    });
  }

  async getAll(): Promise<Device[]> {
    return [...this.devices];
  }

  async getById(id: string): Promise<Device | undefined> {
    const dev = this.devices.find((d) => d.id === id);
    return dev ? { ...dev } : undefined;
  }

  async update(id: string, updates: Partial<Device>): Promise<Device | undefined> {
    const index = this.devices.findIndex((d) => d.id === id);
    if (index === -1) return undefined;

    this.devices[index] = {
      ...this.devices[index],
      ...updates
    };

    return { ...this.devices[index] };
  }

  async resetAll(): Promise<Device[]> {
    this.devices = [];
    this.initializeDevices();
    return [...this.devices];
  }
}
