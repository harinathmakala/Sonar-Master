/* eslint sort-keys: 0, no-undefined: 0 */

import { generateHTMLPage } from '../../../helpers/misc';
import { getRuleName } from '../../../../src/lib/utils/rule-helpers';
import { IRuleTest } from '../../../helpers/rule-test-type';
import * as ruleRunner from '../../../helpers/rule-runner';

const tests: Array<IRuleTest> = [
    {
        name: `'link' with no initial slashes passes the rule`,
        serverConfig: generateHTMLPage('<link rel="manifest" href="site.webmanifest">')
    },
    {
        name: `'link' with initial / passes the rule`,
        serverConfig: generateHTMLPage('<link rel="manifest" href="/site.webmanifest">')
    },
    {
        name: `'link' with http passes the rule`,
        serverConfig: generateHTMLPage('<link rel="manifest" href="http://localhost/site.webmanifest">')
    },
    {
        name: `'link' with initial // fails the rule`,
        reports: [{
            message: 'Protocol relative URL found: //site.webmanifest',
            position: { column: 37, line: 2 }
        }],
        serverConfig: generateHTMLPage('<link rel="manifest" href="//site.webmanifest">')
    },
    {
        name: `'script' with no initial slashes passes the rule`,
        serverConfig: generateHTMLPage(undefined, '<script src="script.js"></script>')
    },
    {
        name: `'script' with initial / passes the rule`,
        serverConfig: generateHTMLPage(undefined, '<script src="/script.js"></script>')
    },
    {
        name: `'script' with http passes the rule`,
        serverConfig: generateHTMLPage(undefined, '<script src="http://localhost/script.js"></script>')
    },
    {
        name: `'script' with initial // fails the rule`,
        reports: [{
            message: 'Protocol relative URL found: //script.js',
            position: { column: 23, line: 5 }
        }],
        serverConfig: generateHTMLPage(undefined, '<script src="//script.js"></script>')
    },
    {
        name: `'a' with no initial slashes passes the rule`,
        serverConfig: generateHTMLPage(undefined, '<a href="home">home</a>')
    },
    {
        name: `'a' with initial / passes the rule`,
        serverConfig: generateHTMLPage(undefined, '<a href="/home">home</a>')
    },
    {
        name: `'a' with http passes the rule`,
        serverConfig: generateHTMLPage(undefined, '<a href="http://localhost/home">home</a>')
    },
    {
        name: `'a' with initial // fails the rule`,
        reports: [{
            message: 'Protocol relative URL found: //home',
            position: { column: 19, line: 5 }
        }],
        serverConfig: generateHTMLPage(undefined, '<a href="//home">home</a>')
    },
    {
        name: `'script' with no "src" passes the rule`,
        serverConfig: generateHTMLPage(undefined, '<script>var a = 10;</script>')
    }
];

ruleRunner.testRule(getRuleName(__dirname), tests);
