/**
 * JSON Repair Library
 * Intelligently repairs malformed JSON strings
 */

export interface RepairOptions {
    /** Maximum number of repair attempts before giving up */
    maxAttempts?: number;
    /** Whether to attempt trailing comma removal */
    removeTrailingCommas?: boolean;
    /** Whether to fix unquoted keys */
    fixUnquotedKeys?: boolean;
    /** Whether to fix single quotes to double quotes */
    fixSingleQuotes?: boolean;
    /** Whether to attempt bracket/brace balancing */
    balanceBrackets?: boolean;
    /** Whether to fix escaped quotes */
    fixEscapedQuotes?: boolean;
}

export interface RepairResult {
    /** The repaired JSON string */
    repaired: string;
    /** Whether the repair was successful */
    success: boolean;
    /** List of repairs that were applied */
    repairs: string[];
    /** Original error if repair failed */
    error?: Error;
}

export class JSONRepair {
    private options: Required<RepairOptions>;

    constructor(options: RepairOptions = {}) {
        this.options = {
            maxAttempts: options.maxAttempts ?? 10,
            removeTrailingCommas: options.removeTrailingCommas ?? true,
            fixUnquotedKeys: options.fixUnquotedKeys ?? true,
            fixSingleQuotes: options.fixSingleQuotes ?? true,
            balanceBrackets: options.balanceBrackets ?? true,
            fixEscapedQuotes: options.fixEscapedQuotes ?? true,
        };
    }

    /**
     * Attempt to repair a malformed JSON object
     */
    repair(jsonObject: any): RepairResult {
        const repairs: string[] = [];
        let current = this.objectToString(jsonObject);
        let attempts = 0;

        while (attempts < this.options.maxAttempts) {
            try {
                JSON.parse(current);
                return {
                    repaired: current,
                    success: true,
                    repairs,
                };
            } catch (error) {
                const repairResult = this.attemptRepair(current, error as Error);
                if (repairResult.modified) {
                    current = repairResult.result;
                    repairs.push(repairResult.repair);
                    attempts++;
                } else {
                    return {
                        repaired: current,
                        success: false,
                        repairs,
                        error: error as Error,
                    };
                }
            }
        }

        return {
            repaired: current,
            success: false,
            repairs,
            error: new Error(`Max repair attempts (${this.options.maxAttempts}) exceeded`),
        };
    }

    private objectToString(obj: any): string {
        if (typeof obj === 'string') {
            // If it's already a string, assume it's a malformed JSON string
            return obj.trim();
        }

        try {
            // Try to stringify the object first
            return JSON.stringify(obj);
        } catch (error) {
            // If stringification fails, convert to a string representation
            return this.convertToJsonString(obj);
        }
    }

