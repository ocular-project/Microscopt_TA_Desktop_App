
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { randomUUID } from 'node:crypto';
import extract from 'extract-zip';

class AdbInstaller {
    constructor(app) {
        this.app = app;

        this.toolsDirectory = path.join(
            app.getPath('userData'),
            'tools'
        );

        this.installDirectory = path.join(
            this.toolsDirectory,
            'platform-tools'
        );
    }

    // --------------------------------
    // REPORT PROGRESS
    // --------------------------------

    reportProgress(callback, step, message, percent = 0) {
        const progress = {
            type: 'progress',
            step,
            message,
            percent
        };

        console.log(`[ADB] ${message}`);

        try {
            callback?.(progress);
        } catch (error) {
            console.error(
                '[ADB] Progress callback failed:',
                error.message
            );
        }
    }

    // --------------------------------
    // GET PLATFORM TOOLS URL
    // --------------------------------

    getDownloadUrl() {
        switch (process.platform) {
            case 'win32':
                return 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip';

            case 'darwin':
                return 'https://dl.google.com/android/repository/platform-tools-latest-darwin.zip';

            case 'linux':
                return 'https://dl.google.com/android/repository/platform-tools-latest-linux.zip';

            default:
                throw new Error(
                    `Unsupported operating system: ${process.platform}`
                );
        }
    }

    // --------------------------------
    // GET ADB EXECUTABLE
    // --------------------------------

    getAdbExecutable(directory = this.installDirectory) {
        const executable = process.platform === 'win32'
            ? 'adb.exe'
            : 'adb';

        return path.join(directory, executable);
    }

    // --------------------------------
    // CHECK EXISTING INSTALLATION
    // --------------------------------

    async checkInstallation() {
        const adbPath = this.getAdbExecutable();

        if (!fs.existsSync(adbPath)) {
            return false;
        }

        const result = await this.verifyAdb(adbPath);

        return result.success;
    }

    // --------------------------------
    // DOWNLOAD FILE
    // --------------------------------

    async downloadFile(url, destination, onProgress, redirects = 5) {
        if (redirects < 0) {
            throw new Error('Too many download redirects.');
        }

        const response = await new Promise((resolve, reject) => {
            const request = https.get(url, (res) => {
                if (
                    res.statusCode >= 300 &&
                    res.statusCode < 400 &&
                    res.headers.location
                ) {
                    res.resume();

                    resolve({
                        redirect: new URL(
                            res.headers.location,
                            url
                        ).toString()
                    });

                    return;
                }

                if (res.statusCode !== 200) {
                    res.resume();

                    reject(
                        new Error(
                            `Download failed. HTTP ${res.statusCode}`
                        )
                    );

                    return;
                }

                resolve({ response: res });
            });

            request.setTimeout(30000, () => {
                request.destroy(
                    new Error('Download timed out. Check your internet connection.')
                );
            });

            request.on('error', reject);
        });

        if (response.redirect) {
            return this.downloadFile(
                response.redirect,
                destination,
                onProgress,
                redirects - 1
            );
        }

        const res = response.response;

        const totalBytes =
            Number(res.headers['content-length']) || 0;

        let downloadedBytes = 0;
        let lastReportedPercent = -1;
        let lastReportedMegabytes = 0;

        await fs.promises.mkdir(
            path.dirname(destination),
            { recursive: true }
        );

        const progressStream = new Transform({
            transform: (chunk, encoding, callback) => {
                downloadedBytes += chunk.length;

                const downloadedMB =
                    downloadedBytes / (1024 * 1024);

                if (totalBytes > 0) {
                    const percent = Math.min(
                        100,
                        Math.floor(
                            (downloadedBytes / totalBytes) * 100
                        )
                    );

                    if (percent !== lastReportedPercent) {
                        lastReportedPercent = percent;

                        onProgress?.({
                            percent,
                            downloadedBytes,
                            totalBytes,
                            downloadedMB: downloadedMB.toFixed(2),
                            totalMB: (
                                totalBytes / (1024 * 1024)
                            ).toFixed(2)
                        });
                    }
                } else if (
                    downloadedMB - lastReportedMegabytes >= 1
                ) {
                    lastReportedMegabytes = Math.floor(downloadedMB);

                    onProgress?.({
                        percent: null,
                        downloadedBytes,
                        totalBytes: 0,
                        downloadedMB: downloadedMB.toFixed(2),
                        totalMB: null
                    });
                }

                callback(null, chunk);
            }
        });

        try {
            await pipeline(
                res,
                progressStream,
                fs.createWriteStream(destination)
            );

            if (
                totalBytes > 0 &&
                downloadedBytes !== totalBytes
            ) {
                throw new Error(
                    'Downloaded file size does not match the expected size.'
                );
            }

            onProgress?.({
                percent: 100,
                downloadedBytes,
                totalBytes,
                downloadedMB: (
                    downloadedBytes / (1024 * 1024)
                ).toFixed(2),
                totalMB: totalBytes
                    ? (totalBytes / (1024 * 1024)).toFixed(2)
                    : null
            });

        } catch (error) {
            await fs.promises.rm(destination, { force: true });
            throw error;
        }
    }

