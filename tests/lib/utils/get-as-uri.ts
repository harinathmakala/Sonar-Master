import * as url from 'url';

import test from 'ava';

import { getAsUri, getAsUris } from '../../../src/lib/utils/get-as-uri';

/*
 * TS complains that "Property Url does not exist on type 'typeof "url"'"
 * if we do `instanceof url.Url`
 * We bypasse the limitation this way
 */
const Url = url.parse('http://locahost').constructor;

const normalize = (path) => {
    const prefix = path.indexOf('/') === 0 ? '' : '/';

    return prefix + path.replace(/\\/g, '/');
};

const targets = [
    [__filename, `file://${normalize(__filename)}`],
    ['localhost', 'http://localhost/'],
    ['https://www.wikipedia.org', 'https://www.wikipedia.org/'],
    ['www.wikipedia.org', 'http://www.wikipedia.org/'],
    [`file://${normalize(__filename)}`, `file://${normalize(__filename)}`],
    [`${__filename}noexists`, null]
];

test('getAsUri converts http, file and path strings to valid url.Url objects', (t) => {
    targets.forEach((target) => {
        const uri = getAsUri(target[0]);

        if (target[1]) {
            t.true(uri instanceof Url);
            t.is(url.format(uri).toLowerCase(), target[1].toLowerCase());
        } else {
            t.falsy(uri);
        }
    });
});

test('getAsUris converts to url.Url and removes invalid entries', (t) => {
    const urls = targets.map((entry) => {
        return entry[0];
    });

    const results = getAsUris(urls);

    t.is(results.length, 5);
    results.forEach((result) => {
        t.true(result instanceof Url);
    });
});
