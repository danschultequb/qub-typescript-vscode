import * as os from "os";
import * as path from "path";
import * as qub from "qub";

/**
 * An object that contains a dispose() method. dispose() is typically called right before an object
 * is no longer used.
 */
export interface Disposable {
    dispose(): void;
}

export interface Thenable<T> {
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | Thenable<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | Thenable<TResult2>) | undefined | null): Thenable<TResult1 | TResult2>;
}


export class Completion {
    constructor(private _label: string, private _span: qub.Span, private _description: string = "") {
    }

    public get label(): string {
        return this._label;
    }

    public get span(): qub.Span {
        return this._span;
    }

    public get description(): string {
        return this._description;
    }
}

export class Hover {
    constructor(private _textLines: string[], private _span: qub.Span) {
    }

    public get textLines(): string[] {
        return this._textLines;
    }

    public get span(): qub.Span {
        return this._span;
    }
}

/**
 * A configuration file.
 */
export interface Configuration {
    /**
     * Get the value in this Configuration file for the property at the provided path. The
     * propertyPath argument should be a dotted-string (this.is.a.path). If no property is found at
     * the provided propertyPath, then the defaultValue argument will be returned.
     */
    get<T>(propertyPath: string, defaultValue?: T): T;
}

/**
 * An object that contains the text of a document.
 */
export interface TextDocument {
    /**
     * Get the language (file format) that this text document is written in.
     */
    getLanguageId(): string;

    /**
     * Get the URI to the source of this document.
     */
    getURI(): string;

    /**
     * Get the text contents of this document.
     */
    getText(): string;

    /**
     * Get the line index that the provided characterIndex appears on.
     */
    getLineIndex(characterIndex: number): number;

    /**
     * Get the column index that the provided characterIndex appears on.
     */
    getColumnIndex(characterIndex: number): number;

    /**
     * Get the leading whitespace/indentation for the line that contains the provided character
     * index. If the line has no indentation, then the empty string will be returned. If the
     * requested line index doesn't exist (negative or greater than number of lines in the file),
     * then undefined will be returned.
     */
    getLineIndent(characterIndex: number): string;
}

/**
 * An object that can edit the contents of a TextDocument.
 */
export interface TextEditor {
    /**
     * Get the TextDocument that this TextEditor is editing.
     */
    getDocument(): TextDocument;

    /**
     * Get the cursor's index inside this TextEditor.
     */
    getCursorIndex(): number;

    /**
     * Set the cursor's index inside this TextEditor.
     */
    setCursorIndex(cursorIndex: number): void;

    /**
     * Insert the provided text at the provided start index inside the TextDocument that this
     * TextEditor is targeting.
     */
    insert(startIndex: number, text: string): void;

    /**
     * Get the current indent string used by this editor (2 spaces, 1 tab, etc.).
     */
    getIndent(): string;

    /**
     * Get the current newline string used by this editor (\n, \r\n, etc.).
     */
    getNewLine(): string;
}

/**
 * A change that occurred to a TextDocument.
 */
export class TextDocumentChange {
    constructor(private _textEditor: TextEditor, private _span: qub.Span, private _text: string) {
    }

    /**
     * Get the TextEditor that this change happened to.
     */
    public get editor(): TextEditor {
        return this._textEditor || undefined;
    }

    /**
     * Get the TextDocument that this change happened to.
     */
    public get textDocument(): TextDocument {
        return this._textEditor ? this._textEditor.getDocument() : undefined;
    }

    /**
     * The span in the original document over which this change occurred.
     */
    public get span(): qub.Span {
        return this._span;
    }

    /**
     * Get the index in the TextDocument where this change started.
     */
    public get startIndex(): number {
        return this._span.startIndex;
    }

    /**
     * Get the index in the TextDocument directly after this change.
     */
    public get afterChangeAfterEndIndex(): number {
        return this.startIndex + this._text.length;
    }

    /**
     * Get the text that replaced the affected span.
     */
    public get text(): string {
        return this._text;
    }
}

/**
 * A change that occurred to a recognized parsed document.
 */
export class ParsedDocumentChange<ParsedDocumentType> extends TextDocumentChange {
    constructor(private _parsedDocument: ParsedDocumentType, textEditor: TextEditor, span: qub.Span, text: string) {
        super(textEditor, span, text);
    }

