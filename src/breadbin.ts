import { AmbientEnvironmentInfo } from "./bluetooth";
import PromClient from "prom-client";
import { pushToPrometheus } from "./prometheus";
import { hrtime } from "process";
import { setInterval } from "timers";
import { getFanPoweredOn, setFanPoweredOn } from "./kasa";

const debug = require("debug")("bread-humidity-control:breadbin");

const temperature = new PromClient.Gauge({
  name: "temperature",
  help: "Temperature in Celsius",
});
const humidity = new PromClient.Gauge({
  name: "humidity",
  help: "Humidity",
});

const isFanActive = new PromClient.Gauge({
  name: "fanActive",
  help: "Is fan active?",
  collect: async function () {
    this.set((await getFanPoweredOn()) ? 1 : 0);
  },
});

export interface BreadBinControlConfig {
  targetHumidity: number;
  maxMetricStalenessS: number;
}

export interface BreadBinControlState {
  lastSet?: bigint;
  envInfo?: AmbientEnvironmentInfo;
}

let controlState: BreadBinControlState = {};

export function breadBinHandler(envInfo: AmbientEnvironmentInfo) {
  temperature.set(envInfo.temperature);
  humidity.set(envInfo.humidity);
  pushToPrometheus();
  controlState.lastSet = hrtime.bigint();
  controlState.envInfo = envInfo;
}

let breadBinControlInterval: NodeJS.Timeout | undefined;

export function breadBinControl(
  config: BreadBinControlConfig,
  state: BreadBinControlState
) {
  if (!state.envInfo || !state.lastSet) {
    return;
  }

  const { lastSet, envInfo } = state;
  const { targetHumidity, maxMetricStalenessS } = config;

  if (hrtime.bigint() - lastSet > maxMetricStalenessS * 1e9) {
    debug("Metric is stale, turning off fan");
    setFanPoweredOn(false);
    return;
  }

  if (envInfo.humidity > targetHumidity) {
    setFanPoweredOn(true);
  } else {
    setFanPoweredOn(false);
  }
}

export function initBreadBinControl() {
  breadBinControlInterval = setInterval(() => {
    breadBinControl(
      {
        maxMetricStalenessS: 60,
        targetHumidity: 75,
      },
      controlState
    );
  }, 30000);
}

export async function stopBreadBinControl() {
  if (breadBinControlInterval) {
    clearInterval(breadBinControlInterval);
    breadBinControlInterval = undefined;
  }
}
