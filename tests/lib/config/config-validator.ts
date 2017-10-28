import * as _ from 'lodash';
import test from 'ava';

import * as configValidator from '../../../src/lib/config/config-validator';

const validConfig = {
    connector: {
        name: 'chrome',
        options: { waitFor: 1000 }
    },
    formatters: 'json',
    rules: {
        'disallowed-headers': ['warning', {}],
        'manifest-exists': 1,
        'manifest-file-extension': ['warning'],
        'manifest-is-valid': [2],
        'no-friendly-error-pages': [2, {}],
        'no-html-only-headers': 'error',
        'no-protocol-relative-urls': 'off',
        'x-content-type-options': 0
    }
};
const invalidConfig = { formatter: 'json' };

test('if config has an invalid schema, it should return false', (t) => {
    const valid = configValidator.validateConfig(invalidConfig as any);

    t.false(valid);
});

test(`if rule severity isn't valid, it should return false`, (t) => {
    const config = _.cloneDeep(validConfig);

    config.rules['disallowed-headers'] = ['no-valid-severity', {}];

    const valid = configValidator.validateConfig(config as any);

    t.false(valid);
});

test('config with one formatters is valid', (t) => {
    const valid = configValidator.validateConfig(validConfig as any);

    t.true(valid);
});

test('config with 2 formatters is valid', (t) => {
    const validConfigs = Object.assign({ formatters: ['json', 'stylish']}, validConfig);
    const valid = configValidator.validateConfig(validConfigs as any);

    t.true(valid);
});
