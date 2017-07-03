import * as assert from "assert";
import * as qub from "qub";

import * as interfaces from "../sources/Interfaces";
import * as mocks from "../sources/Mocks";

suite("Interfaces", () => {
    suite("Completion", () => {
        test("with no description", () => {
            const completion = new interfaces.Completion("A", new qub.Span(1, 2));
            assert.deepStrictEqual(completion.label, "A");
            assert.deepStrictEqual(completion.span, new qub.Span(1, 2));
            assert.deepStrictEqual(completion.description, "");
        });

        test("with description", () => {
            const completion = new interfaces.Completion("B", new qub.Span(3, 4), "C");
            assert.deepStrictEqual(completion.label, "B");
            assert.deepStrictEqual(completion.span, new qub.Span(3, 4));
            assert.deepStrictEqual(completion.description, "C");
        });
    });

    suite("Hover", () => {
        test("with one line", () => {
            const hover = new interfaces.Hover(["Hello"], new qub.Span(5, 6));
            assert.deepStrictEqual(hover.textLines, ["Hello"]);
            assert.deepStrictEqual(hover.span, new qub.Span(5, 6));
        });
    });

    suite("TextDocumentChange", () => {
        test("insert text", () => {
            const change = new interfaces.TextDocumentChange(undefined, new qub.Span(7, 0), "I'm an insertion!");
            assert.deepStrictEqual(change.editor, undefined);
            assert.deepStrictEqual(change.textDocument, undefined);
            assert.deepStrictEqual(change.span, new qub.Span(7, 0));
            assert.deepStrictEqual(change.startIndex, 7);
            assert.deepStrictEqual(change.afterChangeAfterEndIndex, 24);
            assert.deepStrictEqual(change.text, "I'm an insertion!");
        });

        test("delete text", () => {
            const change = new interfaces.TextDocumentChange(null, new qub.Span(8, 9), "");
            assert.deepStrictEqual(change.editor, undefined);
            assert.deepStrictEqual(change.textDocument, undefined);
            assert.deepStrictEqual(change.span, new qub.Span(8, 9));
            assert.deepStrictEqual(change.startIndex, 8);
            assert.deepStrictEqual(change.afterChangeAfterEndIndex, 8);
            assert.deepStrictEqual(change.text, "");
        });

        test("replace text", () => {
            const document = new mocks.TextDocument("MOCK_LANGUAGE", "mock://document.uri", "MOCK_DOCUMENT_TEXT");
            const editor = new mocks.TextEditor(document)
            const change = new interfaces.TextDocumentChange(editor, new qub.Span(0, 4), "HAPPY");
            assert.deepStrictEqual(change.editor, editor);
            assert.deepStrictEqual(change.textDocument, document);
            assert.deepStrictEqual(change.span, new qub.Span(0, 4));
            assert.deepStrictEqual(change.startIndex, 0);
            assert.deepStrictEqual(change.afterChangeAfterEndIndex, 5);
            assert.deepStrictEqual(change.text, "HAPPY");
        });
    });
});