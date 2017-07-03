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