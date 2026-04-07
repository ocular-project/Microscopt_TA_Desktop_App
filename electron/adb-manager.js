import { spawn } from 'node:child_process';

class AdbManager {
  constructor() {
    this.devices = [];
  }

  async checkAdbInstalled() {
    return new Promise((resolve) => {
      const process = spawn('adb', ['version']);
      let resolved = false

      process.on('error', (error) => {
        if (!resolved) {
          resolved = true
          resolve({
            success: false,
            error: error.message || 'ADB not found'
          })
        }
      });

      process.on('exit', (code) => {
        if (!resolved) {
          resolved = true;

          if (code === 0) {
            resolve({ success: true });
          } else {
            resolve({
              success: false,
              error: `ADB exited with code ${code}`
            });
          }
        }
      });
    });
  }

  async getDevices() {
    return new Promise((resolve) => {
      const process = spawn('adb', ['devices', '-l']);
      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('error', (error) => {
        resolve({
          success: false,
          error: `Failed to execute adb: ${error.message}`
        });
      });

      process.on('exit', (code) => {
        if (code !== 0) {
          resolve({
            success: false,
            error: errorOutput || `ADB command failed with code ${code}`
          });
          return;
        }

        try {
          const devices = this.parseDeviceList(output);
          this.devices = devices;

          resolve({
            success: true,
            data: devices
          });

        } catch (error) {
          resolve({
            success: false,
            error: error.message
          });
        }
      });
    });
  }

  parseDeviceList(output) {
    const lines = output.split('\n');
    const devices = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith('List of devices')) {
        continue;
      }

      const parts = trimmedLine.split(/\s+/);
      if (parts.length >= 2) {
        const deviceId = parts[0];
        const status = parts[1];

        if (status === 'device') {
          let model = null;
          let product = null;
          let manufacturer = null;

          const modelMatch = trimmedLine.match(/model:([^\s]+)/);
          const productMatch = trimmedLine.match(/product:([^\s]+)/);
          const manufacturerMatch = trimmedLine.match(/manufacturer:([^\s]+)/);

          if (modelMatch) {
            model = modelMatch[1].replace(/_/g, ' ');
          }

          if (productMatch) {
            product = productMatch[1];
          }

          if (manufacturerMatch) {
            manufacturer = manufacturerMatch[1];
          }

          devices.push({
            id: deviceId,
            status,
            model,
            product,
            manufacturer, // e.g. samsung
            name: model || deviceId,
            fullInfo: trimmedLine
          });
        }
      }
    }

    return devices;
  }

  async enableUsbDebugging(deviceId) {
    // This just checks if the devices is authorized
    return new Promise((resolve, reject) => {
      const process = spawn('adb', ['-s', deviceId, 'shell', 'echo', 'test']);

      process.on('error', (error) => {
        reject(new Error(`Failed to test device connection: ${error.message}`));
      });

      process.on('exit', (code) => {
        resolve(code === 0);
      });
    });
  }
}

export default AdbManager;