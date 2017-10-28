/* eslint sort-keys: 0, no-undefined: 0 */

import * as pluralize from 'pluralize';

import { generateHTMLPage } from '../../../helpers/misc';
import { getRuleName } from '../../../../src/lib/utils/rule-helpers';
import { IRuleTest } from '../../../helpers/rule-test-type';
import * as ruleRunner from '../../../helpers/rule-runner';

const ruleName = getRuleName(__dirname);
const htmlPage = generateHTMLPage(undefined, '<script src="test.js"></script>');

const generateMessage = (values: Array<string>): string => {
    return `'${values.join('\', \'')}' ${pluralize('header', values.length)} ${pluralize('is', values.length)} not needed`;
};

const testsForDefaults: Array<IRuleTest> = [
    {
        name: `Non HTML resource is served without unneded headers`,
        serverConfig: {
            '/': {
                content: htmlPage,
                headers: {
                    'X-Frame-Options': 'SAMEORIGIN',
                    'Content-Type': 'text/html; charset=utf-8'
                }
            },
            '/test.js': { headers: { 'Content-Type': 'application/javascript; charset=utf-8' } }
        }
    },
    {
        name: `Non HTML resource is specified as a data URI`,
        serverConfig: { '/': generateHTMLPage(undefined, '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==">') }
    },
    {
        name: `Non HTML resource is served with unneded header`,
        reports: [{ message: generateMessage(['content-security-policy']) }],
        serverConfig: {
            '/': {
                content: htmlPage,
                headers: {
                    'X-Frame-Options': 'SAMEORIGIN',
                    'Content-Type': 'text/html; charset=utf-8'
                }
            },
            '/test.js': {
                headers: {
                    'Content-Security-Policy': 'default-src "none"',
                    'Content-Type': 'application/javascript; charset=utf-8'
                }
            }
        }
    },
    {
        name: `Non HTML resource is served with multiple unneded headers`,
        reports: [{ message: generateMessage(['content-security-policy', 'x-content-security-policy', 'x-frame-options', 'x-ua-compatible', 'x-webkit-csp', 'x-xss-protection']) }],
        serverConfig: {
            '/': {
                content: htmlPage,
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'X-Content-Security-Policy': 'default-src "none"',
                    'X-Frame-Options': 'DENY',
                    'X-UA-Compatible': 'IE=Edge',
                    'X-WebKit-CSP': 'default-src "none"',
                    'X-XSS-Protection': '1; mode=block'
                }
            },
            '/test.js': {
                headers: {
                    'Content-Type': 'application/javascript; charset=utf-8',
                    'Content-Security-Policy': 'default-src "none"',
                    'X-Content-Security-Policy': 'default-src "none"',
                    'X-Frame-Options': 'DENY',
                    'X-UA-Compatible': 'IE=Edge',
                    'X-WebKit-CSP': 'default-src "none"',
                    'X-XSS-Protection': '1; mode=block'
                }
            }
        }
    },
    {
        name: `HTML document treated as non-HTML resource (no media type) is served with unneded header`,
        reports: [{ message: generateMessage(['x-ua-compatible']) }],
        serverConfig: {
            '/': {
                content: '',
                headers: {
                    'Content-Type': null,
                    'X-UA-Compatible': 'IE=Edge'
                }
            }
        }
    },
    {
        name: `HTML document treated as non-HTML resource (invalid media type) is served with unneded header`,
        reports: [{ message: generateMessage(['x-ua-compatible']) }],
        serverConfig: {
            '/': {
                content: '',
                headers: {
                    'Content-Type': 'invalid',
                    'X-UA-Compatible': 'IE=Edge'
                }
            }
        }
    },
    {
        name: `HTML document treated as non-HTML resource (valid, but incorrect media type) is served with unneded header`,
        reports: [{ message: generateMessage(['x-ua-compatible']) }],
        serverConfig: {
            '/': {
                content: '',
                headers: {
                    'Content-Type': 'image/jpeg',
                    'X-UA-Compatible': 'IE=Edge'
                }
            }
        }
    }
];

const testsForIgnoreConfigs: Array<IRuleTest> = [
    {
        name: `Non HTML resource is served with one unneded headers but ignored because of configs`,
        serverConfig: {
            '/': {
                content: htmlPage,
                headers: {
                    'X-Frame-Options': 'SAMEORIGIN',
                    'Content-Type': 'text/html; charset=utf-8',
                    'X-UA-Compatible': 'IE=Edge'
                }
            },
            '/test.js': {
                headers: {
                    'Content-Security-Policy': 'default-src "none"',
                    'Content-Type': 'application/javascript; charset=utf-8',
                    'X-UA-Compatible': 'IE=Edge'
                }
            }
        }
    }
];

const testsForIncludeConfigs: Array<IRuleTest> = [
    {
        name: `Non HTML resource is served with unneded headers because of configs`,
        reports: [{ message: generateMessage(['content-security-policy', 'x-test-1', 'x-ua-compatible']) }],
        serverConfig: {
            '/': {
                content: htmlPage,
                headers: {
                    'X-Frame-Options': 'SAMEORIGIN',
                    'Content-Type': 'text/html; charset=utf-8',
                    'X-Test-1': 'test',
                    'X-Test-2': 'test'
                }
            },
            '/test.js': {
                headers: {
                    'Content-Security-Policy': 'default-src "none"',
                    'Content-Type': 'application/javascript; charset=utf-8',
                    'X-Test-1': 'test',
                    'X-UA-Compatible': 'IE=Edge'
                }
            }
        }
    }
];

const testsForConfigs: Array<IRuleTest> = [
    {
        name: `Non HTML resource is served with unneded headers that are both ignored and enforced because of configs`,
        reports: [{ message: generateMessage(['content-security-policy', 'x-test-1', 'x-ua-compatible']) }],
        serverConfig: {
            '/': {
                content: htmlPage,
                headers: {
                    'X-Frame-Options': 'SAMEORIGIN',
                    'Content-Type': 'text/html; charset=utf-8',
                    'X-Test-1': 'test',
                    'X-Test-2': 'test'
                }
            },
            '/test.js': {
                headers: {
                    'Content-Security-Policy': 'default-src "none"',
                    'Content-Type': 'application/javascript; charset=utf-8',
                    'X-Test-1': 'test',
                    'X-Test-2': 'test',
                    'X-UA-Compatible': 'IE=Edge'
                }
            }
        }
    }
];

ruleRunner.testRule(ruleName, testsForDefaults);
ruleRunner.testRule(ruleName, testsForIgnoreConfigs, { ruleOptions: { ignore: ['Content-Security-Policy', 'X-UA-Compatible', 'X-Test-1'] } });
ruleRunner.testRule(ruleName, testsForIncludeConfigs, { ruleOptions: { include: ['Content-Security-Policy', 'X-Test-1', 'X-Test-2'] } });
ruleRunner.testRule(ruleName, testsForConfigs, {
    ruleOptions: {
        ignore: ['X-Frame-Options', 'X-Test-2', 'X-Test-3'],
        include: ['X-Test-1', 'X-Test-2', 'X-UA-Compatible']
    }
});
