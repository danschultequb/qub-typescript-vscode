import * as os from "os";
import * as qub from "qub";
import * as vscode from "vscode";

import * as interfaces from "./interfaces";

class Configuration implements interfaces.Configuration {
    constructor(private _configuration: vscode.WorkspaceConfiguration) {
    }

    public get<T>(propertyPath: string, defaultValue?: T): T {
        return this._configuration.get<T>(propertyPath, defaultValue);
    }
}

class TextDocument implements interfaces.TextDocument {
    constructor(private _textDocument: vscode.TextDocument) {
    }

    public getLanguageId(): string {
        return this._textDocument.languageId;
    }

    public getURI(): string {
        return this._textDocument.uri.toString();
    }

    public getText(): string {
        return this._textDocument.getText();
    }

    public toPosition(index: number): vscode.Position {
        return this._textDocument.positionAt(index);
    }

    public toIndex(position: vscode.Position): number {
        return this._textDocument.offsetAt(position);
    }

    public toRange(span: qub.Span): vscode.Range {
        return new vscode.Range(this.toPosition(span.startIndex), this.toPosition(span.afterEndIndex));
    }

    public toSpan(range: vscode.Range): qub.Span {
        const startIndex: number = this.toIndex(range.start);
        const afterEndIndex: number = this.toIndex(range.end);
        return new qub.Span(startIndex, afterEndIndex - startIndex);
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
            const position: vscode.Position = this.toPosition(characterIndex);
            const line: vscode.TextLine = this._textDocument.lineAt(position.line);
            const indentCharactersLength: number = line.firstNonWhitespaceCharacterIndex;
            result = line.text.substring(0, indentCharactersLength);
        }

        return result;
    }
}

class TextEditor implements interfaces.TextEditor {
    constructor(private _textEditor: vscode.TextEditor) {
    }

    public getDocument(): TextDocument {
        return new TextDocument(this._textEditor.document);
    }

    public getCursorIndex(): number {
        return this.getDocument().toIndex(this._textEditor.selection.start);
    }

    public setCursorIndex(cursorIndex: number): void {
        const cursorPosition: vscode.Position = this.getDocument().toPosition(cursorIndex);
        this._textEditor.selection = new vscode.Selection(cursorPosition, cursorPosition);
    }

    public insert(startIndex: number, text: string): void {
        this._textEditor.edit((editBuilder: vscode.TextEditorEdit) => {
            editBuilder.insert(this.getDocument().toPosition(startIndex), text);
        });
    }

    public getIndent(): string {
        return this._textEditor.options.insertSpaces ? qub.repeat(" ", <number>this._textEditor.options.tabSize) : "\t";
    }

    public getNewLine(): string {
        return "\n";
    }
}

/**
 * The VS Code implementation of the Platform interface.
 */
export class Platform implements interfaces.Platform, interfaces.Disposable {
    private _diagnosticCollection: vscode.DiagnosticCollection;
    
    /**
     * Perform any cleanup operations that must be completed before this object is released.
     */
    public dispose(): void {
        if (this._diagnosticCollection) {
            this._diagnosticCollection.clear();
            this._diagnosticCollection = undefined;
        }
    }

    /**
     * Get the text editor that is active. If no text editor is active, then return undefined.
     */
    public getActiveTextEditor(): interfaces.TextEditor {
        const vscodeActiveTextEditor: vscode.TextEditor = vscode.window.activeTextEditor;
        return vscodeActiveTextEditor ? new TextEditor(vscodeActiveTextEditor) : undefined;
    }

    public getCursorIndex(): number {
        const activeTextEditor: interfaces.TextEditor = this.getActiveTextEditor();
        return activeTextEditor ? activeTextEditor.getCursorIndex() : undefined;
    }

    public setCursorIndex(cursorIndex: number): void {
        const activeTextEditor: interfaces.TextEditor = this.getActiveTextEditor();
        if (activeTextEditor) {
            activeTextEditor.setCursorIndex(cursorIndex);
        }
    }

    /**
     * Set the function to call when the active text editor in VSCode is changed.
     */
    public setActiveEditorChangedCallback(callback: (editor: interfaces.TextEditor) => void): interfaces.Disposable {
        return vscode.window.onDidChangeActiveTextEditor((vscodeTextEditor: vscode.TextEditor) => {
            callback(vscodeTextEditor ? new TextEditor(vscodeTextEditor) : undefined);
        });
    }

    /**
     * Set the function to call when the VS Code application's configuration is changed and saved.
     */
    public setConfigurationChangedCallback(callback: () => void): interfaces.Disposable {
        return vscode.workspace.onDidChangeConfiguration(callback);
    }

    /**
     * Set the function to call when a text document is opened.
     */
    public setTextDocumentOpenedCallback(callback: (openedTextDocument: interfaces.TextDocument) => void): interfaces.Disposable {
        return vscode.workspace.onDidOpenTextDocument((vscodeTextDocument: vscode.TextDocument) => {
            callback(vscodeTextDocument ? new TextDocument(vscodeTextDocument) : undefined);
        });
    }

    /**
     * Set the function to call when a text document is saved.
     */
    public setTextDocumentSavedCallback(callback: (savedTextDocument: interfaces.TextDocument) => void): interfaces.Disposable {
        return vscode.workspace.onDidSaveTextDocument((vscodeTextDocument: vscode.TextDocument) => {
            callback(vscodeTextDocument ? new TextDocument(vscodeTextDocument) : undefined);
        });
    }