    /**
     * The recognized parsed document that this change occurred to.
     */
    public get parsedDocument(): ParsedDocumentType {
        return this._parsedDocument;
    }
}


/**
 * A generic interface for the VS Code application platform.
 */
export interface Platform extends Disposable {
    /**
     * Get the text editor that is active. If no text editor is active, then return undefined.
     */
    getActiveTextEditor(): TextEditor;

    /**
     * Get the cursor index of the active text editor. If no text editor is active, then undefined
     * will be returned.
     */
    getCursorIndex(): number;

    /**
     * Set the cursor index of the active text editor. If no text editor is active, then this
     * function will do nothing.
     */
    setCursorIndex(cursorCharacterIndex: number): void;

    /**
     * Set the function to call when the active text editor in VSCode is changed.
     */
    setActiveEditorChangedCallback(callback: (editor: TextEditor) => void): Disposable;

    /**
     * Set the function to call when the VS Code application's configuration is changed and saved.
     */
    setConfigurationChangedCallback(callback: () => void): Disposable;

    /**
     * Set the function to call when a text document is opened.
     */
    setTextDocumentOpenedCallback(callback: (openedTextDocument: TextDocument) => void): Disposable;

    /**
     * Set the function to call when a text document is saved.
     */
    setTextDocumentSavedCallback(callback: (savedTextDocument: TextDocument) => void): Disposable;

    /**
     * Set the function to call when a text document is changed.
     */
    setTextDocumentChangedCallback(callback: (change: TextDocumentChange) => void): Disposable;

    /**
     * Set the function to call when a text document is closed.
     */
    setTextDocumentClosedCallback(callback: (closedTextDocument: TextDocument) => void): Disposable;

    /**
     * Set the function to call when the cursor hovers over a text document with the provided
     * language identifier.
     */
    setProvideHoverCallback(languageId: string, callback: (textDocument: TextDocument, characterIndex: number) => Hover): Disposable;

    /**
     * Set the function to call when one of the completion trigger characters is pressed on a text
     * document with provided language identifier.
     */
    setProvideCompletionsCallback(languageId: string, completionTriggerCharacters: string[], callback: (textDocument: TextDocument, characterIndex: number) => qub.Iterable<Completion>): Disposable;

    setProvideFormattedDocumentTextCallback(languageId: string, callback: (textDocument: TextDocument) => string): Disposable;

    setTextDocumentIssues(extensionName: string, textDocument: TextDocument, issues: qub.Iterable<qub.Issue>): void;

    /**
     * Get the VSCode configuration file's contents.
     */
    getConfiguration(): Configuration;

    /**
     * Get whether an extension with the provided name is installed.
     */
    isExtensionInstalled(publisher: string, extensionName: string): boolean;

    /**
     * Get the locale that VSCode is being used in.
     */
    getLocale(): string;

    /**
     * Get the unique identifier that defines the computer that VS Code is being used on.
     */
    getMachineId(): string;

    /**
     * Get the unique identifier for this session of VS Code.
     */
    getSessionId(): string;

    /**
     * Get a string identifier for the operating system that VS Code is running on.
     */
    getOperatingSystem(): string;
}

/**
 * A generic LanguageExtension class that wraps the VS Code functions and classes into an easier
 * interface. All VS Code extensions that parse and edit a textDocument should implement this class.
 */
export abstract class LanguageExtension<ParsedDocumentType> implements Disposable {
    private _disposed: boolean;
    private _basicSubscriptions = new qub.SingleLinkList<Disposable>();
    private _languageSubscriptions = new qub.SingleLinkList<Disposable>();

    private _parsedDocuments = new qub.Map<string, ParsedDocumentType>();

    private _onProvideIssues: (textDocument: ParsedDocumentType) => qub.Iterable<qub.Issue>;
    private _onProvideHoverFunction: (textDocument: ParsedDocumentType, index: number) => Hover;
    private _onProvideCompletionsTriggerCharacters: string[];
    private _onProvideCompletionsFunction: (textDocument: ParsedDocumentType, index: number) => qub.Iterable<Completion>;
    private _onProvideFormattedDocumentFunction: (textDocument: ParsedDocumentType) => string;

