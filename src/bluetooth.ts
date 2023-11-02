import noble from "@abandonware/noble";

const debug = require("debug")("bread-humidity-control:bluetooth");

export interface AmbientEnvironmentInfo {
  humidity: number;
  temperature: number;
}

export type AmbientEnvironmentInfoListener = (
  envInfo: AmbientEnvironmentInfo
) => void;

const DATA_CHARACTERISTIC_UUID = "000102030405060708090a0b0c0d2b10";

let scanning = false;
let tempMonitor: noble.Peripheral | undefined;

async function resetAndStartScanning() {
  if (tempMonitor) {
    await tempMonitor.disconnectAsync();
  }
  await noble.startScanningAsync();
  scanning = true;
}

function decodeEnvironmentInfo(buf: Buffer): AmbientEnvironmentInfo {
  return {
    temperature: (buf[3] | (buf[4] << 8)) / 10,
    humidity: buf[5],
  };
}

function getMac() {
  const TEMP_MONITOR_MAC = process.env.TEMP_MONITOR_MAC;
  if (!TEMP_MONITOR_MAC) {
    throw new Error("TEMP_MONITOR_MAC missing");
  }
  return TEMP_MONITOR_MAC;
}

export async function initBluetoothListener(
  cb: AmbientEnvironmentInfoListener
) {
  await resetAndStartScanning();

  noble.on("discover", async (peripheral) => {
    if (
      peripheral.address.toUpperCase() == getMac().toUpperCase() &&
      !tempMonitor &&
      // Avoids connecting to 'null peripheral' on restarts of the program, which break the bluetooth connection
      peripheral.uuid
    ) {
      debug("got peripheral %s", peripheral);
      await noble.stopScanningAsync();
      scanning = false;
      tempMonitor = peripheral;
      await peripheral.connectAsync();
      debug("connected to peripheral");
      const info =
        await peripheral.discoverAllServicesAndCharacteristicsAsync();

      // debug("%s", inspect(info.characteristics));
      const characteristic = info.characteristics.find(
        (x) => x.uuid === DATA_CHARACTERISTIC_UUID
      );

      // for(const cha of info.characteristics) {
      //   const value = await cha.readAsync();
      //   debug("%s", cha.uuid);
      //   decodeEnvironmentInfo(value);
      // }

      if (!characteristic) {
        debug(
          "Could not find characteristic with ID %s",
          DATA_CHARACTERISTIC_UUID
        );
        await resetAndStartScanning();
        return;
      }

      characteristic.on("data", (buf, isNotification) => {
        debug(
          "Got data %s (isNotification? %s)",
          buf.toString("hex"),
          isNotification
        );
        const envInfo = decodeEnvironmentInfo(buf);
        debug("Decoded %s", envInfo);
        cb(envInfo);
      });

      await characteristic.subscribeAsync();
      debug("Subscribed to characteristic");
    }
  });
}

export async function closeBluetooth() {
  debug("closeBluetooth");
  if (scanning) {
    await noble.stopScanningAsync();
    debug("closeBluetooth stopped scanning");
  }
  if (tempMonitor) {
    await tempMonitor.disconnectAsync();
    debug("closeBluetooth disconnected");
    tempMonitor = undefined;
  }
}
