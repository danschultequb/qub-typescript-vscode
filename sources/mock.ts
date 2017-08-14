import * as qub from "qub";
import * as fs from "qub-filesystem";
import * as mockfs from "qub-filesystem/mock";

import * as main from "./main";

export class Disposable implements main.Disposable {
    public dispose(): void {
    }
}

export class Configuration implements main.Configuration {
    constructor(private _values: Object = {}) {
    }

    public get<T>(propertyPath: string, defaultValue?: T): T {
        let result: T = defaultValue;

        if (propertyPath && this._values) {
            const propertyPathParts: string[] = propertyPath.split(".");
            let currentValue: any = this._values;

            let index: number = 0;
            for (; index < propertyPathParts.length; ++index) {
                if (!currentValue || !(currentValue instanceof Object)) {
                    break;
                }
                else {
                    const propertyPathPart: string = propertyPathParts[index];
                    currentValue = currentValue[propertyPathPart];
                }
            }

            if (index === propertyPathParts.length) {
                result = currentValue as T;
            }
        }

        return result;
    }
}

export class TextDocument implements main.TextDocument {
    constructor(private _languageId: string, private _uri: string, private _text?: string) {
        if (!this._text) {
            this._text = "";
        }
    }

    public getLanguageId(): string {
        return this._languageId;
    }

    public getURI(): string {
        return this._uri;
    }

    public getText(): string {
        return this._text;
    }

    public setText(text: string): void {
        this._text = text ? text : "";
    }

    public getColumnIndex(characterIndex: number): number {
        return qub.getColumnIndex(this.getText(), characterIndex);
    }

    public getLineIndex(characterIndex: number): number {
        return qub.getLineIndex(this.getText(), characterIndex);
    }

    public getLineIndent(characterIndex: number): string {
        let result: string;

        if (characterIndex >= 0) {
            const previousNewLineCharacterIndex: number = this._text.lastIndexOf("\n", characterIndex - 1);

            // If no previous new line character is found, then -1 is returned. Adding 1 brings us to
            // the beginning of the line.
            let currentIndex: number = previousNewLineCharacterIndex + 1;
            let currentCharacter: string = this._text[currentIndex];

            result = "";
            while (currentCharacter === " " || currentCharacter === "\t") {
                result += currentCharacter;

                ++currentIndex;
                currentCharacter = this._text[currentIndex];
            }
        }

        return result;
    }
}

export class TextEditor implements main.TextEditor {
    private _cursorIndex: number = 0;
    private _indent: string = "  ";
    private _newline: string = "\n";

    constructor(private _document: TextDocument) {
    }

    public getDocument(): TextDocument {
        return this._document;
    }

    public getCursorIndex(): number {
        return this._cursorIndex;
    }

    public setCursorIndex(cursorIndex: number): void {
        this._cursorIndex = cursorIndex;
    }

    public insert(startIndex: number, text: string): main.Thenable<boolean> {
        const documentText: string = this._document.getText();
        const beforeInsert: string = startIndex < 0 ? "" : documentText.substr(0, startIndex);
        const afterInsert: string = startIndex < documentText.length ? documentText.substr(startIndex) : "";
        this._document.setText(beforeInsert + text + afterInsert);

        this.setCursorIndex(startIndex + qub.getLength(text));

        return
    }

    public getIndent(): string {
        return this._indent;
    }

    public setIndent(indent: string): void {
        this._indent = indent;
    }

    public getTabLength(): number {
        return 2;
    }

    public getNewLine(): string {
        return this._newline;
    }

    public setNewLine(newline: string): void {
        this._newline = newline;
    }
}

export class Platform implements main.Platform {
    private _activeTextEditor: main.TextEditor;
    private _configuration: main.Configuration;
    private _installedExtensions = new qub.Map<string, qub.List<string>>();
    private _textDocumentIssues = new qub.Map<string, qub.Iterable<qub.Issue>>();
    private _fileSystem: fs.FileSystem = new mockfs.FileSystem();