    private _onParsedDocumentOpened: (parsedDocument: ParsedDocumentType) => void;
    private _onParsedDocumentChanged: (parsedDocumentChange: ParsedDocumentChange<ParsedDocumentType>) => void;
    private _onParsedDocumentSaved: (parsedDocument: ParsedDocumentType) => void;
    private _onParsedDocumentClosed: (parsedDocument: ParsedDocumentType) => void;

    constructor(private _extensionName: string, private _extensionVersion: string, private _language: string, private _platform: Platform) {
        if (this._platform) {
            this._basicSubscriptions.add(this._platform.setActiveEditorChangedCallback((activeEditor: TextEditor) => {
                this.updateActiveDocumentParse();
            }));

            this._basicSubscriptions.add(this._platform.setConfigurationChangedCallback(() => {
                this.updateActiveDocumentParse();
            }));

            this._basicSubscriptions.add(this._platform.setTextDocumentOpenedCallback((openedTextDocument: TextDocument) => {
                this.onDocumentOpened(openedTextDocument);
            }));

            this._basicSubscriptions.add(this._platform.setTextDocumentSavedCallback((savedTextDocument: TextDocument) => {
                this.onDocumentSaved(savedTextDocument);
            }));
        }
    }

    public dispose(): void {
        if (!this._disposed) {
            this._disposed = true;

            for (const languageSubscription of this._languageSubscriptions) {
                languageSubscription.dispose();
            }
            this._languageSubscriptions.clear();

            for (const basicEventSubscription of this._basicSubscriptions) {
                basicEventSubscription.dispose();
            }
            this._basicSubscriptions.clear();

            if (this._platform) {
                this._platform.dispose();
            }
        }
    }

    public get name(): string {
        return this._extensionName;
    }

    public get version(): string {
        return this._extensionVersion;
    }

    /**
     * Get the file path to the settings file for this extension. This is the JSON file where
     * details can be kept that need to be saved across VS Code sessions. This file may or may not
     * exist.
     */
    public getSettingsFilePath(): string {
        return path.join(os.homedir(), ".vscode", this.name + ".json");
    }

    public getConfigurationValue<T>(propertyPath: string, defaultValue?: T): T {
        const configuration: Configuration = this.getConfiguration();
        return configuration ? configuration.get<T>(`${this._extensionName}.${propertyPath}`, defaultValue) : defaultValue;
    }

    /**
     * Set the function that will be called when VS Code requests for the issues associated with the
     * provided textDocument.
     * NOTE: The provided function must be a function, and not a method that is dependant on a
     * caller object. If you want to call a method, call this setter with a lamda function that
     * wraps the method invocation.
     */
    public setOnProvideIssues(onProvideIssues: (parsedDocument: ParsedDocumentType) => qub.Iterable<qub.Issue>): void {
        this._onProvideIssues = onProvideIssues;
    }

    /**
     * Set the function that will be called when VS Code requests for hover information.
     * NOTE: The provided function must be a function, and not a method that is dependant on a
     * caller object. If you want to call a method, call this setter with a lamda function that
     * wraps the method invocation.
     */
    public setOnProvideHover(onProvideHover: (parsedDocument: ParsedDocumentType, index: number) => Hover): void {
        this._onProvideHoverFunction = onProvideHover;
    }

    /**
     * Set the function that will be called when a document that this language extension can parse
     * is opened.
     * NOTE: The provided function must be a function, and not a method that is dependant on a
     * caller object. If you want to call a method, call this setter with a lamda function that
     * wraps the method invocation.
     */
    public setOnParsedDocumentOpened(onParsedDocumentOpened: (parsedDocument: ParsedDocumentType) => void): void {
        this._onParsedDocumentOpened = onParsedDocumentOpened;
    }

    /**
     * Set the function that will be called when a document that this language extension can parse
     * is saved.
     * NOTE: The provided function must be a function, and not a method that is dependant on a
     * caller object. If you want to call a method, call this setter with a lamda function that
     * wraps the method invocation.
     */
    public setOnParsedDocumentSaved(onParsedDocumentSaved: (parsedDocument: ParsedDocumentType) => void): void {
        this._onParsedDocumentSaved = onParsedDocumentSaved;
    }

