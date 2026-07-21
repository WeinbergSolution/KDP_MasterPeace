import ts from 'typescript';

/**
 * Reports whether a raw source line contains executable code (i.e. it is not
 * blank, not comment-only, and not just block punctuation like braces).
 *
 * @param raw A single physical source line.
 * @returns True when the line counts towards the executable line budget.
 */
function isExecutableLine(raw) {
  const line = raw.trim();
  if (!line) return false;
  if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*'))
    return false;
  return !/^[)}\]{(;,]*$/.test(line);
}

/**
 * Counts executable lines inside a function block body, excluding the braces,
 * blank lines and comment lines (AGENTS.md §5.2).
 *
 * @param body The function's block body node.
 * @param sf The parent source file.
 * @param lines The file split into physical lines.
 * @returns The number of executable code lines in the body.
 */
function bodyExecutableLines(body, sf, lines) {
  const open = sf.getLineAndCharacterOfPosition(body.getStart(sf)).line;
  const close = sf.getLineAndCharacterOfPosition(body.end).line;
  let count = 0;
  for (let i = open + 1; i < close; i++)
    if (isExecutableLine(lines[i] ?? '')) count += 1;
  return count;
}

/**
 * Derives a human-readable name for a function-like node.
 *
 * @param node The function-like declaration.
 * @returns The declared or inferred name, or '(anonymous)'.
 */
function nameOf(node) {
  if (ts.isConstructorDeclaration(node)) return 'constructor';
  if (node.name) return node.name.getText();
  if (ts.isVariableDeclaration(node.parent) && node.parent.name)
    return node.parent.name.getText();
  return '(anonymous)';
}

/**
 * Checks for a JSDoc block (`/** ... *\/`) immediately preceding a node.
 *
 * @param node The node to inspect.
 * @param text The full source text.
 * @returns True when a JSDoc comment precedes the node.
 */
function hasJsDoc(node, text) {
  const ranges = ts.getLeadingCommentRanges(text, node.getFullStart()) ?? [];
  return ranges.some((r) => text.slice(r.pos, r.pos + 3) === '/**');
}

/**
 * Decides whether a function-like node requires JSDoc (AGENTS.md §7): named
 * function declarations, non-constructor methods, accessors and exported
 * arrow constants. Anonymous callbacks and constructors are exempt.
 *
 * @param node The function-like declaration.
 * @returns True when the node must carry JSDoc.
 */
function requiresJsDoc(node) {
  if (ts.isFunctionDeclaration(node) && node.name) return true;
  if (ts.isMethodDeclaration(node) && node.name) return true;
  if (ts.isGetAccessor(node) || ts.isSetAccessor(node)) return true;
  const decl = node.parent;
  return (
    ts.isArrowFunction(node) &&
    ts.isVariableDeclaration(decl) &&
    nameOf(node) !== '(anonymous)'
  );
}

/**
 * Collects every function-like node with a block body in a source file.
 *
 * @param sf The parsed source file.
 * @returns The list of function-like declaration nodes.
 */
function collectNodes(sf) {
  const nodes = [];
  const visit = (node) => {
    if (ts.isFunctionLike(node) && node.body && ts.isBlock(node.body))
      nodes.push(node);
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return nodes;
}

/**
 * Parses a TypeScript source file and analyses each function for the coding
 * checks (executable line budget and JSDoc requirement).
 *
 * @param filePath Path of the file (used for diagnostics and script kind).
 * @param text The full source text.
 * @returns One analysis record per function-like node with a block body.
 */
export function analyzeFunctions(filePath, text) {
  const sf = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true);
  const lines = text.split('\n');
  return collectNodes(sf).map((node) => ({
    name: nameOf(node),
    line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1,
    execLines: bodyExecutableLines(node.body, sf, lines),
    requiresJsDoc: requiresJsDoc(node),
    hasJsDoc: hasJsDoc(node, text),
  }));
}
