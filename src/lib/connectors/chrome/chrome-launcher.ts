/**
 * @fileoverview Launches the given browser with the right configuration to be used via the Chrome Debugging Protocol
 *
 * Supported browsers: Chrome
 *
 * This is a mix between:
 * * [lighthouse chrome launcher](https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-cli/chrome-launcher.ts) (Apache 2.0 License)
 * * [karma chrome launcher](https://github.com/karma-runner/karma-chrome-launcher/blob/master/index.js) (MIT License)
 * * And custom code
 *
 */

import * as chromeLauncher from 'chrome-launcher';
import * as isCI from 'is-ci';
import * as lockfile from 'lockfile';
import { promisify } from 'util';

import { Launcher } from '../debugging-protocol-common/launcher';
import { BrowserInfo, LauncherOptions } from '../../types';
import * as logger from '../../utils/logging';
import { debug as d } from '../../utils/debug';
import { readFileAsync, writeFileAsync } from '../../utils/misc';

const debug: debug.IDebugger = d(__filename);
const lock = promisify(lockfile.lock);
const unlock = promisify(lockfile.unlock);

export class CDPLauncher extends Launcher {
    public constructor(options: LauncherOptions) {
        super(options);
    }

    /** If a browser is already running, it returns its pid. Otherwise return value is -1.  */
    private async getBrowserInfo(): Promise<BrowserInfo> {
        let result = {
            pid: -1,
            port: this.port
        };

        try {
            result = JSON.parse(await readFileAsync(this.pidFile));
        } catch (e) {
            debug(`Error reading ${this.pidFile}`);
            debug(e);
            result = {
                pid: -1,
                port: this.port
            };
        }

        if (Number.isNaN(result.pid)) {
            return {
                pid: -1,
                port: this.port
            };
        }

        try {
            /*
             * We test if the process is still running or is a leftover:
             * https://nodejs.org/api/process.html#process_process_kill_pid_signal
             */

            process.kill(result.pid, 0);
        } catch (e) {
            debug(`Process with ${result.pid} doesn't seem to be running`);
            result = {
                pid: -1,
                port: this.port
            };
        }

        return result;
    }

    /** Stores the `pid` of the given `child` into a file. */
    private async writePid(browserInfo: BrowserInfo) {
        await writeFileAsync(this.pidFile, JSON.stringify({ pid: browserInfo.pid, port: browserInfo.port || this.port }, null, 4));
    }

    public async launch(url): Promise<BrowserInfo> {
        const cdpLock = 'cdp.lock';

        try {
            await lock(cdpLock, {
                pollPeriod: 500,
                retries: 20,
                retryWait: 1000,
                stale: 50000,
                wait: 50000
            });
        } catch (e) {
            logger.error('Error while locking', e);
            throw e;
        }
        // If a browser is already launched using `launcher` then we return its PID.
        const currentInfo = await this.getBrowserInfo();

        if (currentInfo.pid !== -1) {
            await unlock(cdpLock);

            currentInfo.isNew = false;

            return currentInfo;
        }

        try {
            const chromeFlags: Array<string> = [];

            chromeFlags.push('--no-default-browser-check');

            if (isCI) {
                chromeFlags.push('--headless', '--disable-gpu');
            }

            const chrome: chromeLauncher.LaunchedChrome = await chromeLauncher.launch({
                chromeFlags,
                startingUrl: url
            });

            const browserInfo = {
                isNew: true,
                pid: chrome.pid,
                port: chrome.port
            };

            browserInfo.port = browserInfo.port || this.port;
            this.port = browserInfo.port;
            await this.writePid(browserInfo);

            debug('Browser launched correctly');

            await unlock(cdpLock);

            return browserInfo;
        } catch (e) {
            debug('Error launching browser');
            debug(e);

            await unlock(cdpLock);

            throw e;
        }
    }
}
