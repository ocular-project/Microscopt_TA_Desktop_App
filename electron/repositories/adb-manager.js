import { spawn } from 'node:child_process';
import { execSync } from 'node:child_process';
import path from 'path';
import fs from 'fs';

class AdbManager {
  constructor() {
    this.devices = [];
  }

  // -----------------------------
  // ADB PATH RESOLVER
  // -----------------------------
  getAdbPath() {
    const platform = process.platform;

    try {
      // 1. Try system PATH first
      if (platform === 'win32') {
        const result = execSync('where adb').toString().split('\n')[0].trim();
        if (result) return result;
      } else {
        const result = execSync('which adb').toString().trim();
        if (result) return result;
      }
    } catch (_) {}

    const home = process.env.HOME || process.env.USERPROFILE || '';

    const possiblePaths = [];

    if (platform === 'win32') {
      possiblePaths.push(
        'C:\\Android\\Sdk\\platform-tools\\adb.exe',
        'C:\\Android\\platform-tools\\adb.exe',
        'C:\\platform-tools\\adb.exe', // ✅ your custom path
        path.join(process.env.LOCALAPPDATA || '', 'Android\\Sdk\\platform-tools\\adb.exe'),
        path.join(process.env.USERPROFILE || '', 'AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe')
      );
    }

    if (platform === 'darwin') {
      possiblePaths.push(
        '/usr/local/bin/adb',
        '/opt/homebrew/bin/adb',
        `${home}/Library/Android/sdk/platform-tools/adb`,
        `${home}/platform-tools/adb` // ✅ your custom path
      );
    }

    if (platform === 'linux') {
      possiblePaths.push(
        '/usr/bin/adb',
        '/usr/local/bin/adb',
        `${home}/Android/Sdk/platform-tools/adb`,
        `${home}/platform-tools/adb`
      );
    }

    for (const p of possiblePaths) {
      if (p && fs.existsSync(p)) {
        return p;
      }
    }

    return null;
  }

  // -----------------------------
  // CHECK ADB
  // -----------------------------
  async checkAdbInstalled() {
    return new Promise((resolve) => {
      const adbPath = this.getAdbPath();

      if (!adbPath) {
        return resolve({
          success: false,
          error: 'ADB not found on system (install or set platform-tools path)'
        });
      }

      const proc = spawn(adbPath, ['version']);

      let resolved = false;

      proc.on('error', (error) => {
        if (!resolved) {
          resolved = true;
          resolve({
            success: false,
            error: error.message || 'ADB failed to run'
          });
        }
      });

      proc.on('exit', (code) => {
        if (!resolved) {
          resolved = true;

          resolve({
            success: code === 0,
            error: code === 0 ? null : `ADB exited with code ${code}`
          });
        }
      });
    });
  }

  // -----------------------------
  // GET DEVICES
  // -----------------------------
  async getDevices() {
    return new Promise((resolve) => {
      const adbPath = this.getAdbPath();

      if (!adbPath) {
        return resolve({
          success: false,
          error: 'ADB not found on system'
        });
      }

      const proc = spawn(adbPath, ['devices', '-l']);

      let output = '';
      let errorOutput = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      proc.on('error', (error) => {
        resolve({
          success: false,
          error: `Failed to execute adb: ${error.message}`
        });
      });

      proc.on('exit', (code) => {
        if (code !== 0) {
          return resolve({
            success: false,
            error: errorOutput || `ADB command failed with code ${code}`
          });
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

  // -----------------------------
  // PARSE DEVICES
  // -----------------------------
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

          if (modelMatch) model = modelMatch[1].replace(/_/g, ' ');
          if (productMatch) product = productMatch[1];
          if (manufacturerMatch) manufacturer = manufacturerMatch[1];

          devices.push({
            id: deviceId,
            status,
            model,
            product,
            manufacturer,
            name: model || deviceId,
            fullInfo: trimmedLine
          });
        }
      }
    }

    return devices;
  }

  // -----------------------------
  // USB DEBUGGING CHECK
  // -----------------------------
  async enableUsbDebugging(deviceId) {
    return new Promise((resolve) => {
      const adbPath = this.getAdbPath();

      if (!adbPath) {
        return resolve(false);
      }

      const proc = spawn(adbPath, ['-s', deviceId, 'shell', 'echo', 'test']);

      proc.on('error', () => resolve(false));

      proc.on('exit', (code) => {
        resolve(code === 0);
      });
    });
  }
}

export default AdbManager;