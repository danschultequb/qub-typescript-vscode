import * as assert from "assert";
import * as qub from "qub";

import * as main from "../sources/main";
import * as mock from "../sources/mock";

suite("Main", () => {
    suite("Completion", () => {
        test("with no description", () => {
            const completion = new main.Completion("A", new qub.Span(1, 2));
            assert.deepStrictEqual(completion.label, "A");
            assert.deepStrictEqual(completion.span, new qub.Span(1, 2));
            assert.deepStrictEqual(completion.description, "");
        });

        test("with description", () => {
            const completion = new main.Completion("B", new qub.Span(3, 4), "C");
            assert.deepStrictEqual(completion.label, "B");
            assert.deepStrictEqual(completion.span, new qub.Span(3, 4));
            assert.deepStrictEqual(completion.description, "C");
        });
    });

    suite("Hover", () => {
        test("with one line", () => {
            const hover = new main.Hover(["Hello"], new qub.Span(5, 6));
            assert.deepStrictEqual(hover.textLines, ["Hello"]);
            assert.deepStrictEqual(hover.span, new qub.Span(5, 6));
        });
    });

    suite("TextDocumentChange", () => {
        test("insert text", () => {
            const change = new main.TextDocumentChange(undefined, new qub.Span(7, 0), "I'm an insertion!");
            assert.deepStrictEqual(change.editor, undefined);
            assert.deepStrictEqual(change.textDocument, undefined);
            assert.deepStrictEqual(change.span, new qub.Span(7, 0));
            assert.deepStrictEqual(change.startIndex, 7);
            assert.deepStrictEqual(change.afterChangeAfterEndIndex, 24);
            assert.deepStrictEqual(change.text, "I'm an insertion!");
        });

        test("delete text", () => {
            const change = new main.TextDocumentChange(null, new qub.Span(8, 9), "");
            assert.deepStrictEqual(change.editor, undefined);
            assert.deepStrictEqual(change.textDocument, undefined);
            assert.deepStrictEqual(change.span, new qub.Span(8, 9));
            assert.deepStrictEqual(change.startIndex, 8);
            assert.deepStrictEqual(change.afterChangeAfterEndIndex, 8);
            assert.deepStrictEqual(change.text, "");
        });

        test("replace text", () => {
            const document = new mock.TextDocument("MOCK_LANGUAGE", "mock://document.uri", "MOCK_DOCUMENT_TEXT");
            const editor = new mock.TextEditor(document)
            const change = new main.TextDocumentChange(editor, new qub.Span(0, 4), "HAPPY");
            assert.deepStrictEqual(change.editor, editor);
            assert.deepStrictEqual(change.textDocument, document);
            assert.deepStrictEqual(change.span, new qub.Span(0, 4));
            assert.deepStrictEqual(change.startIndex, 0);
            assert.deepStrictEqual(change.afterChangeAfterEndIndex, 5);
            assert.deepStrictEqual(change.text, "HAPPY");
        });
    });

    class PlainTextDocument implements main.TextDocument {
        constructor(private _uri: string, private _text: string) {
        }

        public getLanguageId(): string {
            return "txt";
        }

        public getURI(): string {
            return this._uri;
        }

        public getText(): string {
            return this._text;
        }

        public getLineIndex(characterIndex: number): number {
            return qub.getLineIndex(this._text, characterIndex);
        }

        public getColumnIndex(characterIndex: number): number {
            return qub.getColumnIndex(this._text, characterIndex);
        }

        public getLineIndent(characterIndex: number): string {
            return qub.getLineIndent(this._text, characterIndex);
        }
    }

    suite("ParsedDocumentChange", () => {
        test(`constructor()`, () => {
            const parsedDocument = new mock.TextDocument("MOCK_LANGUAGE_ID", "mock://document.uri");
            const editor = new mock.TextEditor(parsedDocument);
            const change = new main.ParsedDocumentChange(parsedDocument, editor, new qub.Span(0, 1), "Hello!");
            assert.deepStrictEqual(change.parsedDocument, parsedDocument);
        });
    });
});