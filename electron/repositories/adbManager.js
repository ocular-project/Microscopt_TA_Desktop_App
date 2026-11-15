
import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

class AdbManager {
    constructor(managedAdbPath = null) {
        this.devices = [];
        this.managedAdbPath = managedAdbPath;
    }

    // -----------------------------
    // ADB PATH RESOLVER
    // -----------------------------
    getAdbPath() {
        const platform = process.platform;

        // 1. Prefer application-managed ADB
        if (
            this.managedAdbPath &&
            fs.existsSync(this.managedAdbPath)
        ) {
            return this.managedAdbPath;
        }

        // 2. Check system PATH
        try {
            if (platform === 'win32') {
                const result = execSync('where adb', {
                    encoding: 'utf8',
                    windowsHide: true,
                    stdio: ['ignore', 'pipe', 'ignore']
                }).split(/\r?\n/)[0].trim();

                if (result && fs.existsSync(result)) {
                    return result;
                }
            } else {
                const result = execSync('which adb', {
                    encoding: 'utf8',
                    stdio: ['ignore', 'pipe', 'ignore']
                }).trim();

                if (result && fs.existsSync(result)) {
                    return result;
                }
            }
        } catch (_) {
            // ADB is not available through system PATH
        }

        // 3. Check common installation directories
        const home =
            process.env.HOME ||
            process.env.USERPROFILE ||
            '';

        const possiblePaths = [];

        if (platform === 'win32') {
            possiblePaths.push(
                'C:\\Android\\Sdk\\platform-tools\\adb.exe',
                'C:\\Android\\platform-tools\\adb.exe',
                'C:\\platform-tools\\adb.exe',
                path.join(
                    process.env.LOCALAPPDATA || '',
                    'Android',
                    'Sdk',
                    'platform-tools',
                    'adb.exe'
                ),
                path.join(
                    home,
                    'AppData',
                    'Local',
                    'Android',
                    'Sdk',
                    'platform-tools',
                    'adb.exe'
                )
            );
        }

        if (platform === 'darwin') {
            possiblePaths.push(
                '/usr/local/bin/adb',
                '/opt/homebrew/bin/adb',
                path.join(
                    home,
                    'Library',
                    'Android',
                    'sdk',
                    'platform-tools',
                    'adb'
                ),
                path.join(
                    home,
                    'platform-tools',
                    'adb'
                )
            );
        }

        if (platform === 'linux') {
            possiblePaths.push(
                '/usr/bin/adb',
                '/usr/local/bin/adb',
                path.join(
                    home,
                    'Android',
                    'Sdk',
                    'platform-tools',
                    'adb'
                ),
                path.join(
                    home,
                    'platform-tools',
                    'adb'
                )
            );
        }

        for (const adbPath of possiblePaths) {
            if (adbPath && fs.existsSync(adbPath)) {
                return adbPath;
            }
        }

        return null;
    }

    // -----------------------------
    // EXECUTE ADB COMMAND
    // -----------------------------
    executeAdb(args = [], deviceId = null) {
        return new Promise((resolve) => {
            const adbPath = this.getAdbPath();
            console.log("This is the ADB path: ", adbPath)

            if (!adbPath) {
                return resolve({
                    success: false,
                    error: 'ADB not found on system.'
                });
            }

            const commandArgs = deviceId
                ? ['-s', deviceId, ...args]
                : args;

            const proc = spawn(adbPath, commandArgs, {
                windowsHide: true
            });

            let output = '';
            let errorOutput = '';
            let resolved = false;

            const finish = (result) => {
                if (resolved) return;

                resolved = true;
                resolve(result);
            };

            proc.stdout.on('data', (data) => {
                output += data.toString();
            });

            proc.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            proc.on('error', (error) => {
                finish({
                    success: false,
                    error: `Failed to execute ADB: ${error.message}`
                });
            });

            proc.on('close', (code) => {
                finish({
                    success: code === 0,
                    code,
                    output: output.trim(),
                    error: code === 0
                        ? null
                        : errorOutput.trim() ||
                          `ADB exited with code ${code}`
                });
            });
        });
    }

    // -----------------------------
    // CHECK ADB INSTALLATION
    // -----------------------------
    async checkAdbInstalled() {
        const result = await this.executeAdb(['version']);

        return {
            success: result.success,
            error: result.error,
            version: result.output || null
        };
    }

    // -----------------------------
    // GET DEVICES
    // -----------------------------
    async getDevices() {
        const result = await this.executeAdb([
            'devices',
            '-l'
        ]);

        if (!result.success) {
            return {
                success: false,
                error: result.error
            };
        }

        try {
            const devices = this.parseDeviceList(result.output);

            this.devices = devices;

            return {
                success: true,
                data: devices
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // -----------------------------
    // PARSE DEVICES
    // -----------------------------
    parseDeviceList(output) {
        const lines = output.split(/\r?\n/);
        const devices = [];

        for (const line of lines) {
            const trimmedLine = line.trim();

            if (
                !trimmedLine ||
                trimmedLine.startsWith('List of devices')
            ) {
                continue;
            }

            const parts = trimmedLine.split(/\s+/);

            if (parts.length < 2) continue;

            const deviceId = parts[0];
            const status = parts[1];

            // Only include authorized and connected devices
            if (status !== 'device') continue;

            const modelMatch = trimmedLine.match(/model:([^\s]+)/);
            const productMatch = trimmedLine.match(/product:([^\s]+)/);
            const manufacturerMatch = trimmedLine.match(
                /manufacturer:([^\s]+)/
            );

            const model = modelMatch
                ? modelMatch[1].replace(/_/g, ' ')
                : null;

            const product = productMatch
                ? productMatch[1]
                : null;

            const manufacturer = manufacturerMatch
                ? manufacturerMatch[1]
                : null;

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

        return devices;
    }

    // -----------------------------
    // USB DEBUGGING / CONNECTION CHECK
    // -----------------------------
    async enableUsbDebugging(deviceId) {
        if (!deviceId) return false;

        const result = await this.executeAdb(
            ['shell', 'echo', 'test'],
            deviceId
        );

        return result.success && result.output === 'test';
    }

    // -----------------------------
    // GET ADB VERSION
    // -----------------------------
    async getAdbVersion() {
        const result = await this.executeAdb(['version']);

        if (!result.success) {
            return {
                success: false,
                error: result.error
            };
        }

        return {
            success: true,
            version: result.output
        };
    }
}

export default AdbManager;
