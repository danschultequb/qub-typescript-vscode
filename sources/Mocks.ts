import * as qub from "qub";

import * as interfaces from "./Interfaces";

export class Disposable implements interfaces.Disposable {
    public dispose(): void {
    }
}

export class Configuration implements interfaces.Configuration {
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

export class TextDocument implements interfaces.TextDocument {
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

export class TextEditor implements interfaces.TextEditor {
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

    public insert(startIndex: number, text: string): Thenable<boolean> {
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

    public getNewLine(): string {
        return this._newline;
    }

    public setNewLine(newline: string): void {
        this._newline = newline;
    }
}

export class Platform implements interfaces.Platform {
    private _activeTextEditor: interfaces.TextEditor;
    private _configuration: interfaces.Configuration;
    private _installedExtensions = new qub.Map<string, qub.List<string>>();

    private _configurationChanged: (newConfiguration: interfaces.Configuration) => void;
    private _activeEditorChanged: (editor: interfaces.TextEditor) => void;
    private _textDocumentOpened: (openedTextDocument: interfaces.TextDocument) => void;
    private _textDocumentSaved: (savedTextDocument: interfaces.TextDocument) => void;
    private _textDocumentChanged: (textDocumentChange: interfaces.TextDocumentChange) => void;
    private _textDocumentClosed: (closedTextDocument: interfaces.TextDocument) => void;
    private _provideHover: (textDocument: interfaces.TextDocument, index: number) => interfaces.Hover;
    private _provideCompletions: (textDocument: interfaces.TextDocument, index: number) => qub.Iterable<interfaces.Completion>;
    private _provideFormattedDocument: (textDocument: interfaces.TextDocument) => string;

    private _consoleLogs = new qub.SingleLinkList<string>();

    public dispose(): void {
    }

    /**
     * Invoke a hover action at the provided index of the active text editor.
     */
    public getHoverAt(characterIndex: number): interfaces.Hover {
        let result: interfaces.Hover;

        if (this._provideHover && qub.isDefined(characterIndex) && this._activeTextEditor) {
            const activeDocument: interfaces.TextDocument = this._activeTextEditor.getDocument();
            if (activeDocument) {
                result = this._provideHover(activeDocument, characterIndex);
            }
        }

        return result;
    }

    /**
     * Invoke a get completions action at the provided index of the active text editor.
     */
    public getCompletionsAt(index: number): qub.Iterable<interfaces.Completion> {
        let result: qub.Iterable<interfaces.Completion>;

        if (this._provideCompletions && qub.isDefined(index) && this._activeTextEditor) {
            const activeDocument: interfaces.TextDocument = this._activeTextEditor.getDocument();
            if (activeDocument) {
                result = this._provideCompletions(activeDocument, index);
            }
        }

        if (!result) {
            result = new qub.SingleLinkList<interfaces.Completion>();
        }

        return result;
    }

    public getFormattedDocument(): string {
        let result: string;

        if (this._provideFormattedDocument && this._activeTextEditor) {
            const activeDocument: interfaces.TextDocument = this._activeTextEditor.getDocument();
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

    public getActiveTextEditor(): interfaces.TextEditor {
        return this._activeTextEditor;
    }

    public setActiveTextEditor(activeTextEditor: interfaces.TextEditor): void {
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

        const activeTextEditor: interfaces.TextEditor = this.getActiveTextEditor();
        if (activeTextEditor && activeTextEditor.getDocument() === textDocument) {
            this.setActiveTextEditor(null);
        }
    }

    /**
     * Insert the provided text at the provided startIndex in the active text editor.
     */
    public insertText(startIndex: number, text: string): void {
        if (this._activeTextEditor) {
            this._activeTextEditor.insert(startIndex, text);
            if (this._textDocumentChanged) {
                const change = new interfaces.TextDocumentChange(this._activeTextEditor, new qub.Span(startIndex, 0), text);
                this._textDocumentChanged(change);
            }
        }
    }

    public setActiveEditorChangedCallback(activeEditorChanged: (editor: interfaces.TextEditor) => void): interfaces.Disposable {
        this._activeEditorChanged = activeEditorChanged;
        return new Disposable();
    }

    public setConfigurationChangedCallback(callback: () => void): interfaces.Disposable {
        this._configurationChanged = callback;
        return new Disposable();
    }

    public setTextDocumentOpenedCallback(callback: (openedTextDocument: interfaces.TextDocument) => void): interfaces.Disposable {
        this._textDocumentOpened = callback;
        return new Disposable();
    }

    public setTextDocumentSavedCallback(callback: (savedTextDocument: interfaces.TextDocument) => void): interfaces.Disposable {
        this._textDocumentSaved = callback;
        return new Disposable();
    }

    public setTextDocumentChangedCallback(callback: (textDocumentChange: interfaces.TextDocumentChange) => void): interfaces.Disposable {
        this._textDocumentChanged = callback;
        return new Disposable();
    }

    public setTextDocumentClosedCallback(callback: (closedTextDocument: interfaces.TextDocument) => void): interfaces.Disposable {
        this._textDocumentClosed = callback;
        return new Disposable();
    }

    public setProvideHoverCallback(languageId: string, callback: (textDocument: interfaces.TextDocument, index: number) => interfaces.Hover): interfaces.Disposable {
        this._provideHover = callback;
        return new Disposable();
    }

    public setProvideCompletionsCallback(languageId: string, completionTriggerCharacters: string[], callback: (textDocument: interfaces.TextDocument, index: number) => qub.Iterable<interfaces.Completion>): interfaces.Disposable {
        this._provideCompletions = callback;
        return new Disposable();
    }

    public setProvideFormattedDocumentTextCallback(languageId: string, callback: (textDocument: interfaces.TextDocument) => string): interfaces.Disposable {
        this._provideFormattedDocument = callback;
        return new Disposable();
    }

    public setTextDocumentIssues(extensionName: string, textDocument: interfaces.TextDocument, issues: qub.Iterable<qub.Issue>): void {
    }

    public getConfiguration(): interfaces.Configuration {
        return this._configuration;
    }

    public setConfiguration(configuration: interfaces.Configuration): void {
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

    public consoleLog(message: string): void {
        this._consoleLogs.add(message);
    }

    /**
     * Get the logs that have been written to the console.
     */
    public getConsoleLogs(): qub.Iterable<string> {
        return this._consoleLogs;
    }
}

export class PlaintextDocument {
    constructor(private _text: string) {
    }

    public getText(): string {
        return this._text;
    }
}

export class PlaintextLanguageExtension extends interfaces.LanguageExtension<PlaintextDocument> {
    constructor(platform: interfaces.Platform) {
        super("Plaintext Tools", "1.0.0", "txt", platform);
    }

    public isParsable(textDocument: interfaces.TextDocument): boolean {
        return textDocument && textDocument.getLanguageId() === "txt" ? true : false;
    }

    public parseDocument(documentText: string): PlaintextDocument {
        return new PlaintextDocument(documentText);
    }
}