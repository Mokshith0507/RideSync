import { BluetoothSerial } from '@ascentio-it/capacitor-bluetooth-serial';
import { Capacitor } from '@capacitor/core';

const ESP32_NAME = 'RideSync-ESP32';

let esp32Address: string | null = null;

export async function connectToRideSyncESP32(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') {
    throw new Error(
      'Bluetooth Serial is only available in the native Android app. This browser cannot connect to the ESP32\'s Bluetooth Classic SPP.'
    );
  }

  // Check/request Bluetooth permission and enable Bluetooth
  const permissionGranted =
    await BluetoothSerial.checkBluetoothPermissions();

  if (!permissionGranted) {
    await BluetoothSerial.enable();
  }

  const bluetoothState = await BluetoothSerial.isEnabled();

  if (!bluetoothState.enabled) {
    throw new Error('Please turn on Bluetooth.');
  }

  // Get paired devices
  const { devices } = await BluetoothSerial.getPairedDevices();

  const esp32 = devices.find(
    (device) => device.name === ESP32_NAME
  );

  if (!esp32) {
    throw new Error(
      'RideSync-ESP32 not found. Pair the ESP32 with your phone first.'
    );
  }

  esp32Address = esp32.address;

  // Connect
  await BluetoothSerial.connect({
    address: esp32Address,
  });
}

export async function sendDestinationToESP32(
  destination: string
): Promise<void> {
  if (!esp32Address) {
    await connectToRideSyncESP32();
  }

  if (!esp32Address) {
    throw new Error('ESP32 Bluetooth connection not available.');
  }

  await BluetoothSerial.write({
    address: esp32Address,
    value: `${destination}\n`,
  });
}