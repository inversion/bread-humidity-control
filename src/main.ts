import "source-map-support/register";

const debug = require("debug")("bread-humidity-control:main");

import {
  breadBinHandler,
  initBreadBinControl,
  stopBreadBinControl,
} from "./breadbin";
import { closeBluetooth, initBluetoothListener } from "./bluetooth";
import { closePrometheus, initPrometheus } from "./prometheus";

if (require.main === module) {
  (async function () {
    try {
      const termHandlers: (() => Promise<void>)[] = [];

      initPrometheus();
      termHandlers.push(closePrometheus);

      initBluetoothListener(breadBinHandler);
      termHandlers.push(closeBluetooth);

      initBreadBinControl();
      termHandlers.push(stopBreadBinControl);

      process.on("SIGTERM", async () => {
        debug("Terminating...");
        try {
          for (const termHandler of termHandlers) {
            await termHandler();
          }

          debug("Exit");
          process.exit();
        } catch (err) {
          debug("Failed to exit cleanly %o", err);
          process.exit(1);
        }
      });
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}
