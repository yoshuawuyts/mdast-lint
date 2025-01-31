/**
 * @author Titus Wormer
 * @copyright 2015 Titus Wormer. All rights reserved.
 * @module blockquote-indentation
 * @fileoverview
 *   Warn when blockquotes are either indented too much or too little.
 *
 *   Options: `number`, default: `'consistent'`.
 *
 *   The default value, `consistent`, detects the first used indentation
 *   and will warn when other blockquotes use a different indentation.
 * @example
 *   <!-- Valid, when set to `4`, invalid when set to `2` -->
 *   >   Hello
 *   ...
 *   >   World
 *
 *   <!-- Valid, when set to `2`, invalid when set to `4` -->
 *   > Hello
 *   ...
 *   > World
 *
 *   <!-- Always invalid -->
 *   > Hello
 *   ...
 *   >   World
 */

'use strict';

/*
 * Dependencies.
 */

var visit = require('../utilities/visit');
var toString = require('../utilities/to-string');
var plural = require('../utilities/plural');
var position = require('../utilities/position');

/**
 * Get the indent of a blockquote.
 *
 * @param {Node} node - Node to test.
 * @return {number} - Indentation.
 */
function check(node) {
    var head = node.children[0];
    var indentation = position.start(head).column - position.start(node).column;
    var padding = toString(head).match(/^ +/);

    if (padding) {
        indentation += padding[0].length;
    }

    return indentation;
}

/**
 * Warn when a blockquote has a too large or too small
 * indentation.
 *
 * @param {Node} ast - Root node.
 * @param {File} file - Virtual file.
 * @param {number?} [preferred='consistent'] - Preferred
 *   indentation between a blockquote and its content.
 *   When not a number, defaults to the first found
 *   indentation.
 * @param {Function} done - Callback.
 */
function blockquoteIndentation(ast, file, preferred, done) {
    preferred = isNaN(preferred) || typeof preferred !== 'number' ? null : preferred;

    visit(ast, 'blockquote', function (node) {
        var indent;
        var diff;
        var word;

        if (position.isGenerated(node)) {
            return;
        }

        if (preferred) {
            indent = check(node);
            diff = preferred - indent;
            word = diff > 0 ? 'Add' : 'Remove';

            diff = Math.abs(diff);

            if (diff !== 0) {
                file.warn(
                    word + ' ' + diff + ' ' + plural('space', diff) +
                    ' between blockquote and content',
                    position.start(node.children[0])
                );
            }
        } else {
            preferred = check(node);
        }
    });

    done();
}

/*
 * Expose.
 */

module.exports = blockquoteIndentation;
