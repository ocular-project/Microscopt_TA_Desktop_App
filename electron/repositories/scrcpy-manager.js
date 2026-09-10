import { spawn } from 'node:child_process';

class ScrcpyManager {
  constructor() {
    this.activeProcesses = new Map(); // deviceId -> process
    this.processStatus = new Map(); // deviceId -> status
    this.scrcpyVersion = null;
  }

  async checkScrcpyInstalled() {
    return new Promise((resolve) => {
      const process = spawn('scrcpy', ['--version']);
      let output = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.on('error', (error) => {
        console.error('scrcpy not found:', error.message);
        resolve(false);
      });

      process.on('exit', (code) => {
        if (code === 0) {
          // Extract version number
          const versionMatch = output.match(/scrcpy (\d+)\.(\d+)\.(\d+)/);
          if (versionMatch) {
            const [, major, minor, patch] = versionMatch;
            this.scrcpyVersion = { major: parseInt(major), minor: parseInt(minor), patch: parseInt(patch) };
            console.log('Detected scrcpy version:', this.scrcpyVersion);
          }
        }
        resolve(code === 0);
      });
    });
  }

  async startMirroring(deviceId, options = {}) {
    return new Promise((resolve, reject) => {
      // Stop existing process if running
      if (this.activeProcesses.has(deviceId)) {
        this.stopMirroring(deviceId);
      }

      // Build scrcpy arguments
      const args = [
        '-s', deviceId,
        '--window-title', `Mirror - ${deviceId}`,
      ];

      // Add optional parameters with version compatibility
      if (options.maxSize) {
        args.push('--max-size', options.maxSize.toString());
      }

      if (options.bitRate) {
        // Check if we're using scrcpy 3.x or newer
        if (this.scrcpyVersion && this.scrcpyVersion.major >= 3) {
          args.push('--video-bit-rate', options.bitRate);
        } else {
          // Fallback for older versions
          args.push('--bit-rate', options.bitRate);
        }
      }

      if (options.audioBitRate) {
        args.push('--audio-bit-rate', options.audioBitRate);
      }
      if (options.stayAwake) {
        args.push('--stay-awake');
      }
      if (options.turnScreenOff) {
        args.push('--turn-screen-off');
      }
      if (options.showTouches) {
        args.push('--show-touches');
      }
      if (options.recordFile) {
        args.push('--record', options.recordFile);
      }

      console.log('Starting scrcpy with args:', args);

      const scrcpyProcess = spawn('scrcpy', args);
      let hasStarted = false;

      scrcpyProcess.stdout.on('data', (data) => {
        console.log(`scrcpy stdout: ${data}`);
        if (!hasStarted) {
          hasStarted = true;
          this.processStatus.set(deviceId, 'running');
          resolve(true);
        }
      });

      scrcpyProcess.stderr.on('data', (data) => {
        const message = data.toString();
        console.log(`scrcpy stderr: ${message}`);

        // scrcpy outputs info to stderr, so check for success indicators
        if (message.includes('Device:') || message.includes('Resolution:')) {
          if (!hasStarted) {
            hasStarted = true;
            this.processStatus.set(deviceId, 'running');
            resolve(true);
          }
        }
      });

      scrcpyProcess.on('error', (error) => {
        console.error('scrcpy process error:', error);
        this.activeProcesses.delete(deviceId);
        this.processStatus.delete(deviceId);

        if (!hasStarted) {
          reject(new Error(`Failed to start scrcpy: ${error.message}`));
        }
      });

      scrcpyProcess.on('exit', (code, signal) => {
        console.log(`scrcpy process exited with code ${code}, signal ${signal}`);
        this.activeProcesses.delete(deviceId);
        this.processStatus.delete(deviceId);

        if (!hasStarted && code !== 0) {
          reject(new Error(`scrcpy exited with code ${code}`));
        }
      });

      // Store the process
      this.activeProcesses.set(deviceId, scrcpyProcess);
      this.processStatus.set(deviceId, 'starting');

      // Timeout fallback
      setTimeout(() => {
        if (!hasStarted) {
          hasStarted = true;
          this.processStatus.set(deviceId, 'running');
          resolve(true);
        }
      }, 3000);
    });
  }

  stopMirroring(deviceId) {
    const process = this.activeProcesses.get(deviceId);

    if (process) {
      process.kill('SIGTERM');

      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (this.activeProcesses.has(deviceId)) {
          process.kill('SIGKILL');
        }
      }, 5000);

      this.activeProcesses.delete(deviceId);
      this.processStatus.delete(deviceId);
      return true;
    }

    return false;
  }

  stopAllMirroring() {
    for (const deviceId of this.activeProcesses.keys()) {
      this.stopMirroring(deviceId);
    }
  }

  getMirroringStatus() {
    const status = {};
    for (const [deviceId, processStatus] of this.processStatus.entries()) {
      status[deviceId] = {
        isRunning: this.activeProcesses.has(deviceId),
        status: processStatus
      };
    }
    return status;
  }

  isDeviceMirroring(deviceId) {
    return this.activeProcesses.has(deviceId);
  }
}

export default ScrcpyManager;