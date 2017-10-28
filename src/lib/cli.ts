/**
 * @fileoverview Main CLI object, it reads the configuration (from file and parameters)
 * and passes it to the engine
 */

/*
 * The CLI object should *not* call process.exit() directly. It should only return
 * exit codes. This allows other programs to use the CLI object and still control
 * when the program exits.
 */

/*
 * ------------------------------------------------------------------------------
 * Requirements
 * ------------------------------------------------------------------------------
 */

import * as path from 'path';

import chalk from 'chalk';
import * as updateNotifier from 'update-notifier';

import { CLIOptions } from './types';
import * as logger from './utils/logging';
import { loadJSONFile } from './utils/misc';

import { options } from './cli/options';
import { cliActions } from './cli/actions';

/** Notify user if the current version of sonar is not up to date. */
const notifyIfNeeded = () => {
    const pkg = loadJSONFile(path.join(__dirname, '../../../package.json'));
    /*
     * Fetch and persist comparison result in the background.
     * Check interval is set as one day by default.
     * To test immediately, set `updateCheckInterval` to 0 and pass it in as a param to `updateNotifier`.
     * Comparison result is loaded on the FIRST initiation, but users won't be notified until the SECOND time it runs.
     * Reference:https://github.com/yeoman/update-notifier#how
     */
    const notifier = updateNotifier({
        pkg,
        updateCheckInterval: 1000 * 60 * 60 * 1 // One hour.
    });

    const update = notifier.update;

    if (!update || update.latest === pkg.version) {
        return;
    }

    const changelogUrl: string = `https://sonarwhal.com/about/changelog.html`;
    /*
     * No indentation due to the use of `\` to avoid new line.
     * https://stackoverflow.com/a/35428171
     */
    const message: string = `Update available ${chalk.red(update.current)}${chalk.reset(' → ')}${chalk.green(update.latest)}\
\nSee ${chalk.cyan(changelogUrl)} for details`;

    notifier.notify({ message });
};

/*
 * ------------------------------------------------------------------------------
 * Public
 * ------------------------------------------------------------------------------
 */

/** Executes the CLI based on an array of arguments that is passed in. */
export const execute = async (args: string | Array<string> | Object): Promise<number> => {
    const currentOptions: CLIOptions = options.parse(args);
    let handled = false;

    notifyIfNeeded();

    while (cliActions.length > 0 && !handled) {
        const action = cliActions.shift();

        try {
            handled = await action(currentOptions);
        } catch (e) {
            logger.error(e);

            return 1;
        }
    }

    return handled ? 0 : 1;
};