    private _configurationChanged: (newConfiguration: main.Configuration) => void;
    private _activeEditorChanged: (editor: main.TextEditor) => void;
    private _textDocumentOpened: (openedTextDocument: main.TextDocument) => void;
    private _textDocumentSaved: (savedTextDocument: main.TextDocument) => void;
    private _textDocumentChanged: (textDocumentChange: main.TextDocumentChange) => void;
    private _textDocumentClosed: (closedTextDocument: main.TextDocument) => void;
    private _provideHover: (textDocument: main.TextDocument, index: number) => main.Hover;
    private _provideCompletions: (textDocument: main.TextDocument, index: number) => qub.Iterable<main.Completion>;
    private _provideFormattedDocument: (textDocument: main.TextDocument) => string;

    public dispose(): void {
    }

    public getFileSystem(): fs.FileSystem {
        return this._fileSystem;
    }

    /**
     * Invoke a hover action at the provided index of the active text editor.
     */
    public getHoverAt(characterIndex: number): main.Hover {
        let result: main.Hover;

        if (this._provideHover && qub.isDefined(characterIndex) && this._activeTextEditor) {
            const activeDocument: main.TextDocument = this._activeTextEditor.getDocument();
            if (activeDocument) {
                result = this._provideHover(activeDocument, characterIndex);
            }
        }

        return result;
    }

    /**
     * Invoke a get completions action at the provided index of the active text editor.
     */
    public getCompletionsAt(index: number): qub.Iterable<main.Completion> {
        let result: qub.Iterable<main.Completion>;

        if (this._provideCompletions && qub.isDefined(index) && this._activeTextEditor) {
            const activeDocument: main.TextDocument = this._activeTextEditor.getDocument();
            if (activeDocument) {
                result = this._provideCompletions(activeDocument, index);
            }
        }

        if (!result) {
            result = new qub.SingleLinkList<main.Completion>();
        }

        return result;
    }

    public getFormattedDocument(): string {
        let result: string;

        if (this._provideFormattedDocument && this._activeTextEditor) {
            const activeDocument: main.TextDocument = this._activeTextEditor.getDocument();
            if (activeDocument) {
                result = this._provideFormattedDocument(activeDocument);
            }
        }

        return result;
    }

    /**
     * Add an entry to this mock application's registry of installed extensions.
     */
    public addInstalledExtension(publisherName: string, extensionName: string): void {
        let publisherExtensions: qub.List<string> = this._installedExtensions.get(publisherName);
        if (!publisherExtensions) {
            publisherExtensions = new qub.SingleLinkList<string>();
            this._installedExtensions.add(publisherName, publisherExtensions);
        }

        if (!publisherExtensions.contains(extensionName)) {
            publisherExtensions.add(extensionName);
        }
    }

    public getActiveTextEditor(): main.TextEditor {
        return this._activeTextEditor;
    }

    public setActiveTextEditor(activeTextEditor: main.TextEditor): void {
        if (this._activeTextEditor !== activeTextEditor) {
            this._activeTextEditor = activeTextEditor;

            if (this._activeEditorChanged) {
                this._activeEditorChanged(activeTextEditor);
            }
        }
    }

    public getCursorIndex(): number {
        return this._activeTextEditor ? this._activeTextEditor.getCursorIndex() : undefined;
    }

    public setCursorIndex(cursorIndex: number): void {
        if (this._activeTextEditor) {
            this._activeTextEditor.setCursorIndex(cursorIndex);
        }
    }

    public openTextDocument(textDocument: TextDocument): void {
        this.setActiveTextEditor(new TextEditor(textDocument));

        if (this._textDocumentOpened) {
            this._textDocumentOpened(textDocument);
        }
    }

    public saveTextDocument(textDocument: TextDocument): void {
        if (this._textDocumentSaved) {
            this._textDocumentSaved(textDocument);
        }
    }

    public closeTextDocument(textDocument: TextDocument): void {
        if (this._textDocumentClosed) {
            this._textDocumentClosed(textDocument);
        }

        const activeTextEditor: main.TextEditor = this.getActiveTextEditor();
        if (activeTextEditor && activeTextEditor.getDocument() === textDocument) {
            this.setActiveTextEditor(undefined);
        }
    }