    private convertToJsonString(obj: any): string {
        if (obj === null) return 'null';
        if (obj === undefined) return 'null';
        if (typeof obj === 'boolean') return obj.toString();
        if (typeof obj === 'number') return obj.toString();
        if (typeof obj === 'string') return `"${obj}"`;

        if (Array.isArray(obj)) {
            const items = obj.map((item) => this.convertToJsonString(item));
            return `[${items.join(', ')}]`;
        }

        if (typeof obj === 'object') {
            const pairs: string[] = [];
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const value = this.convertToJsonString(obj[key]);
                    pairs.push(`"${key}": ${value}`);
                }
            }
            return `{${pairs.join(', ')}}`;
        }

        return '{}';
    }

    private attemptRepair(
        jsonString: string,
        error: Error
    ): {
        result: string;
        modified: boolean;
        repair: string;
    } {
        const errorMessage = error.message.toLowerCase();

        // Try different repair strategies based on the error
        if (errorMessage.includes('trailing comma') && this.options.removeTrailingCommas) {
            return this.removeTrailingCommas(jsonString);
        }

        if (errorMessage.includes('unterminated string') || errorMessage.includes('unterminated')) {
            return this.fixUnterminatedStrings(jsonString);
        }

        if (
            errorMessage.includes('unexpected token') ||
            errorMessage.includes('unexpected character')
        ) {
            // Try multiple strategies for unexpected tokens
            const strategies = [
                () => this.fixUnquotedKeys(jsonString),
                () => this.fixSingleQuotes(jsonString),
                () => this.fixMissingCommas(jsonString),
                () => this.fixEscapedQuotes(jsonString),
                () => this.removeInvalidCharacters(jsonString),
            ];

            for (const strategy of strategies) {
                const result = strategy();
                if (result.modified) return result;
            }
        }

        if (errorMessage.includes('unexpected end')) {
            return this.balanceBrackets(jsonString);
        }

        // Fallback: try to fix common issues
        return this.applyGeneralFixes(jsonString);
    }

    private fixUnterminatedStrings(jsonString: string) {
        const original = jsonString;
        let fixed = jsonString;

        // Find unterminated strings by looking for unmatched quotes
        const lines = fixed.split('\n');
        const repairedLines: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            let inString = false;
            let escaped = false;
            let lastQuoteIndex = -1;
            let needsClosingQuote = false;

            // Scan through each character to find unterminated strings
            for (let j = 0; j < line.length; j++) {
                const char = line[j];

                if (escaped) {
                    escaped = false;
                    continue;
                }

                if (char === '\\') {
                    escaped = true;
                    continue;
                }

                if (char === '"') {
                    if (inString) {
                        inString = false;
                        lastQuoteIndex = -1;
                    } else {
                        inString = true;
                        lastQuoteIndex = j;
                    }
                }
            }

            // If we're still in a string at the end of the line, it's unterminated
            if (inString && lastQuoteIndex !== -1) {
                // Look ahead to see if the string continues on the next line
                const nextLineStartsWithValue =
                    i + 1 < lines.length && /^\s*[},\]]/.test(lines[i + 1]);

                if (nextLineStartsWithValue || i === lines.length - 1) {
                    // Add closing quote before any trailing comma, brace, or bracket
                    line = line.replace(/(\s*[},\]]\s*)$/, '"$1') || line + '"';
                    needsClosingQuote = true;
                }
            }

            repairedLines.push(line);
        }

        fixed = repairedLines.join('\n');

        // Alternative approach: Look for common patterns of unterminated strings
        if (fixed === original) {
            // Find strings that end with a newline or special character without closing quote
            fixed = fixed.replace(/("([^"\\]|\\.)*)\n/g, '$1"\n');
            fixed = fixed.replace(/("([^"\\]|\\.)*)\s*([},\]])/g, '$1"$3');

            // Handle end-of-input unterminated strings
            fixed = fixed.replace(/("([^"\\]|\\.)*)$/g, '$1"');
        }

        return {
            result: fixed,
            modified: fixed !== original,
            repair: 'Fixed unterminated strings by adding missing quotes',
        };
    }

    private removeTrailingCommas(jsonString: string) {
        const original = jsonString;
        // Remove trailing commas before closing brackets/braces
        const fixed = jsonString.replace(/,(\s*[}\]])/g, '$1');

        return {
            result: fixed,
            modified: fixed !== original,
            repair: 'Removed trailing commas',
        };
    }

    private fixUnquotedKeys(jsonString: string) {
        if (!this.options.fixUnquotedKeys) {
            return { result: jsonString, modified: false, repair: '' };
        }

        const original = jsonString;
        let fixed = jsonString;

        // Add quotes around unquoted object keys at the start of the object
        fixed = fixed.replace(/{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '{"$1":');

        // Add quotes around unquoted object keys after commas
        fixed = fixed.replace(/,\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, ', "$1":');

        // Handle nested objects
        fixed = fixed.replace(/:\s*{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, ': {"$1":');

        return {
            result: fixed,
            modified: fixed !== original,
            repair: 'Added quotes around unquoted object keys',
        };
    }

    private fixSingleQuotes(jsonString: string) {
        if (!this.options.fixSingleQuotes) {
            return { result: jsonString, modified: false, repair: '' };
        }

        const original = jsonString;
        // Replace single quotes with double quotes, being careful about escaped quotes
        let fixed = jsonString.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"');
        // Fix escaped single quotes within the content
        fixed = fixed.replace(/\\'/g, "'");

        return {
            result: fixed,
            modified: fixed !== original,
            repair: 'Converted single quotes to double quotes',
        };
    }

    private fixMissingCommas(jsonString: string) {
        const original = jsonString;
        let fixed = jsonString;

        // Add missing commas between object properties
        fixed = fixed.replace(/(":\s*"[^"]*")\s+"/g, '$1, "');
        fixed = fixed.replace(/(":\s*\d+)\s+"/g, '$1, "');
        fixed = fixed.replace(/(":\s*(?:true|false|null))\s+"/g, '$1, "');
        fixed = fixed.replace(/(":\s*\{[^}]*\})\s+"/g, '$1, "');
        fixed = fixed.replace(/(":\s*\[[^\]]*\])\s+"/g, '$1, "');

        // Handle unquoted keys followed by other properties
        fixed = fixed.replace(
            /([a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*"[^"]*")\s+([a-zA-Z_$][a-zA-Z0-9_$]*\s*:)/g,
            '$1, $2'
        );
        fixed = fixed.replace(
            /([a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*\d+)\s+([a-zA-Z_$][a-zA-Z0-9_$]*\s*:)/g,
            '$1, $2'
        );
        fixed = fixed.replace(
            /([a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*(?:true|false|null))\s+([a-zA-Z_$][a-zA-Z0-9_$]*\s*:)/g,
            '$1, $2'
        );

        return {
            result: fixed,
            modified: fixed !== original,
            repair: 'Added missing commas between object properties',
        };
    }

    private fixEscapedQuotes(jsonString: string) {
        if (!this.options.fixEscapedQuotes) {
            return { result: jsonString, modified: false, repair: '' };
        }

        const original = jsonString;
        // Fix improperly escaped quotes
        let fixed = jsonString.replace(/\\"/g, '"');
        // Re-escape quotes that should be escaped (inside string values)
        fixed = fixed.replace(/"([^"]*)"([^"]*)"([^"]*)"/g, (match, p1, p2, p3) => {
            if (p2.includes(':') || p2.includes(',')) {
                return match; // This looks like it spans multiple JSON elements, leave it
            }
            return `"${p1}\\"${p2}\\"${p3}"`;
        });

        return {
            result: fixed,
            modified: fixed !== original,
            repair: 'Fixed escaped quotes',
        };
    }

    private removeInvalidCharacters(jsonString: string) {
        const original = jsonString;
        // Remove common invalid characters
        let fixed = jsonString.replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
        fixed = fixed.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas again

        return {
            result: fixed,
            modified: fixed !== original,
            repair: 'Removed invalid characters',
        };
    }

    private balanceBrackets(jsonString: string) {
        if (!this.options.balanceBrackets) {
            return { result: jsonString, modified: false, repair: '' };
        }

        const original = jsonString;
        let fixed = jsonString;

        // Count braces and brackets (focusing on object structure)
        const openBraces = (fixed.match(/{/g) || []).length;
        const closeBraces = (fixed.match(/}/g) || []).length;
        const openBrackets = (fixed.match(/\[/g) || []).length;
        const closeBrackets = (fixed.match(/]/g) || []).length;

        // Add missing closing braces for the main object
        if (openBraces > closeBraces) {
            fixed += '}'.repeat(openBraces - closeBraces);
        }

        // Add missing closing brackets for arrays within the object
        if (openBrackets > closeBrackets) {
            fixed += ']'.repeat(openBrackets - closeBrackets);
        }

        // Remove extra closing braces/brackets from the end
        if (closeBraces > openBraces) {
            const extraBraces = closeBraces - openBraces;
            for (let i = 0; i < extraBraces; i++) {
                fixed = fixed.replace(/}\s*$/, '');
            }
        }

        if (closeBrackets > openBrackets) {
            const extraBrackets = closeBrackets - openBrackets;
            for (let i = 0; i < extraBrackets; i++) {
                fixed = fixed.replace(/]\s*$/, '');
            }
        }

        return {
            result: fixed,
            modified: fixed !== original,
            repair: 'Balanced braces and brackets for object structure',
        };
    }

    private applyGeneralFixes(jsonString: string) {
        const original = jsonString;
        let fixed = jsonString;

        // Fix common whitespace issues
        fixed = fixed.trim();

        // Ensure the JSON starts and ends with proper object braces (assuming object input)
        if (!fixed.startsWith('{')) {
            fixed = '{' + fixed;
        }
        if (!fixed.endsWith('}')) {
            fixed = fixed + '}';
        }

        return {
            result: fixed,
            modified: fixed !== original,
            repair: 'Applied general fixes (ensured object structure)',
        };
    }
}

// Convenience function for quick repairs
export function repairJSON(jsonObject: any, options?: RepairOptions): RepairResult {
    const repairer = new JSONRepair(options);
    return repairer.repair(jsonObject);
}

// Export commonly used types
export type { RepairOptions, RepairResult };

// Example usage:
/*
const malformedObject = {
  name: 'John Doe',
  age: 30,
  hobbies: ['reading', 'coding'],
  address: {
    street: "123 Main St",
    city: 'New York'
  },
  isActive: true,
  // This object might have issues when stringified or parsed
};

// Or a malformed JSON string representing an object
const malformedJSONString = `{
  name: 'John Doe',
  age: 30,
  hobbies: ['reading', 'coding',],
  address: {
    street: "123 Main St",
    city: 'New York'
  },
  isActive: true
}`;

const result1 = repairJSON(malformedObject);
const result2 = repairJSON(malformedJSONString);

if (result1.success) {
  console.log('Repaired JSON:', result1.repaired);
  console.log('Applied repairs:', result1.repairs);
  const parsed = JSON.parse(result1.repaired);
  console.log('Parsed object:', parsed);
} else {
  console.error('Failed to repair JSON:', result1.error);
}
*/
