#!/usr/bin/zsh

set -o nounset
set -o errexit

npm run build
rsync -avz --delete ./src package-lock.json package.json ./systemd .env 'raspberrypi:~/bread-humidity-control'
sleep 1
ssh pi@raspberrypi <<'EOF'
set -o errexit
set -o xtrace
cd bread-humidity-control

npm i

# To run synchronously rather than as a systemd service
# DEBUG=bread-humidity-control:* node src/main rpi

cd systemd
sudo cp *.service /etc/systemd/system/
sudo systemctl --system daemon-reload

sudo systemctl enable rpi-bread-humidity-control
sudo systemctl restart rpi-bread-humidity-control
journalctl -u rpi-bread-humidity-control.service -f --lines 100
EOF