    /**
     * Set the function to call when a text document is changed.
     */
    public setTextDocumentChangedCallback(callback: (textDocumentChange: interfaces.TextDocumentChange) => void): interfaces.Disposable {
        return vscode.workspace.onDidChangeTextDocument((changeEvent: vscode.TextDocumentChangeEvent) => {
            const textEditor = new TextEditor(vscode.window.activeTextEditor);
            const textDocument = new TextDocument(changeEvent.document);
            for (const contentChange of changeEvent.contentChanges) {
                callback(new interfaces.TextDocumentChange(textEditor, textDocument.toSpan(contentChange.range), contentChange.text));
            }
        });
    }

    /**
     * Set the function to call when a text document is closed.
     */
    public setTextDocumentClosedCallback(callback: (closedTextDocument: interfaces.TextDocument) => void): vscode.Disposable {
        return vscode.workspace.onDidCloseTextDocument((closedTextDocument: vscode.TextDocument) => {
            callback(new TextDocument(closedTextDocument));
        });
    }

    /**
     * Set the function to call when the cursor hovers over a text document with the provided
     * language identifier.
     */
    public setProvideHoverCallback(languageId: string, callback: (textDocument: interfaces.TextDocument, index: number) => interfaces.Hover): vscode.Disposable {
        return vscode.languages.registerHoverProvider(languageId, {
            provideHover(textDocument: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.Hover {
                const document = new TextDocument(textDocument);
                const hover: interfaces.Hover = callback(document, textDocument.offsetAt(position));
                return hover ? new vscode.Hover(hover.textLines, document.toRange(hover.span)) : undefined;
            }
        });
    }

    /**
     * Set the function to call when one of the completion trigger characters is pressed on a text
     * document with provided language identifier.
     */
    public setProvideCompletionsCallback(languageId: string, completionTriggerCharacters: string[], callback: (textDocument: interfaces.TextDocument, index: number) => qub.Iterable<interfaces.Completion>): interfaces.Disposable {
        const completionItemProvider: vscode.CompletionItemProvider = {
            provideCompletionItems(textDocument: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.CompletionList {
                const document = new TextDocument(textDocument);
                const index: number = textDocument.offsetAt(position);

                const completions: qub.Iterable<interfaces.Completion> = callback(document, index);

                let completionList: vscode.CompletionList;
                if (completions && completions.any()) {
                    const wordRange: vscode.Range = textDocument.getWordRangeAtPosition(position);
                    const currentWord: string = wordRange && textDocument.getText(wordRange.with(void 0, position));

                    completionList = new vscode.CompletionList(completions.map((completion: interfaces.Completion) => {
                        const insertRange: vscode.Range = document.toRange(completion.span);

                        const vscodeCompletion = new vscode.CompletionItem(completion.label);
                        vscodeCompletion.textEdit = new vscode.TextEdit(insertRange, completion.label);
                        vscodeCompletion.filterText = currentWord;
                        vscodeCompletion.documentation = completion.description;
                        vscodeCompletion.kind = vscode.CompletionItemKind.Property;
                        return vscodeCompletion;
                    }).toArray());
                }

                return completionList;
            },

            resolveCompletionItem(item: vscode.CompletionItem, token: vscode.CancellationToken): vscode.CompletionItem {
                return null;
            }
        };
        return vscode.languages.registerCompletionItemProvider(languageId, completionItemProvider, ...completionTriggerCharacters);
    }

    public setProvideFormattedDocumentTextCallback(languageId: string, callback: (textDocument: interfaces.TextDocument) => string): interfaces.Disposable {
        const documentFormattingEditProvider: vscode.DocumentFormattingEditProvider = {
            provideDocumentFormattingEdits(textDocument: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.TextEdit[] {
                const document = new TextDocument(textDocument);
                const formattedDocumentText: string = callback(document);

                const formattingEdits: vscode.TextEdit[] = [];
                if (qub.isDefined(formattedDocumentText)) {
                    const documentRange: vscode.Range = new vscode.Range(new vscode.Position(0, 0), textDocument.positionAt(textDocument.getText().length));
                    formattingEdits.push(vscode.TextEdit.replace(documentRange, formattedDocumentText));
                }

                return formattingEdits;
            }
        };
        return vscode.languages.registerDocumentFormattingEditProvider(languageId, documentFormattingEditProvider);
    }

    public setTextDocumentIssues(extensionName: string, textDocument: interfaces.TextDocument, issues: qub.Iterable<qub.Issue>): void {
        if (!this._diagnosticCollection) {
            this._diagnosticCollection = vscode.languages.createDiagnosticCollection(extensionName);
        }

        const vscodeTextDocument: TextDocument = textDocument as TextDocument;
        const diagnostics: vscode.Diagnostic[] = issues.map((issue: qub.Issue) => new vscode.Diagnostic(vscodeTextDocument.toRange(issue.span), issue.message, vscode.DiagnosticSeverity.Error)).toArray();
        this._diagnosticCollection.set(vscode.Uri.parse(textDocument.getURI()), diagnostics);
    }

    /**
     * Get the VSCode configuration file's contents.
     */
    public getConfiguration(): interfaces.Configuration {
        return new Configuration(vscode.workspace.getConfiguration());
    }

    /**
     * Get whether an extension with the provided name is installed.
     */
    public isExtensionInstalled(publisher: string, extensionName: string): boolean {
        return vscode.extensions.getExtension(`${publisher}.${extensionName}`) ? true : false;
    }

    /**
     * Get the locale that VSCode is being used in.
     */
    public getLocale(): string {
        return vscode.env.language;
    }

    /**
     * Get the unique identifier that defines the computer that VS Code is being used on.
     */
    public getMachineId(): string {
        return vscode.env.machineId;
    }

    /**
     * Get the unique identifier for this session of VS Code.
     */
    public getSessionId(): string {
        return vscode.env.sessionId;
    }

    public getOperatingSystem(): string {
        return os.platform();
    }

    /**
     * Write the provided message to the console.
     */
    public consoleLog(message: string): void {
        console.log(message);
    }
}