    /**
     * Set the function that will be called when a document that this language extension can parse
     * is changed.
     * NOTE: The provided function must be a function, and not a method that is dependant on a
     * caller object. If you want to call a method, call this setter with a lamda function that
     * wraps the method invocation.
     */
    public setOnParsedDocumentChanged(onParsedDocumentChanged: (parsedDocumentChange: ParsedDocumentChange<ParsedDocumentType>) => void): void {
        this._onParsedDocumentChanged = onParsedDocumentChanged;
    }

    /**
     * Set the function that will be called when a document that this language extension can parse
     * is closed.
     * NOTE: The provided function must be a function, and not a method that is dependant on a
     * caller object. If you want to call a method, call this setter with a lamda function that
     * wraps the method invocation.
     */
    public setOnParsedDocumentClosed(onParsedDocumentClosed: (parsedDocument: ParsedDocumentType) => void): void {
        this._onParsedDocumentClosed = onParsedDocumentClosed;
    }

    /**
     * Get whether an extension with the provided name is installed.
     */
    public isExtensionInstalled(publisher: string, extensionName: string): boolean {
        return this._platform.isExtensionInstalled(publisher, extensionName);
    }

    /**
     * Get the configuration that is associated with this extension.
     */
    public getConfiguration(): Configuration {
        return this._platform ? this._platform.getConfiguration() : undefined;
    }

    /**
     * Get the text editor that is currently active.
     */
    public getActiveTextEditor(): TextEditor {
        return this._platform ? this._platform.getActiveTextEditor() : undefined;
    }

    /**
     * Set the function that will be called when VS Code requests for auto-completion information.
     * NOTE: The provided function must be a function, and not a method that is dependant on a
     * caller object. If you want to call a method, call this setter with a lamda function that
     * wraps the method invocation.
     */
    public setOnProvideCompletions(triggerCharacters: string[], onProvideCompletions: (parsedDocument: ParsedDocumentType, index: number) => qub.Iterable<Completion>): void {
        this._onProvideCompletionsTriggerCharacters = triggerCharacters;
        this._onProvideCompletionsFunction = onProvideCompletions;
    }

    /**
     * Set the function that will be called when VS Code requests for the current textDocument to be
     * formatted.
     * NOTE: The provided function must be a function, and not a method that is dependant on a
     * caller object. If you want to call a method, call this setter with a lamda function that
     * wraps the method invocation.
     */
    public setOnProvideFormattedDocument(onProvideFormattedDocument: (parsedDocument: ParsedDocumentType) => string): void {
        this._onProvideFormattedDocumentFunction = onProvideFormattedDocument;
    }

    protected updateActiveDocumentParse(): void {
        const activeTextEditor: TextEditor = this.getActiveTextEditor();
        if (activeTextEditor) {
            this.updateDocumentParse(activeTextEditor.getDocument());
        }
    }

    private updateDocumentParse(textDocument: TextDocument): void {
        if (textDocument && this.isParsable(textDocument)) {
            if (!this._parsedDocuments.any()) {
                this._languageSubscriptions.add(this._platform.setTextDocumentChangedCallback((change: TextDocumentChange) => {
                    this.onTextDocumentChanged(change);
                }));

                this._languageSubscriptions.add(this._platform.setTextDocumentClosedCallback((closedTextDocument: TextDocument) => {
                    this.onDocumentClosed(closedTextDocument);
                }));

                if (this._onProvideHoverFunction) {
                    this._languageSubscriptions.add(this._platform.setProvideHoverCallback(this._language, (textDocument: TextDocument, index: number) => {
                        return this.onProvideHover(textDocument, index);
                    }));
                }

                if (this._onProvideCompletionsFunction) {
                    this._languageSubscriptions.add(this._platform.setProvideCompletionsCallback(this._language, this._onProvideCompletionsTriggerCharacters, (textDocument: TextDocument, index: number) => {
                        return this.onProvideCompletions(textDocument, index);
                    }));
                }

                if (this._onProvideFormattedDocumentFunction) {
                    this._languageSubscriptions.add(this._platform.setProvideFormattedDocumentTextCallback(this._language, (textDocument: TextDocument) => {
                        return this.onProvideFormattedText(textDocument);
                    }));
                }
            }

            const parsedDocument: ParsedDocumentType = this.parseDocument(textDocument.getText());
            this._parsedDocuments.add(textDocument.getURI(), parsedDocument);

            if (this._onProvideIssues) {
                const documentIssues: qub.Iterable<qub.Issue> = this._onProvideIssues(parsedDocument);
                this._platform.setTextDocumentIssues(this._extensionName, textDocument, documentIssues);
            }
        }
    }

