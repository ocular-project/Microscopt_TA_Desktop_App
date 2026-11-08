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

    // -----------------------------
    // GET PLATFORM TOOLS URL
    // -----------------------------
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
                    `Unsupported platform: ${process.platform}`
                );
        }
    }

    // -----------------------------
    // GET ADB EXECUTABLE
    // -----------------------------
    getAdbExecutable(directory = this.installDirectory) {
        const executable = process.platform === 'win32'
            ? 'adb.exe'
            : 'adb';

        return path.join(directory, executable);
    }

    // -----------------------------
    // CHECK EXISTING INSTALLATION
    // -----------------------------
    async checkInstallation() {
        const adbPath = this.getAdbExecutable();

        if (!fs.existsSync(adbPath)) {
            return false;
        }

        const result = await this.verifyAdb(adbPath);

        return result.success;
    }

    // -----------------------------
    // DOWNLOAD FILE
    // -----------------------------
    async downloadFile(url, destination, redirects = 5) {
        if (redirects < 0) {
            throw new Error('Too many download redirects');
        }

        await fs.promises.mkdir(
            path.dirname(destination),
            { recursive: true }
        );

        const response = await new Promise((resolve, reject) => {
            https.get(url, (res) => {
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
            }).on('error', reject);
        });

        if (response.redirect) {
            return this.downloadFile(
                response.redirect,
                destination,
                redirects - 1
            );
        }

        const res = response.response;

        const totalBytes = Number(res.headers['content-length']) || 0;
        let downloadedBytes = 0;
        let lastReportedPercent = -1;

        const progressStream = new Transform({
            transform: (chunk, encoding, callback) => {
                downloadedBytes += chunk.length;

                if (totalBytes > 0) {
                    const percent = Math.floor(
                        (downloadedBytes / totalBytes) * 100
                    );

                    if (
                        percent !== lastReportedPercent &&
                        percent % 5 === 0
                    ) {
                        lastReportedPercent = percent;

                        console.log(
                            `[ADB] Download progress: ${percent}%`
                        );
                    }
                } else if (
                    downloadedBytes % (5 * 1024 * 1024) < chunk.length
                ) {
                    console.log(
                        `[ADB] Downloaded ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`
                    );
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

            console.log('[ADB] Download completed successfully.');

        } catch (error) {
            await fs.promises.rm(destination, { force: true });
            throw error;
        }
    }

    // -----------------------------
    // VERIFY ADB
    // -----------------------------
    verifyAdb(adbPath) {
        return new Promise((resolve) => {
            const proc = spawn(adbPath, ['version']);

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
                    error: error.message
                });
            });

            proc.on('close', (code) => {
                resolve({
                    success: code === 0,
                    output: output.trim(),
                    error: code === 0
                        ? null
                        : errorOutput || `ADB exited with code ${code}`
                });
            });
        });
    }

    // -----------------------------
    // INSTALL ADB
    // -----------------------------
    async install() {
        const stagingDirectory = path.join(
            this.toolsDirectory,
            `platform-tools-staging-${randomUUID()}`
        );

        const zipPath = path.join(
            stagingDirectory,
            'platform-tools.zip'
        );

        const backupDirectory = `${this.installDirectory}-backup`;

        try {
            console.log('\n================================');
            console.log('       ADB INSTALLATION');
            console.log('================================\n');

            console.log(`[ADB] Operating system: ${process.platform}`);
            console.log(`[ADB] Architecture: ${process.arch}`);
            console.log(`[ADB] Target: ${this.installDirectory}`);

            // 1. Check existing installation
            console.log('\n[ADB] Checking existing installation...');

            if (await this.checkInstallation()) {
                console.log('[ADB] A working installation already exists.');

                const verification = await this.verifyAdb(
                    this.getAdbExecutable()
                );

                console.log(verification.output);

                return {
                    success: true,
                    adbPath: this.getAdbExecutable(),
                    alreadyInstalled: true
                };
            }

            // 2. Prepare directories
            console.log('\n[ADB] Preparing installation directory...');

            await fs.promises.mkdir(
                stagingDirectory,
                { recursive: true }
            );

            // 3. Download
            const downloadUrl = this.getDownloadUrl();

            console.log('\n[ADB] Starting Platform Tools download...');
            console.log(`[ADB] Source: ${downloadUrl}`);

            await this.downloadFile(downloadUrl, zipPath);

            // 4. Extract
            console.log('\n[ADB] Extracting Platform Tools...');

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

            console.log('[ADB] Extraction completed.');

            // 5. Set executable permissions
            if (process.platform !== 'win32') {
                console.log('\n[ADB] Setting executable permissions...');

                await fs.promises.chmod(extractedAdb, 0o755);
            }

            // 6. Verify before replacing installation
            console.log('\n[ADB] Verifying downloaded ADB...');

            const verification = await this.verifyAdb(extractedAdb);

            if (!verification.success) {
                throw new Error(
                    `ADB verification failed: ${verification.error}`
                );
            }

            console.log(verification.output);

            // 7. Replace installation atomically
            console.log('\n[ADB] Installing Platform Tools...');

            await fs.promises.mkdir(
                this.toolsDirectory,
                { recursive: true }
            );

            await fs.promises.rm(backupDirectory, {
                recursive: true,
                force: true
            });

            const hadExistingDirectory = fs.existsSync(
                this.installDirectory
            );

            if (hadExistingDirectory) {
                await fs.promises.rename(
                    this.installDirectory,
                    backupDirectory
                );
            }

            try {
                await fs.promises.rename(
                    extractedDirectory,
                    this.installDirectory
                );
            } catch (error) {
                if (hadExistingDirectory) {
                    await fs.promises.rename(
                        backupDirectory,
                        this.installDirectory
                    );
                }

                throw error;
            }

            await fs.promises.rm(backupDirectory, {
                recursive: true,
                force: true
            });

            // 8. Final verification
            console.log('\n[ADB] Performing final verification...');

            const finalAdbPath = this.getAdbExecutable();

            const finalVerification = await this.verifyAdb(
                finalAdbPath
            );

            if (!finalVerification.success) {
                throw new Error(
                    `Final verification failed: ${finalVerification.error}`
                );
            }

            console.log(finalVerification.output);

            console.log('\n================================');
            console.log('   ADB INSTALLATION SUCCESSFUL');
            console.log('================================');
            console.log(`[ADB] Executable: ${finalAdbPath}\n`);

            return {
                success: true,
                adbPath: finalAdbPath,
                alreadyInstalled: false
            };

        } catch (error) {
            console.error('\n[ADB] INSTALLATION FAILED');
            console.error(error);

            return {
                success: false,
                error: error.message
            };

        } finally {
            await fs.promises.rm(stagingDirectory, {
                recursive: true,
                force: true
            });
        }
    }
}

export default AdbInstaller;
