import * as assert from "assert";
import * as qub from "qub";

import * as mocks from "../sources/Mocks";

suite("Mocks", () => {
    suite("Disposable", () => {
        test("dispose()", () => {
            const disposable = new mocks.Disposable();
            disposable.dispose();
        });
    });

    suite("Configuration", () => {
        suite("get()", () => {
            function getTest(configurationData: Object, propertyPath: string, expectedValue: any): void {
                test(`with ${JSON.stringify(configurationData)}, get ${qub.escapeAndQuote(propertyPath)}`, () => {
                    const configuration = new mocks.Configuration(configurationData);
                    assert.deepStrictEqual(configuration.get(propertyPath), expectedValue);
                });
            }

            getTest(undefined, "test", undefined);
            getTest(undefined, "test.cool", undefined);
            getTest(null, "test", undefined);
            getTest(null, "test.cool", undefined);
            getTest({}, "test", undefined);
            getTest({}, "test.cool", undefined);
            getTest({ "apples": 2 }, "test", undefined);
            getTest({ "apples": 2 }, "test.cool", undefined);
            getTest({ "test": 3 }, "test", 3);
            getTest({ "test": 3 }, "test.cool", undefined);
        });
    });

    suite("TextDocument", () => {
        suite("constructor()", () => {
            test("with no text", () => {
                const document = new mocks.TextDocument("MOCK_LANGUAGE_ID", "mock://document.uri");
                assert.deepStrictEqual(document.getLanguageId(), "MOCK_LANGUAGE_ID");
                assert.deepStrictEqual(document.getURI(), "mock://document.uri");
                assert.deepStrictEqual(document.getText(), "");
            });

            function constructorTest(languageId: string, documentUri: string, text: string): void {
                test(`with ${qub.escapeAndQuote(languageId)}, ${qub.escapeAndQuote(documentUri)}, and ${qub.escapeAndQuote(text)}`, () => {
                    const document = new mocks.TextDocument(languageId, documentUri, text);
                    assert.deepStrictEqual(document.getLanguageId(), languageId);
                    assert.deepStrictEqual(document.getURI(), documentUri);
                    assert.deepStrictEqual(document.getText(), !text ? "" : text);
                });
            }

            constructorTest("A", "B", undefined);
            constructorTest("A", "B", null);
            constructorTest("A", "B", "");
            constructorTest("A", "B", "C");
        });

        suite("setText()", () => {
            function setTextTest(text: string): void {
                test(`with ${qub.escapeAndQuote(text)}`, () => {
                    const document = new mocks.TextDocument("MOCK_LANGUAGE_ID", "mock://document.uri");
                    document.setText(text);
                    assert.deepStrictEqual(document.getText(), text ? text : "");
                });
            }

            setTextTest(undefined);
            setTextTest(null);
            setTextTest("");
            setTextTest("hello");
        });

        suite("getColumnIndex()", () => {
            function getColumnIndexTest(text: string, expectedColumnIndexGetter: (characterIndex: number) => number): void {
                for (let i = -1; i <= text.length + 1; ++i) {
                    test(`with ${qub.escapeAndQuote(text)} and ${i}`, () => {
                        const document = new mocks.TextDocument("A", "B", text);
                        const expectedColumnIndex: number = expectedColumnIndexGetter(i);
                        assert.deepStrictEqual(document.getColumnIndex(i), expectedColumnIndex);
                    });
                }
            }

            getColumnIndexTest("", (i: number) => i < 0 ? undefined : i);
            getColumnIndexTest("cool!", (i: number) => i < 0 ? undefined : i);
            getColumnIndexTest("a\nb\nc", (i: number) =>
                i < 0 ? undefined :
                    i <= 1 ? i :
                        i <= 3 ? i - 2 :
                            i - 4);
        });

        suite("getLineIndex()", () => {
            function getLineIndexTest(text: string, expectedLineIndexGetter: (characterIndex: number) => number): void {
                for (let i = -1; i <= text.length + 1; ++i) {
                    test(`with ${qub.escapeAndQuote(text)} and ${i}`, () => {
                        const document = new mocks.TextDocument("A", "B", text);
                        const expectedLineIndex: number = expectedLineIndexGetter(i);
                        assert.deepStrictEqual(document.getLineIndex(i), expectedLineIndex);
                    });
                }
            }

            getLineIndexTest("", (i: number) => i < 0 ? undefined : 0);
            getLineIndexTest("cool!", (i: number) => i < 0 ? undefined : 0);
            getLineIndexTest("a\nb\nc", (i: number) =>
                i < 0 ? undefined :
                    i <= 1 ? 0 :
                        i <= 3 ? 1 :
                            2);
        });

        suite("getLineIndent()", () => {
            function getLineIndentTest(text: string, expectedLineIndentGetter: (characterIndex: number) => string): void {
                for (let i = -1; i <= text.length + 1; ++i) {
                    test(`with ${qub.escapeAndQuote(text)} and ${i}`, () => {
                        const document = new mocks.TextDocument("A", "B", text);
                        const expectedLineIndent: string = expectedLineIndentGetter(i);
                        assert.deepStrictEqual(document.getLineIndent(i), expectedLineIndent);
                    });
                }
            }

            getLineIndentTest("", (i: number) => i < 0 ? undefined : "");
            getLineIndentTest("cool!", (i: number) => i < 0 ? undefined : "");
            getLineIndentTest("a\nb\nc", (i: number) => i < 0 ? undefined : "");
            getLineIndentTest(" \n  \n   ", (i: number) =>
                i < 0 ? undefined :
                    i <= 1 ? " " :
                        i <= 4 ? "  " :
                            "   ");
        });
    });

    suite("TextEditor", () => {
        suite("constructor()", () => {
            test("with undefined document", () => {
                const editor = new mocks.TextEditor(undefined);
                assert.deepStrictEqual(editor.getDocument(), undefined);
                assert.deepStrictEqual(editor.getCursorIndex(), 0);
                assert.deepStrictEqual(editor.getIndent(), "  ");
                assert.deepStrictEqual(editor.getNewLine(), "\n");
            });
        });

        suite("setCursorIndex()", () => {
            test(`with undefined`, () => {
                const editor = new mocks.TextEditor(undefined);
                editor.setCursorIndex(undefined);
                assert.deepStrictEqual(editor.getCursorIndex(), undefined);
            });

            test(`with null`, () => {
                const editor = new mocks.TextEditor(undefined);
                editor.setCursorIndex(null);
                assert.deepStrictEqual(editor.getCursorIndex(), null);
            });

            test(`with 0`, () => {
                const editor = new mocks.TextEditor(undefined);
                editor.setCursorIndex(0);
                assert.deepStrictEqual(editor.getCursorIndex(), 0);
            });

            test(`with 15`, () => {
                const editor = new mocks.TextEditor(undefined);
                editor.setCursorIndex(15);
                assert.deepStrictEqual(editor.getCursorIndex(), 15);
            });
        });

        suite("insert()", () => {
            test(`with -1 and "hello"`, () => {
                const document = new mocks.TextDocument("id", "uri", "abcdefg");
                const editor = new mocks.TextEditor(document);
                editor.insert(-1, "hello");
                assert.deepStrictEqual(editor.getCursorIndex(), 4);
                assert.deepStrictEqual(document.getText(), "hellog");
            });

            test(`with 0 and "hello"`, () => {
                const document = new mocks.TextDocument("id", "uri", "abcdefg");
                const editor = new mocks.TextEditor(document);
                editor.insert(0, "hello");
                assert.deepStrictEqual(editor.getCursorIndex(), 5);
                assert.deepStrictEqual(document.getText(), "helloabcdefg");
            });

            test(`with 4 and "hello"`, () => {
                const document = new mocks.TextDocument("id", "uri", "abcdefg");
                const editor = new mocks.TextEditor(document);
                editor.insert(4, "hello");
                assert.deepStrictEqual(editor.getCursorIndex(), 9);
                assert.deepStrictEqual(document.getText(), "abcdhelloefg");
            });

            test(`with 13 and "hello"`, () => {
                const document = new mocks.TextDocument("id", "uri", "abcdefg");
                const editor = new mocks.TextEditor(document);
                editor.insert(13, "hello");
                assert.deepStrictEqual(editor.getCursorIndex(), 18);
                assert.deepStrictEqual(document.getText(), "abcdefghello");
            });
        });

        suite("setIndent()", () => {
            function setIndentTest(indent: string): void {
                test(`with ${qub.escapeAndQuote(indent)}`, () => {
                    const editor = new mocks.TextEditor(undefined);
                    editor.setIndent(indent);
                    assert.deepStrictEqual(editor.getIndent(), indent);
                });
            }

            setIndentTest(undefined);
            setIndentTest(null);
            setIndentTest("");
            setIndentTest(" ");
            setIndentTest("\t");
            setIndentTest("abc");
        });

        suite("setNewLine()", () => {
            function setNewLineTest(newLine: string): void {
                test(`with ${qub.escapeAndQuote(newLine)}`, () => {
                    const editor = new mocks.TextEditor(undefined);
                    editor.setNewLine(newLine);
                    assert.deepStrictEqual(editor.getNewLine(), newLine);
                });
            }

            setNewLineTest(undefined);
            setNewLineTest(null);
            setNewLineTest("");
            setNewLineTest(" ");
            setNewLineTest("\t");
            setNewLineTest("abc");
            setNewLineTest("\n");
            setNewLineTest("\r\n");
        });
    });
});