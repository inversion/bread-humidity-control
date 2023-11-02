import { Client } from "tplink-smarthome-api";

const debug = require("debug")("bread-humidity-control:kasa");

const client = new Client();

function getFanIp() {
  const FAN_IP = process.env.FAN_IP;
  if (!FAN_IP) {
    throw new Error("FAN_IP missing");
  }
  return FAN_IP;
}

export async function getFanPoweredOn() {
  const plug = client.getDevice({ host: getFanIp() });
  const device = await plug;
  return device.getPowerState();
}

export async function setFanPoweredOn(on: boolean) {
  debug("Setting power state of fan to %s", on);

  const plug = client.getDevice({ host: getFanIp() });
  await plug.then((device) => {
    device.setPowerState(on);
  });
}
