/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer. All rights reserved.
 * @module maximum-line-length
 * @fileoverview
 *   Warn when lines are too long.
 *
 *   Options: `number`, default: `80`.
 *
 *   Ignores nodes which cannot be wrapped, such as heasings, tables,
 *   code, link, and images.
 * @example
 *   <!-- Valid, when set to `40` -->
 *   Alpha bravo charlie delta echo.
 *
 *   Alpha bravo charlie delta echo [foxtrot](./foxtrot.html).
 *
 *   # Alpha bravo charlie delta echo foxtrot golf hotel.
 *
 *       # Alpha bravo charlie delta echo foxtrot golf hotel.
 *
 *   | A     | B     | C       | D     | E    | F       | F    | H     |
 *   | ----- | ----- | ------- | ----- | ---- | ------- | ---- | ----- |
 *   | Alpha | bravo | charlie | delta | echo | foxtrot | golf | hotel |
 *
 *   <!-- Invalid, when set to `40` -->
 *   Alpha bravo charlie delta echo foxtrot golf.
 *
 *   Alpha bravo charlie delta echo [foxtrot](./foxtrot.html) golf.
 */

'use strict';

/*
 * Dependencies.
 */

var visit = require('../utilities/visit');
var position = require('../utilities/position');

/*
 * Methods.
 */

var start = position.start;
var end = position.end;

/**
 * Check if `node` is applicable, as in, if it should be
 * ignored.
 *
 * @param {Node} node - Node to test.
 * @return {boolean} - Whether or not `node` should be
 *   ignored.
 */
function isApplicable(node) {
    return node.type === 'heading' ||
        node.type === 'table' ||
        node.type === 'code';
}

/**
 * Warn when lines are too long.  This rule is forgiving
 * about lines which cannot be wrapped, such as code,
 * tables, and headings, or links at the enc of a line.
 *
 * @param {Node} ast - Root node.
 * @param {File} file - Virtual file.
 * @param {number?} [preferred=80] - Maximum line length.
 * @param {Function} done - Callback.
 */
function maximumLineLength(ast, file, preferred, done) {
    var style = preferred && preferred !== true ? preferred : 80;
    var content = file.toString();
    var matrix = content.split('\n');
    var index = -1;
    var length = matrix.length;
    var lineLength;

    /**
     * Whitelist from `initial` to `final`, zero-based.
     *
     * @param {number} initial
     * @param {number} final
     */
    function whitelist(initial, final) {
        initial--;

        while (++initial < final) {
            matrix[initial] = '';
        }
    }

    /*
     * Next, white list nodes which cannot be wrapped.
     */

    visit(ast, function (node) {
        var applicable = isApplicable(node);
        var initial = applicable && start(node).line;
        var final = applicable && end(node).line;

        if (!applicable || position.isGenerated(node)) {
            return;
        }

        whitelist(initial - 1, final);
    });

    /**
     * Finally, whitelist URLs, but only if they occur at
     * or after the wrap.  However, when they do, and
     * there’s white-space after it, they are not
     * whitelisted.
     *
     * @param {Node} node
     * @param {number} pos
     * @param {Node} parent
     */
    function validateLink(node, pos, parent) {
        var next = parent.children[pos + 1];
        var initial = start(node);
        var final = end(node);

        /*
         * Nothing to whitelist when generated.
         */

        if (position.isGenerated(node)) {
            return;
        }

        /*
         * No whitelisting when starting after the border,
         * or ending before it.
         */

        if (initial.column > style || final.column < style) {
            return;
        }

        /*
         * No whitelisting when there’s white-space after
         * the link.
         */

        if (
            next &&
            start(next).line === initial.line &&
            (!next.value || /^(.+?[ \t].+?)/.test(next.value))
        ) {
            return;
        }

        whitelist(initial.line - 1, final.line);
    }

    visit(ast, 'link', validateLink);
    visit(ast, 'image', validateLink);

    /*
     * Iterate over every line, and warn for
     * violating lines.
     */

    while (++index < length) {
        lineLength = matrix[index].length;

        if (lineLength > style) {
            file.warn('Line must be at most ' + style + ' characters', {
                'line': index + 1,
                'column': lineLength + 1
            });
        }
    }

    done();
}

/*
 * Expose.
 */

module.exports = maximumLineLength;
