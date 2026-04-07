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

      // Skip header line and empty lines
      if (!trimmedLine || trimmedLine.startsWith('List of devices')) {
        continue;
      }

      // Parse device line format: "device_id    device_status    product:... model:... device:..."
      const parts = trimmedLine.split(/\s+/);
      if (parts.length >= 2) {
        const deviceId = parts[0];
        const status = parts[1];

        // Only include devices that are properly connected
        if (status === 'device') {
          // Extract model name if available
          let modelName = deviceId;
          const modelMatch = trimmedLine.match(/model:([^\s]+)/);
          if (modelMatch) {
            modelName = modelMatch[1].replace(/_/g, ' ');
          }

          devices.push({
            id: deviceId,
            status: status,
            name: modelName,
            fullInfo: trimmedLine
          });
        }
      }
    }

    return devices;
  }

  async enableUsbDebugging(deviceId) {
    // This just checks if the device is authorized
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