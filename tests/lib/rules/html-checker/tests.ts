/* eslint sort-keys: 0, no-undefined: 0 */

import * as mock from 'mock-require';

import { IRuleTest } from '../../../helpers/rule-test-type';
import * as ruleRunner from '../../../helpers/rule-runner';
import { getRuleName } from '../../../../src/lib/utils/rule-helpers';

const ruleName = getRuleName(__dirname);
const exampleUrl = 'https://empty.sonarwhal.com/';
const validatorError = 'error';
const defaultValidator = 'https://validator.w3.org/nu/';
const configValidator = 'https://html5.validator.nu';

// Html checker response that contains no errors
const noErrorMessages = {
    url: exampleUrl,
    messages: []
};

// Response from the default checker that contains errors/warnings
const defaultCheckerMessages = {
    url: exampleUrl,
    messages: [
        {
            type: 'info',
            lastLine: 1,
            lastColumn: 3114,
            firstColumn: 3046,
            subType: 'error',
            message: '“role="none"” is not yet supported in all browsers. Consider instead either using “role="presentation"” or “role="none presentation"”.',
            extract: 'stration"><img src="/images/iceberg-left.svg" id="iceberg1" alt="" role="none"> <img ',
            hiliteStart: 10,
            hiliteLength: 69
        },
        {
            type: 'info',
            lastLine: 1,
            lastColumn: 3462,
            firstColumn: 3459,
            subType: 'warning',
            message: 'Consider using the “h1” element as a top-level heading only (all “h1” elements are treated as top-level headings by many screen readers and other tools)',
            extract: '-section"><h1>example<',
            hiliteStart: 10,
            hiliteLength: 4
        },
        {
            type: 'info',
            lastLine: 1,
            lastColumn: 3000,
            firstColumn: 2000,
            subType: 'warning',
            message: 'Consider using the “h1” element as a top-level heading only (all “h1” elements are treated as top-level headings by many screen readers and other tools)',
            extract: '-section"><h1>example<',
            hiliteStart: 8,
            hiliteLength: 9
        }
    ]
};

// Response from configed validating service other than the default one
const configCheckerMessages = {
    url: exampleUrl,
    messages: [
        {
            type: 'info',
            lastLine: 1,
            lastColumn: 3462,
            firstColumn: 3459,
            subType: 'warning',
            message: 'Something is wrong here.',
            extract: '-section"><h1>example<',
            hiliteStart: 10,
            hiliteLength: 4
        }
    ]
};

const htmlCheckerMock = (response) => {
    const mockedChecker = (scanOptions) => {
        let responseMessages;

        if (response.pass) { // No errors/warnings are detected in the target html
            return Promise.resolve(noErrorMessages);
        }

        if (response.error) { // Errors/warnings are detected in the target html
            const isDefaultChecker = scanOptions.validator === defaultValidator;

            responseMessages = isDefaultChecker ? defaultCheckerMessages : configCheckerMessages;

            return Promise.resolve(responseMessages);
        }

        return Promise.reject(validatorError); // Error with the validator
    };

    mock('html-validator', mockedChecker);
};

const testsForDefaults: Array<IRuleTest> = [
    {
        name: 'No reports if HTML checker returns no messages',
        serverUrl: exampleUrl,
        before() {
            htmlCheckerMock({ pass: true });
        }
    },
    {
        name: 'Reports warnings/errors if the HTML checker returns messages',
        serverUrl: exampleUrl,
        reports: [{
            message: defaultCheckerMessages.messages[0].message,
            position: {
                column: defaultCheckerMessages.messages[0].firstColumn,
                line: defaultCheckerMessages.messages[0].lastLine
            }
        }, {
            message: defaultCheckerMessages.messages[1].message,
            position: {
                column: defaultCheckerMessages.messages[1].firstColumn,
                line: defaultCheckerMessages.messages[1].lastLine
            }
        }],
        before() {
            htmlCheckerMock({ error: true });
        }
    }
];

const testsForIgnoreStringConfigs: Array<IRuleTest> = [
    {
        name: 'Ignore selected message(string) from the report',
        serverUrl: exampleUrl,
        reports: [{
            message: defaultCheckerMessages.messages[0].message,
            position: {
                column: defaultCheckerMessages.messages[0].firstColumn,
                line: defaultCheckerMessages.messages[0].lastLine
            }
        }],
        before() {
            htmlCheckerMock({ error: true });
        }
    }
];

const testsForIgnoreArrayConfigs: Array<IRuleTest> = [
    {
        name: 'Ignore selected messages(array) from the report',
        serverUrl: exampleUrl,
        before() {
            htmlCheckerMock({ error: true });
        }
    }
];

const testsForValidatorConfig: Array<IRuleTest> = [
    {
        name: 'Use configed validator service other than the default',
        serverUrl: exampleUrl,
        reports: [{
            message: configCheckerMessages.messages[0].message,
            position: {
                column: configCheckerMessages.messages[0].firstColumn,
                line: configCheckerMessages.messages[0].lastLine
            }
        }],
        before() {
            htmlCheckerMock({ error: true });
        }
    }
];

const testsForDetailsConfig: Array<IRuleTest> = [
    {
        name: 'Configure to show complete list of errors/warnings',
        serverUrl: exampleUrl,
        before() {
            htmlCheckerMock({ pass: true });
        }
    },
    {
        name: 'Reports warnings/errors if the HTML checker returns messages',
        serverUrl: exampleUrl,
        reports: [{
            message: defaultCheckerMessages.messages[0].message,
            position: {
                column: defaultCheckerMessages.messages[0].firstColumn,
                line: defaultCheckerMessages.messages[0].lastLine
            }
        }, {
            message: defaultCheckerMessages.messages[1].message,
            position: {
                column: defaultCheckerMessages.messages[1].firstColumn,
                line: defaultCheckerMessages.messages[1].lastLine
            }
        }, {
            message: defaultCheckerMessages.messages[2].message,
            position: {
                column: defaultCheckerMessages.messages[2].firstColumn,
                line: defaultCheckerMessages.messages[2].lastLine
            }
        }],
        before() {
            htmlCheckerMock({ error: true });
        }
    }
];

const testsForErrors: Array<IRuleTest> = [
    {
        name: 'Reports error when not able to get result from the HTML Checker',
        serverUrl: exampleUrl,
        reports: [{ message: `Couldn't get results from HTML checker for ${exampleUrl}. Error: ${validatorError}` }],
        before() {
            htmlCheckerMock({ reject: true });
        }
    }
];

ruleRunner.testRule(ruleName, testsForDefaults, { serial: true });
ruleRunner.testRule(ruleName, testsForIgnoreStringConfigs, {
    ruleOptions: { ignore: defaultCheckerMessages.messages[1].message },
    serial: true
});
ruleRunner.testRule(ruleName, testsForIgnoreArrayConfigs, {
    ruleOptions: { ignore: [defaultCheckerMessages.messages[0].message, defaultCheckerMessages.messages[1].message] },
    serial: true
});
ruleRunner.testRule(ruleName, testsForValidatorConfig, {
    ruleOptions: { validator: configValidator },
    serial: true
});
ruleRunner.testRule(ruleName, testsForDetailsConfig, {
    ruleOptions: { details: true },
    serial: true
});

ruleRunner.testRule(ruleName, testsForErrors);