    /**
     * Determine if the provided textDocument is parsable by this language extension.
     */
    protected abstract isParsable(textDocument: TextDocument): boolean;

    /**
     * Parse the provided textDocument and return the language specific representation of the textDocument'savedDocument
     * parse results.
     */
    protected abstract parseDocument(documentText: string): ParsedDocumentType;

    private getParsedDocument(textDocument: TextDocument): ParsedDocumentType {
        let parsedDocument: ParsedDocumentType;

        if (textDocument && this.isParsable(textDocument)) {
            const documentUri: string = textDocument.getURI();
            parsedDocument = this._parsedDocuments.get(documentUri);
        }

        return parsedDocument;
    }

    private onTextDocumentChanged(change: TextDocumentChange): void {
        this.updateDocumentParse(change.textDocument);
        if (this._onParsedDocumentChanged) {
            const parsedDocument: ParsedDocumentType = this.getParsedDocument(change.textDocument);
            if (parsedDocument) {
                const parsedDocumentChange = new ParsedDocumentChange(parsedDocument, change.editor, change.span, change.text);
                this._onParsedDocumentChanged(parsedDocumentChange);
            }
        }
    }

    private onDocumentOpened(textDocument: TextDocument): void {
        this.updateDocumentParse(textDocument);

        if (this._onParsedDocumentOpened) {
            const parsedDocument: ParsedDocumentType = this.getParsedDocument(textDocument);
            if (parsedDocument) {
                this._onParsedDocumentOpened(parsedDocument);
            }
        }
    }

    private onDocumentSaved(textDocument: TextDocument): void {
        this.updateDocumentParse(textDocument);

        if (this._onParsedDocumentSaved) {
            const parsedDocument: ParsedDocumentType = this.getParsedDocument(textDocument);
            if (parsedDocument) {
                this._onParsedDocumentSaved(parsedDocument);
            }
        }
    }

    private onDocumentClosed(textDocument: TextDocument): void {
        if (this._onParsedDocumentClosed) {
            const parsedDocument: ParsedDocumentType = this.getParsedDocument(textDocument);
            if (parsedDocument) {
                this._onParsedDocumentClosed(parsedDocument);
            }
        }

        const hasParsedDocumentsBeforeRemove: boolean = this._parsedDocuments.any();

        this._parsedDocuments.remove(textDocument.getURI());
        if (this._onProvideIssues) {
            this._platform.setTextDocumentIssues(this._extensionName, textDocument, new qub.SingleLinkList<qub.Issue>());
        }

        const hasParsedDocumentsAfterRemove: boolean = this._parsedDocuments.any();

        if (hasParsedDocumentsBeforeRemove && !hasParsedDocumentsAfterRemove) {
            for (const languageSubscription of this._languageSubscriptions) {
                languageSubscription.dispose();
            }
            this._languageSubscriptions.clear();
        }
    }

    private onProvideHover(textDocument: TextDocument, index: number): Hover {
        let result: Hover;

        const parsedDocument: ParsedDocumentType = this.getParsedDocument(textDocument);
        if (parsedDocument) {
            result = this._onProvideHoverFunction(parsedDocument, index);
        }

        return result;
    }

    private onProvideCompletions(textDocument: TextDocument, index: number): qub.Iterable<Completion> {
        let result: qub.Iterable<Completion>;

        const parsedDocument: ParsedDocumentType = this.getParsedDocument(textDocument);
        if (parsedDocument) {
            result = this._onProvideCompletionsFunction(parsedDocument, index);
        }

        return result;
    }

    private onProvideFormattedText(textDocument: TextDocument): string {
        let formattedText: string;

        const parsedDocument: ParsedDocumentType = this.getParsedDocument(textDocument);
        if (parsedDocument) {
            formattedText = this._onProvideFormattedDocumentFunction(parsedDocument);
        }

        return formattedText;
    }
}