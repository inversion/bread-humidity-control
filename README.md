# Bread Bin Humidity Control

See [blog article](https://amoss.me/2023/10/bread-bin-humidity-control/) for more context.

## Features
- Reads humidity and temperature values from Bluetooth Low Energy sensor.
- Simple control loop based on the sensor values that turns a TPLink Kasa smart plug on or off.
- Track sensor values to Prometheus pushgateway.
- Set up script to synchronize it to a Raspberry Pi and install it as a systemd service.

## How to use

1. Make a `.env` file in the root of the repo:
```
# MAC address of the BLE device - you can find this with an app like [nRF Connect](https://www.nordicsemi.com/Products/Development-tools/nrf-connect-for-desktop)
TEMP_MONITOR_MAC=48:7E:48:61:00:00

# IP address of the fan smartplug (hostname would probably also work)
# I use a static DHCP reservation in the router config to fix it
FAN_IP=192.168.0.123

# Assumes HTTPS (leave unset to disable Prometheus tracking)
PUSH_HOST=pushgateway-hostname

# HTTP Basic Auth (optional if PUSH_HOST not set)
PUSH_AUTH_USER=admin
PUSH_AUTH_PASSWORD=password
```
1. Install NodeJS on the Raspberry Pi.
1. Customize `targetHumidity` if desired in `breadbin.ts`.
1. Customize hostname (if desired) and run `./sync.sh` from your local machine on the same network as the Pi. I have SSH publickey auth set up to avoid entering a password.