    // --------------------------------
    // VERIFY ADB
    // --------------------------------

    verifyAdb(adbPath) {
        return new Promise((resolve) => {
            const proc = spawn(adbPath, ['version'], {
                windowsHide: true
            });

            let output = '';
            let errorOutput = '';
            let settled = false;

            const finish = (result) => {
                if (settled) return;

                settled = true;
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
                    error: error.message
                });
            });

            proc.on('close', (code) => {
                finish({
                    success: code === 0,
                    output: output.trim(),
                    error: code === 0
                        ? null
                        : errorOutput.trim() ||
                          `ADB exited with code ${code}`
                });
            });
        });
    }

    // --------------------------------
    // INSTALL ADB
    // --------------------------------

    async install({ onProgress } = {}) {
        const stagingDirectory = path.join(
            this.toolsDirectory,
            `platform-tools-staging-${randomUUID()}`
        );

        const zipPath = path.join(
            stagingDirectory,
            'platform-tools.zip'
        );

        const backupDirectory = path.join(
            this.toolsDirectory,
            `platform-tools-backup-${randomUUID()}`
        );

        let backupCreated = false;

        try {
            this.reportProgress(
                onProgress,
                'checking',
                'Checking existing ADB installation...',
                0
            );

            if (await this.checkInstallation()) {
                this.reportProgress(
                    onProgress,
                    'complete',
                    'ADB is already installed and working.',
                    100
                );

                return {
                    success: true,
                    adbPath: this.getAdbExecutable(),
                    alreadyInstalled: true
                };
            }

            // 1. Detect operating system
            this.reportProgress(
                onProgress,
                'detecting',
                `Detecting operating system: ${process.platform} (${process.arch})`,
                5
            );

            const downloadUrl = this.getDownloadUrl();

            // 2. Prepare directory
            this.reportProgress(
                onProgress,
                'preparing',
                'Preparing installation directory...',
                10
            );

            await fs.promises.mkdir(
                stagingDirectory,
                { recursive: true }
            );

            // 3. Download
            this.reportProgress(
                onProgress,
                'download',
                'Connecting to Google servers...',
                12
            );

            await this.downloadFile(
                downloadUrl,
                zipPath,
                (progress) => {
                    const percent = progress.percent;

                    this.reportProgress(
                        onProgress,
                        'download',
                        percent === null
                            ? `Downloaded ${progress.downloadedMB} MB`
                            : `Downloading Platform Tools: ${percent}% (${progress.downloadedMB} MB / ${progress.totalMB} MB)`,
                        percent === null
                            ? 12
                            : 12 + Math.floor(percent * 0.53)
                    );
                }
            );

            // 4. Extract
            this.reportProgress(
                onProgress,
                'extracting',
                'Extracting Android Platform Tools...',
                67
            );

            await extract(zipPath, {
                dir: stagingDirectory
            });

            const extractedDirectory = path.join(
                stagingDirectory,
                'platform-tools'
            );

            const extractedAdb = this.getAdbExecutable(
                extractedDirectory
            );

            if (!fs.existsSync(extractedAdb)) {
                throw new Error(
                    'ADB executable was not found after extraction.'
                );
            }

            this.reportProgress(
                onProgress,
                'extracting',
                'Platform Tools extracted successfully.',
                75
            );

            // 5. Permissions
            if (process.platform !== 'win32') {
                this.reportProgress(
                    onProgress,
                    'permissions',
                    'Setting ADB executable permissions...',
                    80
                );

                await fs.promises.chmod(
                    extractedAdb,
                    0o755
                );
            }

            // 6. Verify before installation
            this.reportProgress(
                onProgress,
                'verification',
                'Verifying downloaded ADB executable...',
                85
            );

            const verification = await this.verifyAdb(
                extractedAdb
            );

            if (!verification.success) {
                throw new Error(
                    `ADB verification failed: ${verification.error}`
                );
            }

            console.log(verification.output);

            // 7. Replace installation
            this.reportProgress(
                onProgress,
                'installation',
                'Installing Platform Tools into application directory...',
                90
            );

            await fs.promises.mkdir(
                this.toolsDirectory,
                { recursive: true }
            );

            if (fs.existsSync(this.installDirectory)) {
                await fs.promises.rename(
                    this.installDirectory,
                    backupDirectory
                );

                backupCreated = true;
            }

            try {
                await fs.promises.rename(
                    extractedDirectory,
                    this.installDirectory
                );
            } catch (error) {
                if (backupCreated) {
                    await fs.promises.rename(
                        backupDirectory,
                        this.installDirectory
                    );

                    backupCreated = false;
                }

                throw error;
            }

            // 8. Final verification
            this.reportProgress(
                onProgress,
                'verification',
                'Performing final ADB verification...',
                95
            );

            const finalAdbPath = this.getAdbExecutable();

            const finalVerification = await this.verifyAdb(
                finalAdbPath
            );

            if (!finalVerification.success) {
                throw new Error(
                    `Final ADB verification failed: ${finalVerification.error}`
                );
            }

            // Remove old backup only after successful verification
            if (backupCreated) {
                await fs.promises.rm(
                    backupDirectory,
                    {
                        recursive: true,
                        force: true
                    }
                );

                backupCreated = false;
            }

            this.reportProgress(
                onProgress,
                'complete',
                'ADB installation completed successfully!',
                100
            );

            console.log(finalVerification.output);

            return {
                success: true,
                adbPath: finalAdbPath,
                alreadyInstalled: false
            };

        } catch (error) {
            console.error(
                '[ADB] Installation error:',
                error
            );

            // Restore previous installation if possible
            if (
                backupCreated &&
                fs.existsSync(backupDirectory)
            ) {
                try {
                    if (fs.existsSync(this.installDirectory)) {
                        await fs.promises.rm(
                            this.installDirectory,
                            {
                                recursive: true,
                                force: true
                            }
                        );
                    }

                    await fs.promises.rename(
                        backupDirectory,
                        this.installDirectory
                    );

                    backupCreated = false;

                } catch (restoreError) {
                    console.error(
                        '[ADB] Backup restoration failed:',
                        restoreError
                    );
                }
            }

            this.reportProgress(
                onProgress,
                'error',
                'ADB installation failed.',
                0
            );

            return {
                success: false,
                error: error.message
            };

        } finally {
            await fs.promises.rm(
                stagingDirectory,
                {
                    recursive: true,
                    force: true
                }
            ).catch((error) => {
                console.error(
                    '[ADB] Temporary directory cleanup failed:',
                    error.message
                );
            });
        }
    }

    async checkInternetConnection() {
        return new Promise((resolve) => {
            const request = https.get(
                'https://dl.google.com',
                (response) => {
                    response.resume();
                    resolve(true);
                }
            );

            request.setTimeout(8000, () => {
                request.destroy();
                resolve(false);
            });

            request.on('error', () => {
                resolve(false);
            });
        });
    }
}

export default AdbInstaller;
