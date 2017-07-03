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
    setCursorIndex(cursorIndex: number): void;

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
    setProvideHoverCallback(languageId: string, callback: (textDocument: TextDocument, index: number) => Hover): Disposable;

    /**
     * Set the function to call when one of the completion trigger characters is pressed on a text
     * document with provided language identifier.
     */
    setProvideCompletionsCallback(languageId: string, completionTriggerCharacters: string[], callback: (textDocument: TextDocument, index: number) => qub.Iterable<Completion>): Disposable;

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

    /**
     * Write the provided message to the console.
     */
    consoleLog(message: string): void;
}