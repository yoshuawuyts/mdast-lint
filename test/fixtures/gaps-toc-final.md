# Foo

## Table of Contents

This paragraph is removed by mdast-toc. However, a rule such as
`no-consecutive-blank-lines` cannot see this node as it has no
position. **mdast-lint** knows that this node has no positional
information and can ignore the space between the ToC heading
and end of the document, thus ignoring any messages between
nodes.
