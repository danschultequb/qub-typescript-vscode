import * as assert from "assert";
import * as os from "os";
import * as path from "path";
import * as qub from "qub";
import * as fs from "qub-filesystem";
import * as telemetry from "qub-telemetry";

import * as main from "../sources/main";
import * as mock from "../sources/mock";

suite("Mock", () => {
    suite("Disposable", () => {
        test("dispose()", () => {
            const disposable = new mock.Disposable();
            disposable.dispose();
        });
    });

    suite("Configuration", () => {
        suite("get()", () => {
            function getTest(configurationData: Object, propertyPath: string, expectedValue: any): void {
                test(`with ${JSON.stringify(configurationData)}, get ${qub.escapeAndQuote(propertyPath)}`, () => {
                    const configuration = new mock.Configuration(configurationData);
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
                const document = new mock.TextDocument("MOCK_LANGUAGE_ID", "mock://document.uri");
                assert.deepStrictEqual(document.getLanguageId(), "MOCK_LANGUAGE_ID");
                assert.deepStrictEqual(document.getURI(), "mock://document.uri");
                assert.deepStrictEqual(document.getText(), "");
            });

            function constructorTest(languageId: string, documentUri: string, text: string): void {
                test(`with ${qub.escapeAndQuote(languageId)}, ${qub.escapeAndQuote(documentUri)}, and ${qub.escapeAndQuote(text)}`, () => {
                    const document = new mock.TextDocument(languageId, documentUri, text);
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
                    const document = new mock.TextDocument("MOCK_LANGUAGE_ID", "mock://document.uri");
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
                        const document = new mock.TextDocument("A", "B", text);
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
                        const document = new mock.TextDocument("A", "B", text);
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
                        const document = new mock.TextDocument("A", "B", text);
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
                const editor = new mock.TextEditor(undefined);
                assert.deepStrictEqual(editor.getDocument(), undefined);
                assert.deepStrictEqual(editor.getCursorIndex(), 0);
                assert.deepStrictEqual(editor.getIndent(), "  ");
                assert.deepStrictEqual(editor.getTabLength(), 2);
                assert.deepStrictEqual(editor.getNewLine(), "\n");
            });
        });

        suite("setCursorIndex()", () => {
            test(`with undefined`, () => {
                const editor = new mock.TextEditor(undefined);
                editor.setCursorIndex(undefined);
                assert.deepStrictEqual(editor.getCursorIndex(), undefined);
            });

            test(`with null`, () => {
                const editor = new mock.TextEditor(undefined);
                editor.setCursorIndex(null);
                assert.deepStrictEqual(editor.getCursorIndex(), null);
            });

            test(`with 0`, () => {
                const editor = new mock.TextEditor(undefined);
                editor.setCursorIndex(0);
                assert.deepStrictEqual(editor.getCursorIndex(), 0);
            });

            test(`with 15`, () => {
                const editor = new mock.TextEditor(undefined);
                editor.setCursorIndex(15);
                assert.deepStrictEqual(editor.getCursorIndex(), 15);
            });
        });

        suite("insert()", () => {
            test(`with -1 and "hello"`, () => {
                const document = new mock.TextDocument("id", "uri", "abcdefg");
                const editor = new mock.TextEditor(document);
                editor.insert(-1, "hello");
                assert.deepStrictEqual(editor.getCursorIndex(), 4);
                assert.deepStrictEqual(document.getText(), "hellog");
            });

            test(`with 0 and "hello"`, () => {
                const document = new mock.TextDocument("id", "uri", "abcdefg");
                const editor = new mock.TextEditor(document);
                editor.insert(0, "hello");
                assert.deepStrictEqual(editor.getCursorIndex(), 5);
                assert.deepStrictEqual(document.getText(), "helloabcdefg");
            });

            test(`with 4 and "hello"`, () => {
                const document = new mock.TextDocument("id", "uri", "abcdefg");
                const editor = new mock.TextEditor(document);
                editor.insert(4, "hello");
                assert.deepStrictEqual(editor.getCursorIndex(), 9);
                assert.deepStrictEqual(document.getText(), "abcdhelloefg");
            });

            test(`with 13 and "hello"`, () => {
                const document = new mock.TextDocument("id", "uri", "abcdefg");
                const editor = new mock.TextEditor(document);
                editor.insert(13, "hello");
                assert.deepStrictEqual(editor.getCursorIndex(), 18);
                assert.deepStrictEqual(document.getText(), "abcdefghello");
            });
        });

        suite("setIndent()", () => {
            function setIndentTest(indent: string): void {
                test(`with ${qub.escapeAndQuote(indent)}`, () => {
                    const editor = new mock.TextEditor(undefined);
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
                    const editor = new mock.TextEditor(undefined);
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

    suite("Platform", () => {
        test("constructor()", () => {
            const platform = new mock.Platform();
            assert.deepStrictEqual(platform.getActiveTextEditor(), undefined);
            assert.deepStrictEqual(platform.getCursorIndex(), undefined);
            assert.deepStrictEqual(platform.getConfiguration(), undefined);
            assert.deepStrictEqual(platform.getLocale(), "MOCK_LOCALE");
            assert.deepStrictEqual(platform.getMachineId(), "MOCK_MACHINE_ID");
            assert.deepStrictEqual(platform.getSessionId(), "MOCK_SESSION_ID");
            assert.deepStrictEqual(platform.getOperatingSystem(), "MOCK_OPERATING_SYSTEM");
        });

        test("dispose()", () => {
            const platform = new mock.Platform();
            platform.dispose();
            assert.deepStrictEqual(platform.getActiveTextEditor(), undefined);
            assert.deepStrictEqual(platform.getCursorIndex(), undefined);
            assert.deepStrictEqual(platform.getConfiguration(), undefined);
            assert.deepStrictEqual(platform.getLocale(), "MOCK_LOCALE");
            assert.deepStrictEqual(platform.getMachineId(), "MOCK_MACHINE_ID");
            assert.deepStrictEqual(platform.getSessionId(), "MOCK_SESSION_ID");
            assert.deepStrictEqual(platform.getOperatingSystem(), "MOCK_OPERATING_SYSTEM");
        });

        suite("getHoverAt()", () => {
            test(`with no hover provider`, () => {
                const platform = new mock.Platform();
                assert.deepStrictEqual(platform.getHoverAt(0), undefined);
            });

            test(`with no activeTextEditor`, () => {
                const platform = new mock.Platform();
                platform.setProvideHoverCallback("txt",
                    (textDocument: main.TextDocument, characterIndex: number) => {
                        return new main.Hover(["Hello!"], new qub.Span(0, 1));
                    });
                assert.deepStrictEqual(platform.getHoverAt(0), undefined);
            });

            test(`with undefined characterIndex`, () => {
                const platform = new mock.Platform();
                platform.setProvideHoverCallback("txt",
                    (textDocument: main.TextDocument, characterIndex: number) => {
                        return new main.Hover(["Hello!"], new qub.Span(0, 1));
                    });
                platform.setActiveTextEditor(new mock.TextEditor(new mock.TextDocument("txt", "mock://document.uri", "Hello?")));
                assert.deepStrictEqual(platform.getHoverAt(undefined), undefined);
            });

            test(`with no active document`, () => {
                const platform = new mock.Platform();
                platform.setProvideHoverCallback("txt",
                    (textDocument: main.TextDocument, characterIndex: number) => {
                        return new main.Hover(["Hello!"], new qub.Span(0, 1));
                    });
                platform.setActiveTextEditor(new mock.TextEditor(undefined));
                assert.deepStrictEqual(platform.getHoverAt(3), undefined);
            });

            test(`with hover provider, activeTextEditor, and defined characterIndex`, () => {
                const platform = new mock.Platform();
                platform.setProvideHoverCallback("txt",
                    (textDocument: main.TextDocument, characterIndex: number) => {
                        return new main.Hover(["Hello!"], new qub.Span(0, 1));
                    });
                platform.setActiveTextEditor(new mock.TextEditor(new mock.TextDocument("txt", "mock://document.uri", "Hello?")));
                assert.deepStrictEqual(platform.getHoverAt(3), new main.Hover(["Hello!"], new qub.Span(0, 1)));
            });
        });

        suite("getCompletionsAt()", () => {
            test(`with no completion provider`, () => {
                const platform = new mock.Platform();
                assert.deepStrictEqual(platform.getCompletionsAt(0).toArray(), []);
            });

            test(`with no activeTextEditor`, () => {
                const platform = new mock.Platform();
                platform.setProvideCompletionsCallback("txt", [],
                    (textDocument: main.TextDocument, characterIndex: number) => {
                        return new qub.SingleLinkList<main.Completion>([
                            new main.Completion("Hello", new qub.Span(0, 1), "A friendly greeting.")
                        ]);
                    });
                assert.deepStrictEqual(platform.getCompletionsAt(0).toArray(), []);
            });

            test(`with undefined characterIndex`, () => {
                const platform = new mock.Platform();
                platform.setProvideCompletionsCallback("txt", [],
                    (textDocument: main.TextDocument, characterIndex: number) => {
                        return new qub.SingleLinkList<main.Completion>([
                            new main.Completion("Hello", new qub.Span(0, 1), "A friendly greeting.")
                        ]);
                    });
                platform.setActiveTextEditor(new mock.TextEditor(new mock.TextDocument("txt", "mock://document.uri", "Hello?")));
                assert.deepStrictEqual(platform.getCompletionsAt(undefined).toArray(), []);
            });

            test(`with no active document`, () => {
                const platform = new mock.Platform();
                platform.setProvideCompletionsCallback("txt", [],
                    (textDocument: main.TextDocument, characterIndex: number) => {
                        return new qub.SingleLinkList<main.Completion>([
                            new main.Completion("Hello", new qub.Span(0, 1), "A friendly greeting.")
                        ]);
                    });
                platform.setActiveTextEditor(new mock.TextEditor(undefined));
                assert.deepStrictEqual(platform.getCompletionsAt(3).toArray(), []);
            });

            test(`with hover provider, activeTextEditor, and defined characterIndex`, () => {
                const platform = new mock.Platform();
                platform.setProvideCompletionsCallback("txt", [],
                    (textDocument: main.TextDocument, characterIndex: number) => {
                        return new qub.SingleLinkList<main.Completion>([
                            new main.Completion("Hello", new qub.Span(0, 1), "A friendly greeting.")
                        ]);
                    });
                platform.setActiveTextEditor(new mock.TextEditor(new mock.TextDocument("txt", "mock://document.uri", "Hello?")));
                assert.deepStrictEqual(platform.getCompletionsAt(3).toArray(), [
                    new main.Completion("Hello", new qub.Span(0, 1), "A friendly greeting.")
                ]);
            });
        });

        suite("getFormattedDocument()", () => {
            test(`with no format provider`, () => {
                const platform = new mock.Platform();
                assert.deepStrictEqual(platform.getFormattedDocument(), undefined);
            });

            test(`with no activeTextEditor`, () => {
                const platform = new mock.Platform();
                platform.setProvideFormattedDocumentTextCallback("txt",
                    (textDocument: main.TextDocument) => {
                        return "abcd";
                    });
                assert.deepStrictEqual(platform.getFormattedDocument(), undefined);
            });

            test(`with no active document`, () => {
                const platform = new mock.Platform();
                platform.setProvideFormattedDocumentTextCallback("txt",
                    (textDocument: main.TextDocument) => {
                        return "abcd";
                    });
                platform.setActiveTextEditor(new mock.TextEditor(undefined));
                assert.deepStrictEqual(platform.getFormattedDocument(), undefined);
            });

            test(`with format provider and activeTextEditor`, () => {
                const platform = new mock.Platform();
                platform.setProvideFormattedDocumentTextCallback("txt",
                    (textDocument: main.TextDocument) => {
                        return "abcd";
                    });
                platform.setActiveTextEditor(new mock.TextEditor(new mock.TextDocument("txt", "mock://document.uri", "Hello?")));
                assert.deepStrictEqual(platform.getFormattedDocument(), "abcd");
            });
        });

        suite("addInstalledExtension()", () => {
            function addInstalledExtensionTest(publisherName: string, extensionName: string): void {
                test(`with ${qub.escapeAndQuote(publisherName)} publisher name and ${qub.escapeAndQuote(extensionName)} extension name`, () => {
                    const platform = new mock.Platform();
                    assert.deepStrictEqual(platform.isExtensionInstalled(publisherName, extensionName), false);

                    platform.addInstalledExtension(publisherName, extensionName);
                    assert.deepStrictEqual(platform.isExtensionInstalled(publisherName, extensionName), true);

                    platform.addInstalledExtension(publisherName, extensionName);
                    assert.deepStrictEqual(platform.isExtensionInstalled(publisherName, extensionName), true);
                });
            }

            addInstalledExtensionTest(undefined, undefined);
            addInstalledExtensionTest(undefined, null);
            addInstalledExtensionTest(undefined, "");
            addInstalledExtensionTest(undefined, "myExtension");

            addInstalledExtensionTest(null, undefined);
            addInstalledExtensionTest(null, null);
            addInstalledExtensionTest(null, "");
            addInstalledExtensionTest(null, "myExtension");

            addInstalledExtensionTest("", undefined);
            addInstalledExtensionTest("", null);
            addInstalledExtensionTest("", "");
            addInstalledExtensionTest("", "myExtension");

            addInstalledExtensionTest("myPublisher", undefined);
            addInstalledExtensionTest("myPublisher", null);
            addInstalledExtensionTest("myPublisher", "");
            addInstalledExtensionTest("myPublisher", "myExtension");
        });

        suite("setActiveTextEditor()", () => {
            test(`when undefined, set to undefined`, () => {
                const platform = new mock.Platform();
                let changed: boolean = false;
                platform.setActiveEditorChangedCallback((newActiveTextEditor: main.TextEditor) => {
                    changed = true;
                });
                assert.deepStrictEqual(platform.getActiveTextEditor(), undefined);

                platform.setActiveTextEditor(undefined);

                assert.deepStrictEqual(platform.getActiveTextEditor(), undefined);
                assert.deepStrictEqual(changed, false);
            });

            test(`when undefined, set to not undefined with no callback`, () => {
                const platform = new mock.Platform();
                assert.deepStrictEqual(platform.getActiveTextEditor(), undefined);

                platform.setActiveTextEditor(new mock.TextEditor(undefined));

                assert.deepStrictEqual(platform.getActiveTextEditor(), new mock.TextEditor(undefined));
            });

            test(`when undefined, set to not undefined with a callback`, () => {
                const platform = new mock.Platform();
                let changed: boolean = false;
                platform.setActiveEditorChangedCallback((newActiveTextEditor: main.TextEditor) => {
                    changed = true;
                });
                assert.deepStrictEqual(platform.getActiveTextEditor(), undefined);

                platform.setActiveTextEditor(new mock.TextEditor(undefined));

                assert.deepStrictEqual(platform.getActiveTextEditor(), new mock.TextEditor(undefined));
                assert.deepStrictEqual(changed, true);
            });
        });

        suite("getCursorIndex()", () => {
            test(`with no active text editor`, () => {
                const platform = new mock.Platform();
                assert.deepStrictEqual(platform.getCursorIndex(), undefined);
            });

            test(`with no active text document`, () => {
                const platform = new mock.Platform();
                platform.setActiveTextEditor(new mock.TextEditor(undefined));
                assert.deepStrictEqual(platform.getCursorIndex(), 0);
            });
        });

        suite("setCursorIndex()", () => {
            test(`with no active text editor`, () => {
                const platform = new mock.Platform();
                platform.setCursorIndex(15);
                assert.deepStrictEqual(platform.getCursorIndex(), undefined);
            });

            test(`with no active text document`, () => {
                const platform = new mock.Platform();
                platform.setActiveTextEditor(new mock.TextEditor(undefined));
                platform.setCursorIndex(14);
                assert.deepStrictEqual(platform.getCursorIndex(), 14);
            });
        });

        suite("openTextDocument()", () => {
            test(`with no open text document callback and undefined text document`, () => {
                const platform = new mock.Platform();
                assert.deepStrictEqual(platform.getActiveTextEditor(), undefined);

                platform.openTextDocument(undefined);
                assert.deepStrictEqual(platform.getActiveTextEditor(), new mock.TextEditor(undefined));
            });

            test(`with open text document callback and text document`, () => {
                const platform = new mock.Platform();
                assert.deepStrictEqual(platform.getActiveTextEditor(), undefined);

                let openedDocument: main.TextDocument;
                platform.setTextDocumentOpenedCallback((openedTextDocument: main.TextDocument) => {
                    openedDocument = openedTextDocument;
                });

                platform.openTextDocument(new mock.TextDocument("A", "B", "C"));
                assert.deepStrictEqual(platform.getActiveTextEditor(), new mock.TextEditor(new mock.TextDocument("A", "B", "C")));
                assert.deepStrictEqual(openedDocument, new mock.TextDocument("A", "B", "C"));
            });
        });

        suite("saveTextDocument()", () => {
            test(`with no save text document callback and undefined text document`, () => {
                const platform = new mock.Platform();
                platform.saveTextDocument(undefined);
            });

            test(`with save text document callback and text document`, () => {
                const platform = new mock.Platform();

                let savedDocument: main.TextDocument;
                platform.setTextDocumentSavedCallback((savedTextDocument: main.TextDocument) => {
                    savedDocument = savedTextDocument;
                });

                platform.saveTextDocument(new mock.TextDocument("A", "B", "C"));
                assert.deepStrictEqual(savedDocument, new mock.TextDocument("A", "B", "C"));
            });
        });

        suite("closeTextDocument()", () => {
            test(`with no close text document callback and no active text document`, () => {
                const platform = new mock.Platform();
                platform.closeTextDocument(undefined);
                assert.deepStrictEqual(platform.getActiveTextEditor(), undefined);
            });

            test(`with close text document callback and no active text document`, () => {
                const platform = new mock.Platform();

                let closedDocument: main.TextDocument;
                platform.setTextDocumentClosedCallback((closedTextDocument: main.TextDocument) => {
                    closedDocument = closedTextDocument;
                });

                platform.closeTextDocument(new mock.TextDocument("A", "B", "C"));
                assert.deepStrictEqual(closedDocument, new mock.TextDocument("A", "B", "C"));
                assert.deepStrictEqual(platform.getActiveTextEditor(), undefined);
            });

            test(`with close text document callback and different active text document`, () => {
                const platform = new mock.Platform();

                let closedDocument: main.TextDocument;
                platform.setTextDocumentClosedCallback((closedTextDocument: main.TextDocument) => {
                    closedDocument = closedTextDocument;
                });

                platform.setActiveTextEditor(new mock.TextEditor(new mock.TextDocument("A", "B", "C")));

                platform.closeTextDocument(new mock.TextDocument("D", "E", "F"));
                assert.deepStrictEqual(closedDocument, new mock.TextDocument("D", "E", "F"));
                assert.deepStrictEqual(platform.getActiveTextEditor(), new mock.TextEditor(new mock.TextDocument("A", "B", "C")));
            });

            test(`with close text document callback and equal active text document`, () => {
                const platform = new mock.Platform();

                let closedDocument: main.TextDocument;
                platform.setTextDocumentClosedCallback((closedTextDocument: main.TextDocument) => {
                    closedDocument = closedTextDocument;
                });

                const activeTextDocument = new mock.TextDocument("A", "B", "C");
                platform.setActiveTextEditor(new mock.TextEditor(activeTextDocument));

                platform.closeTextDocument(new mock.TextDocument("A", "B", "C"));
                assert.deepStrictEqual(closedDocument, activeTextDocument);
                assert.deepStrictEqual(platform.getActiveTextEditor(), new mock.TextEditor(activeTextDocument));
            });

            test(`with close text document callback and same active text document`, () => {
                const platform = new mock.Platform();

                let closedDocument: main.TextDocument;
                platform.setTextDocumentClosedCallback((closedTextDocument: main.TextDocument) => {
                    closedDocument = closedTextDocument;
                });

                const activeTextDocument = new mock.TextDocument("A", "B", "C");
                platform.setActiveTextEditor(new mock.TextEditor(activeTextDocument));

                platform.closeTextDocument(activeTextDocument);
                assert.deepStrictEqual(closedDocument, activeTextDocument);
                assert.deepStrictEqual(platform.getActiveTextEditor(), undefined);
            });
        });

        suite("insertText()", () => {
            test(`with no active text editor`, () => {
                const platform = new mock.Platform();

                let documentChange: main.TextDocumentChange;
                platform.setTextDocumentChangedCallback((textDocumentChange: main.TextDocumentChange) => {
                    documentChange = textDocumentChange;
                });

                platform.insertText(0, "test");

                assert.deepStrictEqual(documentChange, undefined);
            });

            test(`with no active text document`, () => {
                const platform = new mock.Platform();

                let documentChange: main.TextDocumentChange;
                platform.setTextDocumentChangedCallback((textDocumentChange: main.TextDocumentChange) => {
                    documentChange = textDocumentChange;
                });
                platform.setActiveTextEditor(new mock.TextEditor(undefined));

                platform.insertText(0, "test");

                assert.deepStrictEqual(documentChange, undefined);
            });

            test(`with active text document but no text document change callback`, () => {
                const platform = new mock.Platform();

                platform.setActiveTextEditor(new mock.TextEditor(new mock.TextDocument("A", "B", "C")));

                platform.insertText(0, "test");

                assert.deepStrictEqual(platform.getActiveTextEditor().getDocument().getText(), "testC");
                assert.deepStrictEqual(platform.getCursorIndex(), 4);
            });

            test(`with active text document and text document change callback`, () => {
                const platform = new mock.Platform();

                platform.setActiveTextEditor(new mock.TextEditor(new mock.TextDocument("A", "B", "C")));

                let change: main.TextDocumentChange;
                platform.setTextDocumentChangedCallback((textDocumentChange: main.TextDocumentChange) => {
                    change = textDocumentChange;
                });

                platform.insertText(0, "test");

                assert.deepStrictEqual(platform.getActiveTextEditor().getDocument().getText(), "testC");
                assert.deepStrictEqual(platform.getCursorIndex(), 4);

                const changeEditor = new mock.TextEditor(new mock.TextDocument("A", "B", "testC"));
                changeEditor.setCursorIndex(4);
                assert.deepEqual(change, new main.TextDocumentChange(changeEditor, new qub.Span(0, 0), "test"));
            });
        });

        suite("setConfigurationChangedCallback()", () => {
            test("with undefined", () => {
                const platform = new mock.Platform();
                platform.setConfigurationChangedCallback(undefined);
            });

            test("with null", () => {
                const platform = new mock.Platform();
                platform.setConfigurationChangedCallback(null);
            });
        });

        suite("setTextDocumentIssues()", () => {
            test("with undefined arguments", () => {
                const platform = new mock.Platform();
                platform.setTextDocumentIssues(undefined, undefined, undefined);
                assert.deepStrictEqual(platform.getTextDocumentIssues(undefined).toArray(), []);
            });

            test(`with a single issue`, () => {
                const platform = new mock.Platform();
                platform.setTextDocumentIssues(undefined, new mock.TextDocument("A", "B", "C"), new qub.ArrayList<qub.Issue>([qub.Error("D", new qub.Span(0, 1))]));
                assert.deepStrictEqual(platform.getTextDocumentIssues("B").toArray(), [qub.Error("D", new qub.Span(0, 1))]);
            });
        });

        suite("setConfiguration()", () => {
            test("with undefined", () => {
                const platform = new mock.Platform();
                platform.setConfiguration(undefined);
                assert.deepStrictEqual(platform.getConfiguration(), undefined);
            });

            test("with null", () => {
                const platform = new mock.Platform();
                platform.setConfiguration(null);
                assert.deepStrictEqual(platform.getConfiguration(), null);
            });

            test("with empty configuration", () => {
                const platform = new mock.Platform();
                platform.setConfiguration(new mock.Configuration());
                assert.deepStrictEqual(platform.getConfiguration(), new mock.Configuration());
            });

            test("with configuration values but no callback", () => {
                const platform = new mock.Platform();
                platform.setConfiguration(new mock.Configuration({ "apples": 50 }));
                assert.deepStrictEqual(platform.getConfiguration(), new mock.Configuration({ "apples": 50 }));
            });

            test("with configuration values and callback", () => {
                const platform = new mock.Platform();

                let configurationChanged: boolean = false;
                platform.setConfigurationChangedCallback(() => {
                    configurationChanged = true;
                });

                platform.setConfiguration(new mock.Configuration({ "apples": 51 }));

                assert.deepStrictEqual(platform.getConfiguration(), new mock.Configuration({ "apples": 51 }));
                assert.deepStrictEqual(configurationChanged, true);
            });
        });
    });

    suite("PlaintextDocument", () => {
        test("constructor()", () => {
            const document = new mock.PlaintextDocument("I'm some plaintext.");
            assert.deepStrictEqual(document.getText(), "I'm some plaintext.");
        });
    });

    suite("PlaintextLanguageExtension", () => {
        suite("constructor()", () => {
            test("with no platform", () => {
                const extension = new mock.PlaintextLanguageExtension(undefined);
                assert.deepStrictEqual(extension.name, "Plaintext Tools");
                assert.deepStrictEqual(extension.version, "1.0.0");

                assert.deepStrictEqual(extension.getSettingsFile(), undefined);
            });

            test("with a platform", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);
                assert.deepStrictEqual(extension.name, "Plaintext Tools");
                assert.deepStrictEqual(extension.version, "1.0.0");

                assert.deepStrictEqual(extension.getSettingsFile().getPath(), new fs.Path(os.homedir() + "/.vscode/Plaintext Tools.json"));

                platform.setActiveTextEditor(new mock.TextEditor(undefined));
                platform.setActiveTextEditor(undefined);
                platform.setConfiguration(new mock.Configuration({}));
                platform.openTextDocument(new mock.TextDocument("X", "Y", "Z"));
                platform.saveTextDocument(new mock.TextDocument("L", "M", "N"));
            });
        });

        suite("isParsable()", () => {
            test("with undefined", () => {
                const extension = new mock.PlaintextLanguageExtension(undefined);
                assert.deepStrictEqual(extension.isParsable(undefined), false);
            });

            test("with null", () => {
                const extension = new mock.PlaintextLanguageExtension(undefined);
                assert.deepStrictEqual(extension.isParsable(null), false);
            });

            test("with document with no language id", () => {
                const extension = new mock.PlaintextLanguageExtension(undefined);
                const document = new mock.TextDocument(undefined, "mock://document.uri");
                assert.deepStrictEqual(extension.isParsable(document), false);
            });

            test("with XML document", () => {
                const extension = new mock.PlaintextLanguageExtension(undefined);
                const document = new mock.TextDocument("xml", "mock://document.uri");
                assert.deepStrictEqual(extension.isParsable(document), false);
            });

            test("with TXT document", () => {
                const extension = new mock.PlaintextLanguageExtension(undefined);
                const document = new mock.TextDocument("TXT", "mock://document.uri");
                assert.deepStrictEqual(extension.isParsable(document), false);
            });

            test("with txt document", () => {
                const extension = new mock.PlaintextLanguageExtension(undefined);
                const document = new mock.TextDocument("txt", "mock://document.uri");
                assert.deepStrictEqual(extension.isParsable(document), true);
            });
        });

        suite("parseDocument()", () => {
            test(`with undefined`, () => {
                const extension = new mock.PlaintextLanguageExtension(undefined);
                assert.deepStrictEqual(extension.parseDocument(undefined), new mock.PlaintextDocument(undefined));
            });

            test(`with null`, () => {
                const extension = new mock.PlaintextLanguageExtension(undefined);
                assert.deepStrictEqual(extension.parseDocument(null), new mock.PlaintextDocument(null));
            });

            test(`with ""`, () => {
                const extension = new mock.PlaintextLanguageExtension(undefined);
                assert.deepStrictEqual(extension.parseDocument(""), new mock.PlaintextDocument(""));
            });

            test(`with "Shopping List:"`, () => {
                const extension = new mock.PlaintextLanguageExtension(undefined);
                assert.deepStrictEqual(extension.parseDocument("Shopping List:"), new mock.PlaintextDocument("Shopping List:"));
            });
        });

        suite("dispose()", () => {
            test("when not disposed", () => {
                const extension = new mock.PlaintextLanguageExtension(undefined);
                extension.dispose();
            });

            test("when disposed", () => {
                const extension = new mock.PlaintextLanguageExtension(undefined);
                extension.dispose();

                extension.dispose();
            });

            test("with a platform", () => {
                const extension = new mock.PlaintextLanguageExtension(new mock.Platform());
                extension.dispose();
            });
        });

        suite("writeActivationTelemetry()", () => {
            test("with undefined telemetryCreator function", () => {
                const extension = new mock.PlaintextLanguageExtension(undefined);
                extension.writeActivationTelemetry(undefined);
            });

            test("with null telemetryCreator function", () => {
                const extension = new mock.PlaintextLanguageExtension(undefined);
                extension.writeActivationTelemetry(null);
            });

            test("with telemetry disabled", () => {
                const platform = new mock.Platform();
                platform.setConfiguration(new mock.Configuration({ "Plaintext Tools": { "telemetry": { "enabled": false } } }));

                const extension = new mock.PlaintextLanguageExtension(platform);
                extension.writeActivationTelemetry(() => undefined);
            });

            test("with telemetryCreator function that returns undefined", () => {
                const extension = new mock.PlaintextLanguageExtension(undefined);
                extension.writeActivationTelemetry(() => undefined);
            });

            test("with telemetryCreator function that returns null", () => {
                const extension = new mock.PlaintextLanguageExtension(undefined);
                extension.writeActivationTelemetry(() => null);
            });

            test("with telemetryCreator function that returns endpoint", () => {
                const platform = new mock.Platform();
                const fileSystem: fs.FileSystem = platform.getFileSystem();
                const extension = new mock.PlaintextLanguageExtension(platform);

                assert.deepStrictEqual(extension.getSettingsFile().exists(), false);

                const endpoint = new telemetry.InMemoryEndpoint();
                extension.writeActivationTelemetryWithDate(() => endpoint, 2017, 1, 2);

                assert.deepStrictEqual(endpoint.events.toArray(), [new telemetry.Event("Activated", { extensionVersion: "1.0.0", machineId: "MOCK_MACHINE_ID" })]);
                assert.deepStrictEqual(extension.getSettingsFile().exists(), true);

                extension.writeActivationTelemetryWithDate(() => endpoint, 2017, 1, 2);
                assert.deepStrictEqual(endpoint.events.toArray(), [new telemetry.Event("Activated", { extensionVersion: "1.0.0", machineId: "MOCK_MACHINE_ID" })]);

                extension.writeActivationTelemetryWithDate(() => endpoint, 2017, 1, 30);
                assert.deepStrictEqual(endpoint.events.toArray(), [
                    new telemetry.Event("Activated", { extensionVersion: "1.0.0", machineId: "MOCK_MACHINE_ID" }),
                    new telemetry.Event("Activated", { extensionVersion: "1.0.0", machineId: "MOCK_MACHINE_ID" })
                ]);
            });
        });

        suite("getConfigurationValue()", () => {
            test("with no platform set", () => {
                const extension = new mock.PlaintextLanguageExtension(undefined);
                assert.deepStrictEqual(extension.getConfigurationValue(undefined), undefined);
                assert.deepStrictEqual(extension.getConfigurationValue(null), undefined);
                assert.deepStrictEqual(extension.getConfigurationValue(""), undefined);
                assert.deepStrictEqual(extension.getConfigurationValue("apples"), undefined);
            });

            test("with no configuration set", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);
                assert.deepStrictEqual(extension.getConfigurationValue(undefined), undefined);
                assert.deepStrictEqual(extension.getConfigurationValue(null), undefined);
                assert.deepStrictEqual(extension.getConfigurationValue(""), undefined);
                assert.deepStrictEqual(extension.getConfigurationValue("apples"), undefined);
            });

            test("with empty configuration set", () => {
                const platform = new mock.Platform();
                platform.setConfiguration(new mock.Configuration({}));
                const extension = new mock.PlaintextLanguageExtension(platform);
                assert.deepStrictEqual(extension.getConfigurationValue(undefined), undefined);
                assert.deepStrictEqual(extension.getConfigurationValue(null), undefined);
                assert.deepStrictEqual(extension.getConfigurationValue(""), undefined);
                assert.deepStrictEqual(extension.getConfigurationValue("apples"), undefined);
            });

            test("with no extension configuration set", () => {
                const platform = new mock.Platform();
                platform.setConfiguration(new mock.Configuration({ "apples": 1 }));
                const extension = new mock.PlaintextLanguageExtension(platform);
                assert.deepStrictEqual(extension.getConfigurationValue(undefined), undefined);
                assert.deepStrictEqual(extension.getConfigurationValue(null), undefined);
                assert.deepStrictEqual(extension.getConfigurationValue(""), undefined);
                assert.deepStrictEqual(extension.getConfigurationValue("apples"), undefined);
            });

            test("with extension configuration set", () => {
                const platform = new mock.Platform();
                platform.setConfiguration(new mock.Configuration({ "Plaintext Tools": { "apples": 1 } }));
                const extension = new mock.PlaintextLanguageExtension(platform);
                assert.deepStrictEqual(extension.getConfigurationValue(undefined), undefined);
                assert.deepStrictEqual(extension.getConfigurationValue(null), undefined);
                assert.deepStrictEqual(extension.getConfigurationValue(""), undefined);
                assert.deepStrictEqual(extension.getConfigurationValue("apples"), 1);
            });
        });

        suite("setOnProvideIssues()", () => {
            test("with undefined provider", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);
                extension.setOnProvideIssues(undefined);

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I have a red dog."));

                assert.deepStrictEqual(platform.getTextDocumentIssues("mock://document.uri").toArray(), []);

                extension.dispose();
            });

            test("with provider", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);
                extension.setOnProvideIssues((parsedDocument: mock.PlaintextDocument) => {
                    return new qub.SingleLinkList<qub.Issue>([qub.Error("No red allowed", new qub.Span(9, 3))]);
                });

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I have a red dog."));

                assert.deepStrictEqual(platform.getTextDocumentIssues("mock://document.uri").toArray(), [qub.Error("No red allowed", new qub.Span(9, 3))]);
            });
        });

        suite("setOnProvideHover()", () => {
            test("with undefined provider", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);
                extension.setOnProvideHover(undefined);

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));

                assert.deepStrictEqual(platform.getHoverAt(9), undefined);
            });

            test("with provider", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);
                extension.setOnProvideHover((parsedDocument: mock.PlaintextDocument, characterIndex: number) => {
                    return new main.Hover(["Blue"], new qub.Span(7, 4));
                });

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I have a red dog."));

                const hover: main.Hover = platform.getHoverAt(9);
                assert.deepStrictEqual(hover, new main.Hover(["Blue"], new qub.Span(7, 4)));
            });

            test("with provider but non-plaintext document", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);
                extension.setOnProvideHover((parsedDocument: mock.PlaintextDocument, characterIndex: number) => {
                    return new main.Hover(["Blue"], new qub.Span(7, 4));
                });

                // Must open a plaintext document first to register all of our language specific
                // event handlers.
                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I have a red dog."));

                platform.openTextDocument(new mock.TextDocument("xml", "mock://document2.uri", "I have a red dog."));

                assert.deepStrictEqual(platform.getHoverAt(9), undefined);
            });
        });

        suite("setOnParsedDocumentOpened()", () => {
            test("with undefined provider", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                extension.setOnParsedDocumentOpened(undefined);

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));
            });

            test("with provider but non-plaintext document", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                let documentText: string;
                extension.setOnParsedDocumentOpened((parsedDocument: mock.PlaintextDocument) => {
                    documentText = parsedDocument.getText();
                });

                platform.openTextDocument(new mock.TextDocument("xml", "mock://document.uri", "I like blue cheese."));

                assert.deepStrictEqual(documentText, undefined);
            });

            test("with provider and plaintext document", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                let documentText: string;
                extension.setOnParsedDocumentOpened((parsedDocument: mock.PlaintextDocument) => {
                    documentText = parsedDocument.getText();
                });

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));

                assert.deepStrictEqual(documentText, "I like blue cheese.");
            });
        });

        suite("setOnParsedDocumentSaved()", () => {
            test("with undefined provider before plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                extension.setOnParsedDocumentSaved(undefined);

                platform.saveTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));
            });

            test("with undefined provider after plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                extension.setOnParsedDocumentSaved(undefined);

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));
                platform.saveTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));
            });

            test("with provider but non-plaintext document", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                let documentText: string;
                extension.setOnParsedDocumentSaved((parsedDocument: mock.PlaintextDocument) => {
                    documentText = parsedDocument.getText();
                });

                platform.saveTextDocument(new mock.TextDocument("xml", "mock://document.uri", "I like blue cheese."));

                assert.deepStrictEqual(documentText, undefined);
            });

            test("with provider and plaintext document before plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                let documentText: string;
                extension.setOnParsedDocumentSaved((parsedDocument: mock.PlaintextDocument) => {
                    documentText = parsedDocument.getText();
                });

                platform.saveTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));

                assert.deepStrictEqual(documentText, "I like blue cheese.");
            });

            test("with provider and plaintext document after plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                let documentText: string;
                extension.setOnParsedDocumentSaved((parsedDocument: mock.PlaintextDocument) => {
                    documentText = parsedDocument.getText();
                });

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));
                platform.saveTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));

                assert.deepStrictEqual(documentText, "I like blue cheese.");
            });
        });

        suite("setOnParsedDocumentClosed()", () => {
            test("with undefined callback before plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                extension.setOnParsedDocumentClosed(undefined);

                platform.closeTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));
            });

            test("with undefined callback after plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                extension.setOnParsedDocumentClosed(undefined);

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));

                platform.closeTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));
            });

            test("with callback but non-plaintext document before plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                let documentText: string;
                extension.setOnParsedDocumentClosed((parsedDocument: mock.PlaintextDocument) => {
                    documentText = parsedDocument.getText();
                });

                platform.closeTextDocument(new mock.TextDocument("xml", "mock://document.uri", "I like blue cheese."));

                assert.deepStrictEqual(documentText, undefined);
            });

            test("with callback but non-plaintext document before plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                let documentText: string;
                extension.setOnParsedDocumentClosed((parsedDocument: mock.PlaintextDocument) => {
                    documentText = parsedDocument.getText();
                });

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));

                platform.closeTextDocument(new mock.TextDocument("xml", "mock://document.uri", "I like blue cheese."));

                assert.deepStrictEqual(documentText, undefined);
            });

            test("with callback and plaintext document before plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                let documentText: string;
                extension.setOnParsedDocumentClosed((parsedDocument: mock.PlaintextDocument) => {
                    documentText = parsedDocument.getText();
                });

                platform.closeTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));

                assert.deepStrictEqual(documentText, undefined);
            });

            test("with callback and plaintext document after plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                let documentText: string;
                extension.setOnParsedDocumentClosed((parsedDocument: mock.PlaintextDocument) => {
                    documentText = parsedDocument.getText();
                });

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));
                platform.closeTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));

                assert.deepStrictEqual(documentText, "I like blue cheese.");
            });

            test("with plaintext document issues", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                let documentText: string;
                extension.setOnParsedDocumentClosed((parsedDocument: mock.PlaintextDocument) => {
                    documentText = parsedDocument.getText();
                });

                extension.setOnProvideIssues((parsedDocument: mock.PlaintextDocument) => {
                    return new qub.SingleLinkList<qub.Issue>([qub.Error("No red allowed", new qub.Span(9, 3))]);
                });

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));
                platform.setTextDocumentIssues(extension.name, new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."), new qub.SingleLinkList<qub.Issue>([qub.Error("Error!", new qub.Span(0, 5))]));
                assert.deepStrictEqual(platform.getTextDocumentIssues("mock://document.uri").toArray(), [qub.Error("Error!", new qub.Span(0, 5))]);

                platform.closeTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));

                assert.deepStrictEqual(documentText, "I like blue cheese.");
                assert.deepStrictEqual(platform.getTextDocumentIssues("mock://document.uri").toArray(), []);
            });

            test("with multiple plaintext documents open", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                let documentText: string;
                extension.setOnParsedDocumentClosed((parsedDocument: mock.PlaintextDocument) => {
                    documentText = parsedDocument.getText();
                });

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));
                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri2", "I like blue cheese too!"));

                platform.closeTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));

                assert.deepStrictEqual(documentText, "I like blue cheese.");
            });
        });

        suite("setOnParsedDocumentChanged()", () => {
            test("with undefined callback after plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                extension.setOnParsedDocumentChanged(undefined);

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));
                platform.insertText(2, "don't ");

                assert.deepStrictEqual(platform.getActiveTextEditor().getDocument(), new mock.TextDocument("txt", "mock://document.uri", "I don't like blue cheese."));
            });

            test("with provider but non-plaintext document before plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                let documentText: string;
                extension.setOnParsedDocumentChanged((change: main.TextDocumentChange) => {
                    documentText = change.textDocument.getText();
                });

                platform.openTextDocument(new mock.TextDocument("xml", "mock://document.uri", "I like blue cheese."));
                platform.insertText(2, "don't ");

                assert.deepStrictEqual(platform.getActiveTextEditor().getDocument(), new mock.TextDocument("xml", "mock://document.uri", "I don't like blue cheese."));
                assert.deepStrictEqual(documentText, undefined);
            });

            test("with provider but non-plaintext document after plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                let documentText: string;
                extension.setOnParsedDocumentChanged((change: main.TextDocumentChange) => {
                    documentText = change.textDocument.getText();
                });

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));
                platform.openTextDocument(new mock.TextDocument("xml", "mock://document.xml", "I like blue cheese too."));
                platform.insertText(2, "don't ");

                assert.deepStrictEqual(platform.getActiveTextEditor().getDocument(), new mock.TextDocument("xml", "mock://document.xml", "I don't like blue cheese too."));
                assert.deepStrictEqual(documentText, undefined);
            });

            test("with provider and plaintext document after plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                let documentText: string;
                extension.setOnParsedDocumentChanged((change: main.TextDocumentChange) => {
                    documentText = change.textDocument.getText();
                });

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));
                platform.insertText(2, "don't ");

                assert.deepStrictEqual(platform.getActiveTextEditor().getDocument(), new mock.TextDocument("txt", "mock://document.uri", "I don't like blue cheese."));
                assert.deepStrictEqual(documentText, "I don't like blue cheese.");
            });
        });

        suite("isExtensionInstalled()", () => {
            test("with undefined publisher name and extension name", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);
                assert.deepStrictEqual(extension.isExtensionInstalled(undefined, undefined), false);
            });

            test(`with "A" publisher name and "B" extension name when not installed`, () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);
                assert.deepStrictEqual(extension.isExtensionInstalled("A", "B"), false);
            });

            test(`with "A" publisher name and "B" extension name when installed`, () => {
                const platform = new mock.Platform();
                platform.addInstalledExtension("A", "B");

                const extension = new mock.PlaintextLanguageExtension(platform);
                assert.deepStrictEqual(extension.isExtensionInstalled("A", "B"), true);
            });
        });

        suite("setOnProvideCompletions()", () => {
            test("with undefined callback before plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                extension.setOnProvideCompletions([], undefined);

                assert.deepStrictEqual(platform.getCompletionsAt(5).toArray(), []);
            });

            test("with undefined callback after plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                extension.setOnProvideCompletions([], undefined);

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));

                assert.deepStrictEqual(platform.getCompletionsAt(5).toArray(), []);
            });

            test("with callback but non-plaintext document before plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                extension.setOnProvideCompletions([], (parsedDocument: mock.PlaintextDocument, characterIndex: number) => {
                    return new qub.SingleLinkList<main.Completion>([new main.Completion("A", new qub.Span(1, 2), "B")]);
                });

                platform.openTextDocument(new mock.TextDocument("xml", "mock://document.uri", "I like blue cheese."));

                assert.deepStrictEqual(platform.getCompletionsAt(5).toArray(), []);
            });

            test("with callback but non-plaintext document after plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                extension.setOnProvideCompletions([], (parsedDocument: mock.PlaintextDocument, characterIndex: number) => {
                    return new qub.SingleLinkList<main.Completion>([new main.Completion("A", new qub.Span(1, 2), "B")]);
                });

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));
                platform.openTextDocument(new mock.TextDocument("xml", "mock://document.xml", "I like blue cheese too."));

                assert.deepStrictEqual(platform.getCompletionsAt(5).toArray(), []);
            });

            test("with callback and plaintext document after plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                extension.setOnProvideCompletions([], (parsedDocument: mock.PlaintextDocument, characterIndex: number) => {
                    return new qub.SingleLinkList<main.Completion>([new main.Completion("A", new qub.Span(1, 2), "B")]);
                });

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));

                assert.deepStrictEqual(platform.getCompletionsAt(5).toArray(), [new main.Completion("A", new qub.Span(1, 2), "B")]);
            });
        });

        suite("setOnProvideFormattedDocument()", () => {
            test("with undefined provider before plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                extension.setOnProvideFormattedDocument(undefined);

                assert.deepStrictEqual(platform.getFormattedDocument(), undefined);
            });

            test("with undefined provider after plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                extension.setOnProvideFormattedDocument(undefined);

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", "I like blue cheese."));

                assert.deepStrictEqual(platform.getFormattedDocument(), undefined);
            });

            test("with provider but non-plaintext document before plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                extension.setOnProvideFormattedDocument((parsedDocument: mock.PlaintextDocument) => {
                    return parsedDocument.getText().trim();
                });

                platform.openTextDocument(new mock.TextDocument("xml", "mock://document.uri", " I like blue cheese. "));

                assert.deepStrictEqual(platform.getFormattedDocument(), undefined);
            });

            test("with provider but non-plaintext document after plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                extension.setOnProvideFormattedDocument((parsedDocument: mock.PlaintextDocument) => {
                    return parsedDocument.getText().trim();
                });

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", " I like blue cheese. "));
                platform.openTextDocument(new mock.TextDocument("xml", "mock://document.xml", " I like blue cheese too. "));

                assert.deepStrictEqual(platform.getFormattedDocument(), undefined);
            });

            test("with provider and plaintext document after plaintext document opened", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                extension.setOnProvideFormattedDocument((parsedDocument: mock.PlaintextDocument) => {
                    return parsedDocument.getText().trim();
                });

                platform.openTextDocument(new mock.TextDocument("txt", "mock://document.uri", " I like blue cheese. "));

                assert.deepStrictEqual(platform.getFormattedDocument(), "I like blue cheese.");
            });
        });

        test("on configuration changed with active text editor", () => {
            const platform = new mock.Platform();
            const extension = new mock.PlaintextLanguageExtension(platform);

            platform.openTextDocument(new mock.TextDocument("txt", "B", "C"));

            platform.setConfiguration(new mock.Configuration());
        });

        suite("getActiveTextEditor()", () => {
            test("with no platform", () => {
                const extension = new mock.PlaintextLanguageExtension(undefined);
                assert.deepStrictEqual(extension.getActiveTextEditor(), undefined);
            });

            test("with no active text editor", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);
                assert.deepStrictEqual(extension.getActiveTextEditor(), undefined);
            });

            test("with non-plaintext active text editor", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                platform.openTextDocument(new mock.TextDocument("A", "B", "C"));

                assert.deepStrictEqual(extension.getActiveTextEditor(), new mock.TextEditor(new mock.TextDocument("A", "B", "C")));
            });

            test("with plaintext active text editor", () => {
                const platform = new mock.Platform();
                const extension = new mock.PlaintextLanguageExtension(platform);

                platform.openTextDocument(new mock.TextDocument("txt", "B", "C"));

                assert.deepStrictEqual(extension.getActiveTextEditor(), new mock.TextEditor(new mock.TextDocument("txt", "B", "C")));
            });
        });
    });
});