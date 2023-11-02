import { Agent } from "https";
import PromClient from "prom-client";

const debug = require("debug")("bread-humidity-control:prom");

let gateway: PromClient.Pushgateway | undefined;

export async function pushToPrometheus() {
  if (!gateway) {
    return;
  }
  try {
    const res = await gateway.push({
      jobName: "nodePush",
    });

    debug("push result %s", (res.resp as any).statusCode);
  } catch (err) {
    console.warn(err);
  }
}

export async function initPrometheus() {
  const PUSH_HOST = process.env.PUSH_HOST;
  if (!PUSH_HOST) {
    debug("PUSH_HOST not set, not pushing to prometheus");
    return;
  }

  PromClient.collectDefaultMetrics();
  const PUSH_AUTH_USER = process.env.PUSH_AUTH_USER;
  if (!PUSH_AUTH_USER) {
    throw new Error("PUSH_AUTH_PASSWORD missing");
  }
  const PUSH_AUTH_PASSWORD = process.env.PUSH_AUTH_PASSWORD;
  if (!PUSH_AUTH_PASSWORD) {
    throw new Error("PUSH_AUTH_PASSWORD missing");
  }
  gateway = new PromClient.Pushgateway(
    `https://${PUSH_AUTH_USER}:${PUSH_AUTH_PASSWORD}@${PUSH_HOST}`,
    {
      timeout: 5000, //Set the request timeout to 5000ms
      agent: new Agent({
        keepAlive: true,
        keepAliveMsecs: 10000,
        maxSockets: 5,
      }),
    }
  );
}

export async function closePrometheus() {
  gateway = undefined;
}
