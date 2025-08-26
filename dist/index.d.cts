interface RuleMetadata {
    id: string;
    alwaysApply?: boolean;
    scope?: string | string[];
    triggers?: string[];
    manual?: boolean;
    priority?: 'high' | 'medium' | 'low';
    description?: string;
    globs?: string[];
    private?: boolean;
    [key: string]: unknown;
}
interface RuleBlock {
    metadata: RuleMetadata;
    content: string;
    position?: {
        start: {
            line: number;
            column: number;
        };
        end: {
            line: number;
            column: number;
        };
    };
}
interface ImportResult {
    format: 'agent' | 'copilot' | 'cursor' | 'cline' | 'windsurf' | 'zed' | 'codex' | 'aider' | 'claude' | 'qodo' | 'gemini' | 'amazonq' | 'unknown';
    filePath: string;
    rules: RuleBlock[];
    raw?: string;
}
interface ImportResults {
    results: ImportResult[];
    errors: Array<{
        file: string;
        error: string;
    }>;
}
interface ExportOptions {
    format?: 'agent' | 'copilot' | 'cursor' | 'cline' | 'windsurf' | 'zed' | 'codex' | 'aider' | 'claude' | 'qodo' | 'gemini' | 'amazonq';
    outputPath?: string;
    overwrite?: boolean;
    includePrivate?: boolean;
    skipPrivate?: boolean;
}
interface ParserOptions {
    strict?: boolean;
    preserveWhitespace?: boolean;
}

/**
 * @deprecated Use importAgent() instead. Single-file .agentconfig format is deprecated.
 */
declare function parseAgentMarkdown(markdown: string, options?: ParserOptions): RuleBlock[];
declare function parseFenceEncodedMarkdown(markdown: string, options?: ParserOptions): RuleBlock[];

declare function importAll(repoPath: string): Promise<ImportResults>;
declare function importCopilot(filePath: string): ImportResult;
declare function importAgent(agentDir: string): ImportResult;
declare function importCursor(cursorDir: string): ImportResult;
declare function importCursorLegacy(filePath: string): ImportResult;
declare function importCline(rulesPath: string): ImportResult;
declare function importWindsurf(filePath: string): ImportResult;
declare function importZed(filePath: string): ImportResult;
declare function importCodex(filePath: string): ImportResult;
declare function importAider(filePath: string): ImportResult;
declare function importClaudeCode(filePath: string): ImportResult;
declare function importGemini(filePath: string): ImportResult;
declare function importQodo(filePath: string): ImportResult;
declare function importAmazonQ(rulesDir: string): ImportResult;

/**
 * @deprecated Use exportToAgent() instead. Single-file .agentconfig format is deprecated.
 */
declare function toAgentMarkdown(rules: RuleBlock[]): string;
declare function exportToCopilot(rules: RuleBlock[], outputPath: string, options?: ExportOptions): void;
declare function exportToAgent(rules: RuleBlock[], outputDir: string, options?: ExportOptions): void;
declare function exportToCursor(rules: RuleBlock[], outputDir: string, options?: ExportOptions): void;
declare function exportToCline(rules: RuleBlock[], outputPath: string, options?: ExportOptions): void;
declare function exportToWindsurf(rules: RuleBlock[], outputPath: string, options?: ExportOptions): void;
declare function exportToZed(rules: RuleBlock[], outputPath: string, options?: ExportOptions): void;
declare function exportToCodex(rules: RuleBlock[], outputPath: string, options?: ExportOptions): void;
declare function exportToAider(rules: RuleBlock[], outputPath: string, options?: ExportOptions): void;
declare function exportToClaudeCode(rules: RuleBlock[], outputPath: string, options?: ExportOptions): void;
declare function exportToGemini(rules: RuleBlock[], outputPath: string, options?: ExportOptions): void;
declare function exportToQodo(rules: RuleBlock[], outputPath: string, options?: ExportOptions): void;
declare function exportToAmazonQ(rules: RuleBlock[], outputDir: string, options?: ExportOptions): void;
declare function exportAll(rules: RuleBlock[], repoPath: string, dryRun?: boolean, options?: ExportOptions): void;

export { type ExportOptions, type ImportResult, type ImportResults, type ParserOptions, type RuleBlock, type RuleMetadata, exportAll, exportToAgent, exportToAider, exportToAmazonQ, exportToClaudeCode, exportToCline, exportToCodex, exportToCopilot, exportToCursor, exportToGemini, exportToQodo, exportToWindsurf, exportToZed, importAgent, importAider, importAll, importAmazonQ, importClaudeCode, importCline, importCodex, importCopilot, importCursor, importCursorLegacy, importGemini, importQodo, importWindsurf, importZed, parseAgentMarkdown, parseFenceEncodedMarkdown, toAgentMarkdown };
