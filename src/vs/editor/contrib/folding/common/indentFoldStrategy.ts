/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import EditorCommon = require('vs/editor/common/editorCommon');
import {IFoldingRange} from 'vs/editor/contrib/folding/common/foldingRange';

export function computeRanges(model: EditorCommon.IModel, tabSize: number, minimumRangeSize: number = 1): IFoldingRange[] {

	let result: IFoldingRange[] = [];

	let previousRegions: { indent: number, line: number }[] = [];
	previousRegions.push({ indent: -1, line: model.getLineCount() + 1 }); // sentinel, to make sure there's at least one entry

	for (let line = model.getLineCount(); line > 0; line--) {
		let indent = computeIndentLevel(model.getLineContent(line), tabSize);
		if (indent === -1) {
			continue; // only whitespace
		}

		let previous = previousRegions[previousRegions.length - 1];

		if (previous.indent > indent) {
			// discard all regions with larger indent
			do {
				previousRegions.pop();
				previous = previousRegions[previousRegions.length - 1];
			} while (previous.indent > indent);

			// new folding range
			let endLineNumber = previous.line - 1;
			if (endLineNumber - line >= minimumRangeSize) {
				result.push({ startLineNumber: line, endLineNumber });
			}
		}
		if (previous.indent === indent) {
			previous.line = line;
		} else { // previous.indent < indent
			// new region with a bigger indent
			previousRegions.push({ indent, line });
		}
	}
	return result;
}


function computeIndentLevel(line: string, tabSize: number): number {
	let i = 0;
	let indent = 0;
	while (i < line.length) {
		let ch = line.charAt(i);
		if (ch === ' ') {
			indent++;
		} else if (ch === '\t') {
			indent++;
			indent += (indent % tabSize);
		} else {
			break;
		}
		i++;
	}
	if (i === line.length) {
		return -1; // line only consists of whitespace
	}
	return indent;
}