    /**
     * Insert the provided text at the provided startIndex in the active text editor.
     */
    public insertText(startIndex: number, text: string): void {
        if (this._activeTextEditor && this._activeTextEditor.getDocument()) {
            this._activeTextEditor.insert(startIndex, text);
            if (this._textDocumentChanged) {
                const change = new main.TextDocumentChange(this._activeTextEditor, new qub.Span(startIndex, 0), text);
                this._textDocumentChanged(change);
            }
        }
    }

    public setActiveEditorChangedCallback(activeEditorChanged: (editor: main.TextEditor) => void): main.Disposable {
        this._activeEditorChanged = activeEditorChanged;
        return new Disposable();
    }

    public setConfigurationChangedCallback(callback: () => void): main.Disposable {
        this._configurationChanged = callback;
        return new Disposable();
    }

    public setTextDocumentOpenedCallback(callback: (openedTextDocument: main.TextDocument) => void): main.Disposable {
        this._textDocumentOpened = callback;
        return new Disposable();
    }

    public setTextDocumentSavedCallback(callback: (savedTextDocument: main.TextDocument) => void): main.Disposable {
        this._textDocumentSaved = callback;
        return new Disposable();
    }

    public setTextDocumentChangedCallback(callback: (textDocumentChange: main.TextDocumentChange) => void): main.Disposable {
        this._textDocumentChanged = callback;
        return new Disposable();
    }

    public setTextDocumentClosedCallback(callback: (closedTextDocument: main.TextDocument) => void): main.Disposable {
        this._textDocumentClosed = callback;
        return new Disposable();
    }

    public setProvideHoverCallback(languageId: string, callback: (textDocument: main.TextDocument, index: number) => main.Hover): main.Disposable {
        this._provideHover = callback;
        return new Disposable();
    }

    public setProvideCompletionsCallback(languageId: string, completionTriggerCharacters: string[], callback: (textDocument: main.TextDocument, index: number) => qub.Iterable<main.Completion>): main.Disposable {
        this._provideCompletions = callback;
        return new Disposable();
    }

    public setProvideFormattedDocumentTextCallback(languageId: string, callback: (textDocument: main.TextDocument) => string): main.Disposable {
        this._provideFormattedDocument = callback;
        return new Disposable();
    }

    public setTextDocumentIssues(extensionName: string, textDocument: main.TextDocument, issues: qub.Iterable<qub.Issue>): void {
        this._textDocumentIssues.add(textDocument ? textDocument.getURI() : undefined, issues);
    }

    public getTextDocumentIssues(textDocumentUri: string): qub.Iterable<qub.Issue> {
        let result: qub.Iterable<qub.Issue> = this._textDocumentIssues.get(textDocumentUri);
        if (!result) {
            result = new qub.SingleLinkList<qub.Issue>();
        }
        return result;
    }

    public getConfiguration(): main.Configuration {
        return this._configuration;
    }

    public setConfiguration(configuration: main.Configuration): void {
        if (this._configuration !== configuration) {
            this._configuration = configuration;
            if (this._configurationChanged) {
                this._configurationChanged(configuration);
            }
        }
    }

    public isExtensionInstalled(publisher: string, extensionName: string): boolean {
        const publisherExtensions: qub.Iterable<string> = this._installedExtensions.get(publisher);
        return publisherExtensions && publisherExtensions.contains(extensionName) ? true : false;
    }

    public getLocale(): string {
        return "MOCK_LOCALE";
    }

    public getMachineId(): string {
        return "MOCK_MACHINE_ID";
    }

    public getSessionId(): string {
        return "MOCK_SESSION_ID";
    }

    public getOperatingSystem(): string {
        return "MOCK_OPERATING_SYSTEM";
    }
}

export class PlaintextDocument {
    constructor(private _text: string) {
    }

    public getText(): string {
        return this._text;
    }
}

export class PlaintextLanguageExtension extends main.LanguageExtension<PlaintextDocument> {
    constructor(platform: main.Platform) {
        super("Plaintext Tools", "1.0.0", "txt", platform);
    }

    public isParsable(textDocument: main.TextDocument): boolean {
        return textDocument && textDocument.getLanguageId() === "txt" ? true : false;
    }

    public parseDocument(documentText: string): PlaintextDocument {
        return new PlaintextDocument(documentText);
    }
}