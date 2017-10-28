/**
 * @fileoverview Check for protocol relative URLs.
 */

/*
 * ------------------------------------------------------------------------------
 * Requirements
 * ------------------------------------------------------------------------------
 */

import { Category } from '../../enums/category';
import { debug as d } from '../../utils/debug';
import { IAsyncHTMLElement, IElementFound, IRule, IRuleBuilder } from '../../types'; // eslint-disable-line no-unused-vars
import { cutString } from '../../utils/misc';
import { RuleContext } from '../../rule-context';

const debug = d(__filename);

/*
 * ------------------------------------------------------------------------------
 * Public
 * ------------------------------------------------------------------------------
 */

const rule: IRuleBuilder = {
    create(context: RuleContext): IRule {

        const validate = async (data: IElementFound) => {
            const { element, resource }: { element: IAsyncHTMLElement, resource: string } = data;
            const html: string = await element.outerHTML();

            debug(`Analyzing link\n${cutString(html, 50)}`);

            /*
             * We need to use getAttribute to get the exact value.
             * If we access the src or href properties directly the
             * browser already adds http(s):// so we cannot verify.
             */

            const url: string = (element.getAttribute('src') || element.getAttribute('href') || '').trim();

            if (url.startsWith('//')) {
                debug('Protocol relative URL found');

                await context.report(resource, element, `Protocol relative URL found: ${url}`, url);
            }
        };

        return {
            'element::a': validate,
            'element::link': validate,
            'element::script': validate
        };

    },
    meta: {
        docs: {
            category: Category.security,
            description: 'Disallow protocol relative URLs'
        },
        recommended: true,
        schema: [],
        worksWithLocalFiles: true
    }
};

export default rule;
