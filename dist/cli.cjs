#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/tsup@8.5.0_postcss@8.5.6_typescript@5.8.3/node_modules/tsup/assets/cjs_shims.js
var init_cjs_shims = __esm({
  "node_modules/.pnpm/tsup@8.5.0_postcss@8.5.6_typescript@5.8.3/node_modules/tsup/assets/cjs_shims.js"() {
    "use strict";
  }
});

// src/yaml-parser.ts
function createSafeYamlParser() {
  return {
    parse: (str) => {
      const processedStr = str.replace(
        /^(\s*\w+:\s*)(\*[^\n\r"']*?)(\s*(?:\r?\n|$))/gm,
        (match, prefix, value, suffix) => {
          if (value.startsWith('"') || value.startsWith("'")) {
            return match;
          }
          return `${prefix}"${value}"${suffix}`;
        }
      );
      const fullyProcessedStr = processedStr.replace(
        /^(\s*-\s+)(\*[^\n\r"']*?)(\s*(?:\r?\n|$))/gm,
        (match, prefix, value, suffix) => {
          if (value.startsWith('"') || value.startsWith("'")) {
            return match;
          }
          return `${prefix}"${value}"${suffix}`;
        }
      );
      try {
        return import_js_yaml2.default.load(fullyProcessedStr);
      } catch (error) {
        return import_js_yaml2.default.load(str);
      }
    },
    stringify: (data) => {
      const yamlOutput = import_js_yaml2.default.dump(data);
      const lines = yamlOutput.split(/\r?\n/);
      const out = [];
      let inGlobsArray = false;
      let globsIndent = "";
      const containsGlob = (s) => s.includes("*");
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const globsMatch = line.match(/^(\s*)globs:\s*(.*)$/);
        if (globsMatch) {
          globsIndent = globsMatch[1];
          const value = globsMatch[2];
          if (value === "") {
            inGlobsArray = true;
            out.push(line);
            continue;
          }
          const scalar = value.match(/^(['"])(.+)\1(\s*(?:#.*)?)$/);
          if (scalar && containsGlob(scalar[2])) {
            line = `${globsIndent}globs: ${scalar[2]}${scalar[3] ?? ""}`;
          }
          out.push(line);
          continue;
        }
        if (inGlobsArray) {
          if (!line.startsWith(globsIndent + "  ")) {
            inGlobsArray = false;
            i--;
            continue;
          }
          const item = line.match(/^(\s*-\s*)(['"])(.+)\2(\s*(?:#.*)?)$/);
          if (item && containsGlob(item[3])) {
            line = `${item[1]}${item[3]}${item[4] ?? ""}`;
          }
          out.push(line);
          continue;
        }
        out.push(line);
      }
      return out.join("\n");
    }
  };
}
var import_js_yaml2, grayMatterOptions;
var init_yaml_parser = __esm({
  "src/yaml-parser.ts"() {
    "use strict";
    init_cjs_shims();
    import_js_yaml2 = __toESM(require("js-yaml"), 1);
    grayMatterOptions = {
      engines: {
        yaml: createSafeYamlParser()
      }
    };
  }
});

// src/importers.ts
var importers_exports = {};
__export(importers_exports, {
  importAgent: () => importAgent,
  importAider: () => importAider,
  importAll: () => importAll,
  importAmazonQ: () => importAmazonQ,
  importClaudeCode: () => importClaudeCode,
  importCline: () => importCline,
  importCodex: () => importCodex,
  importCopilot: () => importCopilot,
  importCursor: () => importCursor,
  importCursorLegacy: () => importCursorLegacy,
  importGemini: () => importGemini,
  importQodo: () => importQodo,
  importWindsurf: () => importWindsurf,
  importZed: () => importZed
});
function isPrivateRule(filePath) {
  const lowerPath = filePath.toLowerCase();
  return lowerPath.includes(".local.") || lowerPath.includes("/private/") || lowerPath.includes("\\private\\");
}
async function importAll(repoPath) {
  const results = [];
  const errors = [];
  const agentDir = (0, import_path.join)(repoPath, ".agent");
  if ((0, import_fs.existsSync)(agentDir)) {
    try {
      results.push(importAgent(agentDir));
    } catch (e) {
      errors.push({ file: agentDir, error: String(e) });
    }
  }
  const copilotPath = (0, import_path.join)(repoPath, ".github", "copilot-instructions.md");
  if ((0, import_fs.existsSync)(copilotPath)) {
    try {
      results.push(importCopilot(copilotPath));
    } catch (e) {
      errors.push({ file: copilotPath, error: String(e) });
    }
  }
  const copilotLocalPath = (0, import_path.join)(repoPath, ".github", "copilot-instructions.local.md");
  if ((0, import_fs.existsSync)(copilotLocalPath)) {
    try {
      results.push(importCopilot(copilotLocalPath));
    } catch (e) {
      errors.push({ file: copilotLocalPath, error: String(e) });
    }
  }
  const cursorDir = (0, import_path.join)(repoPath, ".cursor");
  if ((0, import_fs.existsSync)(cursorDir)) {
    try {
      results.push(importCursor(cursorDir));
    } catch (e) {
      errors.push({ file: cursorDir, error: String(e) });
    }
  }
  const cursorRulesFile = (0, import_path.join)(repoPath, ".cursorrules");
  if ((0, import_fs.existsSync)(cursorRulesFile)) {
    try {
      results.push(importCursorLegacy(cursorRulesFile));
    } catch (e) {
      errors.push({ file: cursorRulesFile, error: String(e) });
    }
  }
  const clinerules = (0, import_path.join)(repoPath, ".clinerules");
  if ((0, import_fs.existsSync)(clinerules)) {
    try {
      results.push(importCline(clinerules));
    } catch (e) {
      errors.push({ file: clinerules, error: String(e) });
    }
  }
  const clinerulesLocal = (0, import_path.join)(repoPath, ".clinerules.local");
  if ((0, import_fs.existsSync)(clinerulesLocal)) {
    try {
      results.push(importCline(clinerulesLocal));
    } catch (e) {
      errors.push({ file: clinerulesLocal, error: String(e) });
    }
  }
  const windsurfRules = (0, import_path.join)(repoPath, ".windsurfrules");
  if ((0, import_fs.existsSync)(windsurfRules)) {
    try {
      results.push(importWindsurf(windsurfRules));
    } catch (e) {
      errors.push({ file: windsurfRules, error: String(e) });
    }
  }
  const windsurfRulesLocal = (0, import_path.join)(repoPath, ".windsurfrules.local");
  if ((0, import_fs.existsSync)(windsurfRulesLocal)) {
    try {
      results.push(importWindsurf(windsurfRulesLocal));
    } catch (e) {
      errors.push({ file: windsurfRulesLocal, error: String(e) });
    }
  }
  const zedRules = (0, import_path.join)(repoPath, ".rules");
  if ((0, import_fs.existsSync)(zedRules)) {
    try {
      results.push(importZed(zedRules));
    } catch (e) {
      errors.push({ file: zedRules, error: String(e) });
    }
  }
  const zedRulesLocal = (0, import_path.join)(repoPath, ".rules.local");
  if ((0, import_fs.existsSync)(zedRulesLocal)) {
    try {
      results.push(importZed(zedRulesLocal));
    } catch (e) {
      errors.push({ file: zedRulesLocal, error: String(e) });
    }
  }
  const agentsMd = (0, import_path.join)(repoPath, "AGENTS.md");
  if ((0, import_fs.existsSync)(agentsMd)) {
    try {
      results.push(importCodex(agentsMd));
    } catch (e) {
      errors.push({ file: agentsMd, error: String(e) });
    }
  }
  const agentsLocalMd = (0, import_path.join)(repoPath, "AGENTS.local.md");
  if ((0, import_fs.existsSync)(agentsLocalMd)) {
    try {
      results.push(importCodex(agentsLocalMd));
    } catch (e) {
      errors.push({ file: agentsLocalMd, error: String(e) });
    }
  }
  const claudeMd = (0, import_path.join)(repoPath, "CLAUDE.md");
  if ((0, import_fs.existsSync)(claudeMd)) {
    try {
      results.push(importClaudeCode(claudeMd));
    } catch (e) {
      errors.push({ file: claudeMd, error: String(e) });
    }
  }
  const geminiMd = (0, import_path.join)(repoPath, "GEMINI.md");
  if ((0, import_fs.existsSync)(geminiMd)) {
    try {
      results.push(importGemini(geminiMd));
    } catch (e) {
      errors.push({ file: geminiMd, error: String(e) });
    }
  }
  const bestPracticesMd = (0, import_path.join)(repoPath, "best_practices.md");
  if ((0, import_fs.existsSync)(bestPracticesMd)) {
    try {
      results.push(importQodo(bestPracticesMd));
    } catch (e) {
      errors.push({ file: bestPracticesMd, error: String(e) });
    }
  }
  const claudeLocalMd = (0, import_path.join)(repoPath, "CLAUDE.local.md");
  if ((0, import_fs.existsSync)(claudeLocalMd)) {
    try {
      results.push(importClaudeCode(claudeLocalMd));
    } catch (e) {
      errors.push({ file: claudeLocalMd, error: String(e) });
    }
  }
  const geminiLocalMd = (0, import_path.join)(repoPath, "GEMINI.local.md");
  if ((0, import_fs.existsSync)(geminiLocalMd)) {
    try {
      results.push(importGemini(geminiLocalMd));
    } catch (e) {
      errors.push({ file: geminiLocalMd, error: String(e) });
    }
  }
  const conventionsMd = (0, import_path.join)(repoPath, "CONVENTIONS.md");
  if ((0, import_fs.existsSync)(conventionsMd)) {
    try {
      results.push(importAider(conventionsMd));
    } catch (e) {
      errors.push({ file: conventionsMd, error: String(e) });
    }
  }
  const conventionsLocalMd = (0, import_path.join)(repoPath, "CONVENTIONS.local.md");
  if ((0, import_fs.existsSync)(conventionsLocalMd)) {
    try {
      results.push(importAider(conventionsLocalMd));
    } catch (e) {
      errors.push({ file: conventionsLocalMd, error: String(e) });
    }
  }
  const amazonqRulesDir = (0, import_path.join)(repoPath, ".amazonq", "rules");
  if ((0, import_fs.existsSync)(amazonqRulesDir)) {
    try {
      results.push(importAmazonQ(amazonqRulesDir));
    } catch (e) {
      errors.push({ file: amazonqRulesDir, error: String(e) });
    }
  }
  return { results, errors };
}
function importCopilot(filePath) {
  const content = (0, import_fs.readFileSync)(filePath, "utf-8");
  const isPrivate = isPrivateRule(filePath);
  const metadata = {
    id: "copilot-instructions",
    alwaysApply: true,
    description: "GitHub Copilot custom instructions"
  };
  if (isPrivate) {
    metadata.private = true;
  }
  const rules = [{
    metadata,
    content: content.trim()
  }];
  return {
    format: "copilot",
    filePath,
    rules,
    raw: content
  };
}
function importAgent(agentDir) {
  const rules = [];
  function findMarkdownFiles(dir, relativePath = "") {
    const entries = (0, import_fs.readdirSync)(dir, { withFileTypes: true });
    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const entry of entries) {
      const fullPath = (0, import_path.join)(dir, entry.name);
      const relPath = relativePath ? (0, import_path.join)(relativePath, entry.name) : entry.name;
      if (entry.isDirectory()) {
        findMarkdownFiles(fullPath, relPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const content = (0, import_fs.readFileSync)(fullPath, "utf-8");
        const { data, content: body } = (0, import_gray_matter.default)(content, grayMatterOptions);
        let segments = relPath.replace(/\.md$/, "").replace(/\\/g, "/").split("/").map((s) => s.replace(/^\d{2,}-/, "").replace(/\.local$/, ""));
        if (segments[0] === "private") segments = segments.slice(1);
        const defaultId = segments.join("/");
        const isPrivateFile = isPrivateRule(fullPath);
        const metadata = {
          id: data.id || defaultId,
          ...data
        };
        if (metadata.alwaysApply === void 0) {
          metadata.alwaysApply = false;
        }
        if (data.private === true || data.private === void 0 && isPrivateFile) {
          metadata.private = true;
        }
        rules.push({
          metadata,
          content: body.trim()
        });
      }
    }
  }
  findMarkdownFiles(agentDir);
  return {
    format: "agent",
    filePath: agentDir,
    rules
  };
}
function importCursor(cursorDir) {
  const rules = [];
  function findCursorFiles(dir, relativePath = "") {
    const entries = (0, import_fs.readdirSync)(dir, { withFileTypes: true });
    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const entry of entries) {
      const fullPath = (0, import_path.join)(dir, entry.name);
      const relPath = relativePath ? (0, import_path.join)(relativePath, entry.name) : entry.name;
      if (entry.isDirectory()) {
        findCursorFiles(fullPath, relPath);
      } else if (entry.isFile() && (entry.name.endsWith(".mdc") || entry.name.endsWith(".md"))) {
        const content = (0, import_fs.readFileSync)(fullPath, "utf-8");
        const { data, content: body } = (0, import_gray_matter.default)(content, grayMatterOptions);
        let segments = relPath.replace(/\.(mdc|md)$/, "").replace(/\\/g, "/").split("/").map((s) => s.replace(/^\d{2,}-/, "").replace(/\.local$/, ""));
        if (segments[0] === "private") segments = segments.slice(1);
        if (segments[0] === "rules" && segments.length === 2) segments = segments.slice(1);
        const defaultId = segments.join("/");
        const isPrivateFile = isPrivateRule(fullPath);
        const metadata = {
          id: data.id || defaultId,
          ...data
        };
        if (metadata.alwaysApply === void 0) {
          metadata.alwaysApply = false;
        }
        if (data.private === true || data.private === void 0 && isPrivateFile) {
          metadata.private = true;
        }
        rules.push({
          metadata,
          content: body.trim()
        });
      }
    }
  }
  findCursorFiles(cursorDir);
  return {
    format: "cursor",
    filePath: cursorDir,
    rules
  };
}
function importCursorLegacy(filePath) {
  const content = (0, import_fs.readFileSync)(filePath, "utf-8");
  const rules = [{
    metadata: {
      id: "cursor-rules-legacy",
      alwaysApply: true,
      description: "Legacy Cursor rules"
    },
    content: content.trim()
  }];
  return {
    format: "cursor",
    filePath,
    rules,
    raw: content
  };
}
function importCline(rulesPath) {
  const rules = [];
  if ((0, import_fs.existsSync)(rulesPath) && (0, import_fs.statSync)(rulesPath).isDirectory()) {
    let findMdFiles2 = function(dir, relativePath = "") {
      const entries = (0, import_fs.readdirSync)(dir, { withFileTypes: true });
      entries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });
      for (const entry of entries) {
        const fullPath = (0, import_path.join)(dir, entry.name);
        const relPath = relativePath ? (0, import_path.join)(relativePath, entry.name) : entry.name;
        if (entry.isDirectory()) {
          findMdFiles2(fullPath, relPath);
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          const content = (0, import_fs.readFileSync)(fullPath, "utf-8");
          const isPrivateFile = isPrivateRule(fullPath);
          let segments = relPath.replace(/\.md$/, "").replace(/\\/g, "/").split("/").map((s) => s.replace(/^\d{2,}-/, "").replace(/\.local$/, ""));
          if (segments[0] === "private") segments = segments.slice(1);
          const defaultId = segments.join("/");
          const metadata = {
            id: defaultId,
            alwaysApply: true,
            description: `Cline rules from ${relPath}`
          };
          if (isPrivateFile) {
            metadata.private = true;
          }
          rules.push({
            metadata,
            content: content.trim()
          });
        }
      }
    };
    var findMdFiles = findMdFiles2;
    findMdFiles2(rulesPath);
  } else {
    const content = (0, import_fs.readFileSync)(rulesPath, "utf-8");
    const isPrivateFile = isPrivateRule(rulesPath);
    const metadata = {
      id: "cline-rules",
      alwaysApply: true,
      description: "Cline project rules"
    };
    if (isPrivateFile) {
      metadata.private = true;
    }
    rules.push({
      metadata,
      content: content.trim()
    });
  }
  return {
    format: "cline",
    filePath: rulesPath,
    rules
  };
}
function importWindsurf(filePath) {
  const content = (0, import_fs.readFileSync)(filePath, "utf-8");
  const isPrivateFile = isPrivateRule(filePath);
  const metadata = {
    id: "windsurf-rules",
    alwaysApply: true,
    description: "Windsurf AI rules"
  };
  if (isPrivateFile) {
    metadata.private = true;
  }
  const rules = [{
    metadata,
    content: content.trim()
  }];
  return {
    format: "windsurf",
    filePath,
    rules,
    raw: content
  };
}
function importZed(filePath) {
  const content = (0, import_fs.readFileSync)(filePath, "utf-8");
  const isPrivateFile = isPrivateRule(filePath);
  const metadata = {
    id: "zed-rules",
    alwaysApply: true,
    description: "Zed editor rules"
  };
  if (isPrivateFile) {
    metadata.private = true;
  }
  const rules = [{
    metadata,
    content: content.trim()
  }];
  return {
    format: "zed",
    filePath,
    rules,
    raw: content
  };
}
function importCodex(filePath) {
  const content = (0, import_fs.readFileSync)(filePath, "utf-8");
  const format = (0, import_path.basename)(filePath) === "AGENTS.md" || (0, import_path.basename)(filePath) === "AGENTS.local.md" ? "codex" : "unknown";
  const isPrivateFile = isPrivateRule(filePath);
  const metadata = {
    id: format === "codex" ? "codex-agents" : "claude-rules",
    alwaysApply: true,
    description: format === "codex" ? "OpenAI Codex agent instructions" : "Claude AI instructions"
  };
  if (isPrivateFile) {
    metadata.private = true;
  }
  const rules = [{
    metadata,
    content: content.trim()
  }];
  return {
    format,
    filePath,
    rules,
    raw: content
  };
}
function importAider(filePath) {
  const content = (0, import_fs.readFileSync)(filePath, "utf-8");
  const isPrivateFile = isPrivateRule(filePath);
  const metadata = {
    id: "aider-conventions",
    alwaysApply: true,
    description: "Aider CLI conventions"
  };
  if (isPrivateFile) {
    metadata.private = true;
  }
  const rules = [{
    metadata,
    content: content.trim()
  }];
  return {
    format: "aider",
    filePath,
    rules,
    raw: content
  };
}
function importClaudeCode(filePath) {
  const content = (0, import_fs.readFileSync)(filePath, "utf-8");
  const isPrivateFile = isPrivateRule(filePath);
  const metadata = {
    id: "claude-code-instructions",
    alwaysApply: true,
    description: "Claude Code context and instructions"
  };
  if (isPrivateFile) {
    metadata.private = true;
  }
  const rules = [{
    metadata,
    content: content.trim()
  }];
  return {
    format: "claude",
    filePath,
    rules,
    raw: content
  };
}
function importGemini(filePath) {
  const content = (0, import_fs.readFileSync)(filePath, "utf-8");
  const isPrivateFile = isPrivateRule(filePath);
  const metadata = {
    id: "gemini-instructions",
    alwaysApply: true,
    description: "Gemini CLI context and instructions"
  };
  if (isPrivateFile) {
    metadata.private = true;
  }
  const rules = [{
    metadata,
    content: content.trim()
  }];
  return {
    format: "gemini",
    filePath,
    rules,
    raw: content
  };
}
function importQodo(filePath) {
  const content = (0, import_fs.readFileSync)(filePath, "utf-8");
  const rules = [{
    metadata: {
      id: "qodo-best-practices",
      alwaysApply: true,
      description: "Qodo best practices and coding standards",
      scope: "**/*",
      priority: "high"
    },
    content: content.trim()
  }];
  return {
    format: "qodo",
    filePath,
    rules,
    raw: content
  };
}
function importAmazonQ(rulesDir) {
  const rules = [];
  function findMdFiles(dir, relativePath = "") {
    const entries = (0, import_fs.readdirSync)(dir, { withFileTypes: true });
    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const entry of entries) {
      const fullPath = (0, import_path.join)(dir, entry.name);
      const relPath = relativePath ? (0, import_path.join)(relativePath, entry.name) : entry.name;
      if (entry.isDirectory()) {
        findMdFiles(fullPath, relPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const content = (0, import_fs.readFileSync)(fullPath, "utf-8");
        const isPrivateFile = isPrivateRule(fullPath);
        let segments = relPath.replace(/\.md$/, "").replace(/\\/g, "/").split("/").map((s) => s.replace(/^\d{2,}-/, "").replace(/\.local$/, ""));
        if (segments[0] === "private") segments = segments.slice(1);
        const defaultId = segments.join("/");
        const metadata = {
          id: `amazonq-${defaultId}`,
          alwaysApply: true,
          description: `Amazon Q rules from ${relPath}`
        };
        if (isPrivateFile) {
          metadata.private = true;
        }
        rules.push({
          metadata,
          content: content.trim()
        });
      }
    }
  }
  findMdFiles(rulesDir);
  return {
    format: "amazonq",
    filePath: rulesDir,
    rules
  };
}
var import_fs, import_path, import_gray_matter;
var init_importers = __esm({
  "src/importers.ts"() {
    "use strict";
    init_cjs_shims();
    import_fs = require("fs");
    import_path = require("path");
    import_gray_matter = __toESM(require("gray-matter"), 1);
    init_yaml_parser();
  }
});

// src/cli.ts
init_cjs_shims();
var import_fs3 = require("fs");
var import_path3 = require("path");
var import_util = require("util");

// src/index.ts
init_cjs_shims();

// src/parser.ts
init_cjs_shims();
var import_unified = require("unified");
var import_remark_parse = __toESM(require("remark-parse"), 1);
var import_mdast_util_to_markdown = require("mdast-util-to-markdown");
var import_js_yaml = __toESM(require("js-yaml"), 1);

// src/index.ts
init_importers();

// src/exporters.ts
init_cjs_shims();
var import_fs2 = require("fs");
var import_path2 = require("path");
var import_js_yaml3 = __toESM(require("js-yaml"), 1);
var import_gray_matter2 = __toESM(require("gray-matter"), 1);
init_yaml_parser();
function generateConditionalRulesSection(rules, repoPath) {
  const sections = [];
  const alwaysApplyRules = rules.filter((r) => r.metadata.alwaysApply !== false);
  const conditionalRules = rules.filter((r) => r.metadata.alwaysApply === false);
  if (conditionalRules.length === 0) {
    return "";
  }
  const rulesByFolder = {};
  const rulesWithScope = [];
  const rulesWithDescription = [];
  conditionalRules.forEach((rule) => {
    if (rule.metadata.id && rule.metadata.id.includes("/")) {
      const folder = rule.metadata.id.split("/")[0];
      if (!rulesByFolder[folder]) {
        rulesByFolder[folder] = [];
      }
      rulesByFolder[folder].push(rule);
    }
    if (rule.metadata.scope) {
      rulesWithScope.push(rule);
    } else if (rule.metadata.description && !rule.metadata.scope && !rule.metadata.id?.includes("/")) {
      rulesWithDescription.push(rule);
    }
  });
  sections.push("## Context-Specific Rules");
  sections.push("");
  if (rulesWithScope.length > 0) {
    rulesWithScope.forEach((rule) => {
      const scopes = Array.isArray(rule.metadata.scope) ? rule.metadata.scope : [rule.metadata.scope];
      scopes.forEach((scope) => {
        const rulePath = `.agent/${rule.metadata.id}.md`;
        const description = rule.metadata.description ? ` - ${rule.metadata.description}` : "";
        sections.push(`When working with files matching \`${scope}\`, also apply:`);
        sections.push(`\u2192 [${rule.metadata.id}](${rulePath})${description}`);
        sections.push("");
      });
    });
  }
  if (rulesWithDescription.length > 0) {
    rulesWithDescription.forEach((rule) => {
      const rulePath = `.agent/${rule.metadata.id}.md`;
      sections.push(`When working with ${rule.metadata.description}, also apply:`);
      sections.push(`\u2192 [${rule.metadata.id}](${rulePath})`);
      sections.push("");
    });
  }
  Object.entries(rulesByFolder).forEach(([folder, folderRules]) => {
    const unhandledRules = folderRules.filter(
      (r) => !rulesWithScope.includes(r) && !rulesWithDescription.includes(r)
    );
    if (unhandledRules.length > 0) {
      const sectionTitle = folder.charAt(0).toUpperCase() + folder.slice(1);
      sections.push(`## ${sectionTitle}`);
      sections.push("");
      unhandledRules.forEach((rule) => {
        const rulePath = `.agent/${rule.metadata.id}.md`;
        const description = rule.metadata.description ? ` - ${rule.metadata.description}` : "";
        sections.push(`\u2192 [${rule.metadata.id}](${rulePath})${description}`);
      });
      sections.push("");
    }
  });
  return sections.join("\n");
}
function exportToCopilot(rules, outputPath, options) {
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  const alwaysApplyRules = filteredRules.filter((r) => r.metadata.alwaysApply !== false);
  const conditionalSection = generateConditionalRulesSection(filteredRules, (0, import_path2.dirname)(outputPath));
  const mainContent = alwaysApplyRules.map((rule) => rule.content).join("\n\n---\n\n");
  const fullContent = conditionalSection ? `${mainContent}

---

${conditionalSection}` : mainContent;
  ensureDirectoryExists(outputPath);
  (0, import_fs2.writeFileSync)(outputPath, fullContent, "utf-8");
}
function exportToAgent(rules, outputDir, options) {
  const agentDir = (0, import_path2.join)(outputDir, ".agent");
  (0, import_fs2.mkdirSync)(agentDir, { recursive: true });
  let topIndex = 1;
  rules.forEach((rule) => {
    let filename;
    let filePath;
    if (rule.metadata.id && rule.metadata.id.includes("/")) {
      const parts = rule.metadata.id.split("/");
      const fileName = parts.pop() + ".md";
      const subDir = (0, import_path2.join)(agentDir, ...parts);
      (0, import_fs2.mkdirSync)(subDir, { recursive: true });
      filePath = (0, import_path2.join)(subDir, fileName);
    } else {
      if (rule.metadata.private) {
        const prefix = String(topIndex).padStart(3, "0") + "-";
        topIndex++;
        filename = `${prefix}${rule.metadata.id || "rule"}.md`;
        const privDir = (0, import_path2.join)(agentDir, "private");
        (0, import_fs2.mkdirSync)(privDir, { recursive: true });
        filePath = (0, import_path2.join)(privDir, filename);
      } else {
        filename = `${rule.metadata.id || "rule"}.md`;
        filePath = (0, import_path2.join)(agentDir, filename);
      }
    }
    const frontMatterBase = {};
    if (rule.metadata.description !== void 0 && rule.metadata.description !== null) frontMatterBase.description = rule.metadata.description;
    if (rule.metadata.alwaysApply !== void 0) frontMatterBase.alwaysApply = rule.metadata.alwaysApply;
    if (rule.metadata.globs !== void 0 && rule.metadata.globs !== null) frontMatterBase.globs = rule.metadata.globs;
    if (rule.metadata.manual !== void 0 && rule.metadata.manual !== null) frontMatterBase.manual = rule.metadata.manual;
    if (rule.metadata.scope !== void 0 && rule.metadata.scope !== null) frontMatterBase.scope = rule.metadata.scope;
    if (rule.metadata.priority !== void 0 && rule.metadata.priority !== null) frontMatterBase.priority = rule.metadata.priority;
    if (rule.metadata.triggers !== void 0 && rule.metadata.triggers !== null) frontMatterBase.triggers = rule.metadata.triggers;
    for (const [key, value] of Object.entries(rule.metadata)) {
      if (!["id", "description", "alwaysApply", "globs", "manual", "scope", "priority", "triggers"].includes(key) && value !== void 0 && value !== null) {
        if (key === "private" && value === false) continue;
        frontMatterBase[key] = value;
      }
    }
    const frontMatter = frontMatterBase;
    const mdContent = import_gray_matter2.default.stringify(rule.content, frontMatter, grayMatterOptions);
    (0, import_fs2.writeFileSync)(filePath, mdContent, "utf-8");
  });
}
function exportToCursor(rules, outputDir, options) {
  const rulesDir = (0, import_path2.join)(outputDir, ".cursor", "rules");
  (0, import_fs2.mkdirSync)(rulesDir, { recursive: true });
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  for (const rule of filteredRules) {
    let filePath;
    if (rule.metadata.id && rule.metadata.id.includes("/")) {
      const parts = rule.metadata.id.split("/");
      const fileName = parts.pop() + ".mdc";
      const subDir = (0, import_path2.join)(rulesDir, ...parts);
      (0, import_fs2.mkdirSync)(subDir, { recursive: true });
      filePath = (0, import_path2.join)(subDir, fileName);
    } else {
      const filename = `${rule.metadata.id || "rule"}.mdc`;
      filePath = (0, import_path2.join)(rulesDir, filename);
    }
    const frontMatterBase = {};
    if (rule.metadata.description !== void 0 && rule.metadata.description !== null) frontMatterBase.description = rule.metadata.description;
    if (rule.metadata.alwaysApply !== void 0) frontMatterBase.alwaysApply = rule.metadata.alwaysApply;
    if (rule.metadata.globs !== void 0 && rule.metadata.globs !== null) frontMatterBase.globs = rule.metadata.globs;
    if (rule.metadata.manual !== void 0 && rule.metadata.manual !== null) frontMatterBase.manual = rule.metadata.manual;
    if (rule.metadata.scope !== void 0 && rule.metadata.scope !== null) frontMatterBase.scope = rule.metadata.scope;
    if (rule.metadata.priority !== void 0 && rule.metadata.priority !== null) frontMatterBase.priority = rule.metadata.priority;
    if (rule.metadata.triggers !== void 0 && rule.metadata.triggers !== null) frontMatterBase.triggers = rule.metadata.triggers;
    for (const [key, value] of Object.entries(rule.metadata)) {
      if (!["id", "description", "alwaysApply", "globs", "manual", "scope", "priority", "triggers"].includes(key) && value !== void 0 && value !== null) {
        if (key === "private" && value === false) continue;
        frontMatterBase[key] = value;
      }
    }
    const frontMatter = frontMatterBase;
    const mdcContent = import_gray_matter2.default.stringify(rule.content, frontMatter, grayMatterOptions);
    (0, import_fs2.writeFileSync)(filePath, mdcContent, "utf-8");
  }
}
function exportToCline(rules, outputPath, options) {
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  if (outputPath.endsWith(".clinerules")) {
    const alwaysApplyRules = filteredRules.filter((r) => r.metadata.alwaysApply !== false);
    const conditionalSection = generateConditionalRulesSection(filteredRules, (0, import_path2.dirname)(outputPath));
    const mainContent = alwaysApplyRules.map((rule) => {
      const header2 = rule.metadata.description ? `## ${rule.metadata.description}

` : "";
      return header2 + rule.content;
    }).join("\n\n");
    const fullContent = conditionalSection ? `${mainContent}

${conditionalSection}` : mainContent;
    ensureDirectoryExists(outputPath);
    (0, import_fs2.writeFileSync)(outputPath, fullContent, "utf-8");
  } else {
    const rulesDir = (0, import_path2.join)(outputPath, ".clinerules");
    (0, import_fs2.mkdirSync)(rulesDir, { recursive: true });
    filteredRules.forEach((rule, index) => {
      const filename = `${String(index + 1).padStart(2, "0")}-${rule.metadata.id || "rule"}.md`;
      const filePath = (0, import_path2.join)(rulesDir, filename);
      (0, import_fs2.writeFileSync)(filePath, rule.content, "utf-8");
    });
  }
}
function exportToWindsurf(rules, outputPath, options) {
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  const alwaysApplyRules = filteredRules.filter((r) => r.metadata.alwaysApply !== false);
  const conditionalSection = generateConditionalRulesSection(filteredRules, (0, import_path2.dirname)(outputPath));
  const mainContent = alwaysApplyRules.map((rule) => rule.content).join("\n\n");
  const fullContent = conditionalSection ? `${mainContent}

${conditionalSection}` : mainContent;
  ensureDirectoryExists(outputPath);
  (0, import_fs2.writeFileSync)(outputPath, fullContent, "utf-8");
}
function exportToZed(rules, outputPath, options) {
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  const alwaysApplyRules = filteredRules.filter((r) => r.metadata.alwaysApply !== false);
  const conditionalSection = generateConditionalRulesSection(filteredRules, (0, import_path2.dirname)(outputPath));
  const mainContent = alwaysApplyRules.map((rule) => rule.content).join("\n\n");
  const fullContent = conditionalSection ? `${mainContent}

${conditionalSection}` : mainContent;
  ensureDirectoryExists(outputPath);
  (0, import_fs2.writeFileSync)(outputPath, fullContent, "utf-8");
}
function exportToCodex(rules, outputPath, options) {
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  const alwaysApplyRules = filteredRules.filter((r) => r.metadata.alwaysApply !== false);
  const conditionalSection = generateConditionalRulesSection(filteredRules, (0, import_path2.dirname)(outputPath));
  const mainContent = alwaysApplyRules.map((rule) => {
    const header2 = rule.metadata.description ? `# ${rule.metadata.description}

` : "";
    return header2 + rule.content;
  }).join("\n\n");
  const fullContent = conditionalSection ? `${mainContent}

${conditionalSection}` : mainContent;
  ensureDirectoryExists(outputPath);
  (0, import_fs2.writeFileSync)(outputPath, fullContent, "utf-8");
}
function exportToAider(rules, outputPath, options) {
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  const alwaysApplyRules = filteredRules.filter((r) => r.metadata.alwaysApply !== false);
  const conditionalSection = generateConditionalRulesSection(filteredRules, (0, import_path2.dirname)(outputPath));
  const mainContent = alwaysApplyRules.map((rule) => rule.content).join("\n\n");
  const fullContent = conditionalSection ? `${mainContent}

${conditionalSection}` : mainContent;
  ensureDirectoryExists(outputPath);
  (0, import_fs2.writeFileSync)(outputPath, fullContent, "utf-8");
}
function exportToClaudeCode(rules, outputPath, options) {
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  const alwaysApplyRules = filteredRules.filter((r) => r.metadata.alwaysApply !== false);
  const conditionalSection = generateConditionalRulesSection(filteredRules, (0, import_path2.dirname)(outputPath));
  const mainContent = alwaysApplyRules.map((rule) => {
    const header2 = rule.metadata.description ? `# ${rule.metadata.description}

` : "";
    return header2 + rule.content;
  }).join("\n\n");
  const fullContent = conditionalSection ? `${mainContent}

${conditionalSection}` : mainContent;
  ensureDirectoryExists(outputPath);
  (0, import_fs2.writeFileSync)(outputPath, fullContent, "utf-8");
}
function exportToGemini(rules, outputPath, options) {
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  const content = filteredRules.map((rule) => {
    const header2 = rule.metadata.description ? `# ${rule.metadata.description}

` : "";
    return header2 + rule.content;
  }).join("\n\n");
  ensureDirectoryExists(outputPath);
  (0, import_fs2.writeFileSync)(outputPath, content, "utf-8");
}
function exportToQodo(rules, outputPath, options) {
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  const alwaysApplyRules = filteredRules.filter((r) => r.metadata.alwaysApply !== false);
  const conditionalSection = generateConditionalRulesSection(filteredRules, (0, import_path2.dirname)(outputPath));
  const mainContent = alwaysApplyRules.map((rule) => {
    const header2 = rule.metadata.description ? `# ${rule.metadata.description}

` : "";
    return header2 + rule.content;
  }).join("\n\n---\n\n");
  const fullContent = conditionalSection ? `${mainContent}

---

${conditionalSection}` : mainContent;
  ensureDirectoryExists(outputPath);
  (0, import_fs2.writeFileSync)(outputPath, fullContent, "utf-8");
}
function exportToAmazonQ(rules, outputDir, options) {
  const rulesDir = (0, import_path2.join)(outputDir, ".amazonq", "rules");
  (0, import_fs2.mkdirSync)(rulesDir, { recursive: true });
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  for (const rule of filteredRules) {
    let filePath;
    if (rule.metadata.id && rule.metadata.id.includes("/")) {
      const parts = rule.metadata.id.split("/");
      const fileName = parts.pop() + ".md";
      const subDir = (0, import_path2.join)(rulesDir, ...parts);
      (0, import_fs2.mkdirSync)(subDir, { recursive: true });
      filePath = (0, import_path2.join)(subDir, fileName);
    } else {
      const cleanId = rule.metadata.id?.startsWith("amazonq-") ? rule.metadata.id.substring(8) : rule.metadata.id || "rule";
      const filename = `${cleanId}.md`;
      filePath = (0, import_path2.join)(rulesDir, filename);
    }
    (0, import_fs2.writeFileSync)(filePath, rule.content, "utf-8");
  }
}
function exportAll(rules, repoPath, dryRun = false, options = { includePrivate: false }) {
  if (!dryRun) {
    exportToAgent(rules, repoPath, options);
    exportToCopilot(rules, (0, import_path2.join)(repoPath, ".github", "copilot-instructions.md"), options);
    exportToCursor(rules, repoPath, options);
    exportToCline(rules, (0, import_path2.join)(repoPath, ".clinerules"), options);
    exportToWindsurf(rules, (0, import_path2.join)(repoPath, ".windsurfrules"), options);
    exportToZed(rules, (0, import_path2.join)(repoPath, ".rules"), options);
    exportToCodex(rules, (0, import_path2.join)(repoPath, "AGENTS.md"), options);
    exportToAider(rules, (0, import_path2.join)(repoPath, "CONVENTIONS.md"), options);
    exportToClaudeCode(rules, (0, import_path2.join)(repoPath, "CLAUDE.md"), options);
    exportToGemini(rules, (0, import_path2.join)(repoPath, "GEMINI.md"), options);
    exportToQodo(rules, (0, import_path2.join)(repoPath, "best_practices.md"), options);
    exportToAmazonQ(rules, repoPath, options);
  }
}
function ensureDirectoryExists(filePath) {
  const dir = (0, import_path2.dirname)(filePath);
  if (!(0, import_fs2.existsSync)(dir)) {
    (0, import_fs2.mkdirSync)(dir, { recursive: true });
  }
}

// src/utils/colors.ts
init_cjs_shims();
var colors = {
  reset: "\x1B[0m",
  bright: "\x1B[1m",
  dim: "\x1B[2m",
  // Foreground colors
  red: "\x1B[31m",
  green: "\x1B[32m",
  yellow: "\x1B[33m",
  blue: "\x1B[34m",
  magenta: "\x1B[35m",
  cyan: "\x1B[36m",
  gray: "\x1B[90m",
  // Background colors
  bgRed: "\x1B[41m",
  bgGreen: "\x1B[42m",
  bgYellow: "\x1B[43m"
};
function supportsColor() {
  if (process.env.NO_COLOR) return false;
  if (process.env.TERM === "dumb") return false;
  if (process.env.COLORTERM) return true;
  if (process.env.TERM?.includes("color")) return true;
  return false;
}
function colorize(text, color2) {
  if (!supportsColor()) return text;
  return `${colors[color2]}${text}${colors.reset}`;
}
var color = {
  // Status messages
  success: (text) => colorize(`\u2713 ${text}`, "green"),
  error: (text) => colorize(`\u2717 ${text}`, "red"),
  warning: (text) => colorize(`\u26A0 ${text}`, "yellow"),
  info: (text) => colorize(`\u2139 ${text}`, "blue"),
  // Text formatting
  bold: (text) => colorize(text, "bright"),
  dim: (text) => colorize(text, "dim"),
  // Semantic colors
  path: (text) => colorize(text, "cyan"),
  command: (text) => colorize(text, "magenta"),
  number: (text) => colorize(text, "yellow"),
  format: (text) => colorize(text, "blue"),
  // Raw colors
  red: (text) => colorize(text, "red"),
  green: (text) => colorize(text, "green"),
  yellow: (text) => colorize(text, "yellow"),
  blue: (text) => colorize(text, "blue"),
  gray: (text) => colorize(text, "gray")
};
function formatList(items, prefix = "  ") {
  return items.map((item) => `${prefix}${color.dim("\u2022")} ${item}`).join("\n");
}
function header(text) {
  const line = color.dim("\u2500".repeat(text.length + 4));
  return `
${line}
${color.bold(`  ${text}  `)}
${line}
`;
}

// src/utils/prompt.ts
init_cjs_shims();
var import_prompts = require("@inquirer/prompts");
async function confirm(question, defaultValue = false) {
  return await (0, import_prompts.confirm)({
    message: question,
    default: defaultValue
  });
}
async function select(message, choices, defaultIndex = 0) {
  const inquirerChoices = choices.map((choice, index) => ({
    name: choice.name,
    value: choice.value,
    // Set the default based on index
    ...index === defaultIndex ? { default: true } : {}
  }));
  return await (0, import_prompts.select)({
    message,
    choices: inquirerChoices
  });
}

// src/cli.ts
var { values, positionals } = (0, import_util.parseArgs)({
  args: process.argv.slice(2),
  options: {
    help: { type: "boolean", short: "h" },
    output: { type: "string", short: "o" },
    format: { type: "string", short: "f" },
    formats: { type: "string" },
    overwrite: { type: "boolean", short: "w" },
    "dry-run": { type: "boolean", short: "d" },
    "include-private": { type: "boolean" },
    "skip-private": { type: "boolean" },
    "no-gitignore": { type: "boolean" }
  },
  allowPositionals: true
});
function showHelp() {
  console.log(`
${color.bold("dotagent")} - Multi-file AI agent configuration manager

${color.bold("Usage:")}
  ${color.command("dotagent import")} ${color.dim("<repo-path>")}    Import all rule files from a repository
  ${color.command("dotagent export")} ${color.dim("[repo-path]")}   Export .agent/ directory to all supported formats
  ${color.command("dotagent convert")} ${color.dim("<file>")}        Convert a specific rule file

${color.bold("Options:")}
  ${color.yellow("-h, --help")}       Show this help message
  ${color.yellow("-o, --output")}     Output file path (for convert command)
  ${color.yellow("-f, --format")}     Specify format (copilot|cursor|cline|windsurf|zed|codex|aider|claude|gemini|qodo)
  ${color.yellow("--formats")}        Specify multiple formats (comma-separated)
  ${color.yellow("-w, --overwrite")}  Overwrite existing files
  ${color.yellow("-d, --dry-run")}    Preview operations without making changes
  ${color.yellow("--no-gitignore")}   Skip gitignore prompt

${color.bold("Examples:")}
  ${color.dim("# Import all rules from current directory (creates .agent/)")}
  ${color.command("dotagent import .")}

  ${color.dim("# Export .agent/ directory to all formats")}
  ${color.command("dotagent export")}
  
  ${color.dim("# Export from specific directory")}
  ${color.command("dotagent export /path/to/repo")}

  ${color.dim("# Preview what would be imported without creating files")}
  ${color.command("dotagent import . --dry-run")}
`);
}
async function main() {
  if (values.help || positionals.length === 0) {
    showHelp();
    process.exit(0);
  }
  const command = positionals[0];
  const target = positionals[1];
  const isDryRun = values["dry-run"];
  if (isDryRun) {
    console.log(color.info("Running in dry-run mode - no files will be modified"));
  }
  switch (command) {
    case "import": {
      const importTarget = target || ".";
      const repoPath = (0, import_path3.resolve)(importTarget);
      if (!(0, import_fs3.existsSync)(repoPath)) {
        console.error(color.error(`Path does not exist: ${color.path(repoPath)}`));
        console.error(color.dim('Hint: Check if the path is correct or use "." for current directory'));
        process.exit(1);
      }
      console.log(header("Importing Rules"));
      console.log(`Scanning: ${color.path(repoPath)}`);
      const { results, errors } = await importAll(repoPath);
      if (results.length === 0) {
        console.log(color.warning("No rule files found"));
        console.log(color.dim("Hint: DotAgent looks for:"));
        console.log(formatList([
          ".agent/**/*.md",
          ".github/copilot-instructions.md",
          ".cursor/**/*.{mdc,md}",
          ".clinerules",
          ".windsurfrules",
          ".rules",
          "AGENTS.md",
          "CLAUDE.md",
          "GEMINI.md",
          "best_practices.md"
        ]));
      } else {
        console.log(color.success(`Found ${color.number(results.length.toString())} rule file(s):`));
        for (const result of results) {
          const ruleCount = color.number(`${result.rules.length} rule(s)`);
          console.log(`  ${color.format(result.format)}: ${color.path(result.filePath)} ${color.dim(`(${ruleCount})`)}`);
        }
        const allRules = results.flatMap((r) => r.rules);
        const agentDir = (0, import_path3.join)(repoPath, ".agent");
        if ((0, import_fs3.existsSync)(agentDir)) {
          const existingAgent = importAgent(agentDir);
          console.log(color.info(`Found existing .agent/ directory with ${color.number(existingAgent.rules.length.toString())} rule(s)`));
        }
        if (isDryRun) {
          console.log(color.info(`Would export to: ${color.path(agentDir)}`));
          console.log(color.dim(`Total rules: ${allRules.length}`));
        } else {
          const outputDir = values.output || repoPath;
          exportToAgent(allRules, outputDir);
          console.log(color.success(`Created .agent/ directory with ${color.number(allRules.length.toString())} rule(s)`));
        }
      }
      if (errors.length > 0) {
        console.log(color.warning("Import errors:"));
        for (const error of errors) {
          console.log(`  ${color.red("\xD7")} ${color.path(error.file)}: ${error.error}`);
        }
      }
      break;
    }
    case "export": {
      const repoPath = target ? (0, import_path3.resolve)(target) : process.cwd();
      const agentDir = (0, import_path3.join)(repoPath, ".agent");
      if (!(0, import_fs3.existsSync)(agentDir)) {
        console.error(color.error(`No .agent/ directory found in: ${color.path(repoPath)}`));
        console.error(color.dim('Hint: Run "dotagent import ." first to create .agent/ directory'));
        process.exit(1);
      }
      const agentConfigPath = (0, import_path3.join)(repoPath, ".agentconfig");
      if ((0, import_fs3.existsSync)(agentConfigPath)) {
        console.error(color.error("Found deprecated .agentconfig file"));
        console.error(color.dim('The single-file .agentconfig format is deprecated. Please run "dotagent import ." to migrate to .agent/ directory.'));
        process.exit(1);
      }
      console.log(header("Exporting Rules"));
      const result = importAgent(agentDir);
      const rules = result.rules;
      console.log(color.success(`Found ${color.number(rules.length.toString())} rule(s) in ${color.path(agentDir)}`));
      const privateRuleCount = rules.filter((r) => r.metadata.private).length;
      if (privateRuleCount > 0) {
        console.log(color.dim(`Including ${privateRuleCount} private rule(s)`));
      }
      const outputDir = values.output || repoPath;
      const exportFormats = [
        { name: "All formats", value: "all" },
        { name: "VS Code Copilot (.github/copilot-instructions.md)", value: "copilot" },
        { name: "Cursor (.cursor/rules/)", value: "cursor" },
        { name: "Cline (.clinerules)", value: "cline" },
        { name: "Windsurf (.windsurfrules)", value: "windsurf" },
        { name: "Zed (.rules)", value: "zed" },
        { name: "OpenAI Codex (AGENTS.md)", value: "codex" },
        { name: "Aider (CONVENTIONS.md)", value: "aider" },
        { name: "Claude Code (CLAUDE.md)", value: "claude" },
        { name: "Gemini CLI (GEMINI.md)", value: "gemini" },
        { name: "Qodo Merge (best_practices.md)", value: "qodo" }
      ];
      let selectedFormats = [];
      if (values.formats) {
        selectedFormats = values.formats.split(",").map((f) => f.trim());
      } else if (values.format) {
        selectedFormats = [values.format];
      } else {
        console.log();
        const selectedFormat = await select("Select export format:", exportFormats, 0);
        selectedFormats = selectedFormat === "all" ? ["all"] : [selectedFormat];
      }
      const validFormats = ["all", "copilot", "cursor", "cline", "windsurf", "zed", "codex", "aider", "claude", "gemini", "qodo"];
      const invalidFormats = selectedFormats.filter((f) => !validFormats.includes(f));
      if (invalidFormats.length > 0) {
        console.error(color.error(`Invalid format(s): ${invalidFormats.join(", ")}`));
        console.error(color.dim(`Valid formats: ${validFormats.slice(1).join(", ")}, all`));
        process.exit(1);
      }
      if (isDryRun) {
        console.log(color.info("Dry run mode - no files will be written"));
      }
      const options = { includePrivate: values["include-private"] };
      const exportedPaths = [];
      for (const selectedFormat of selectedFormats) {
        if (selectedFormat === "all") {
          if (!isDryRun) {
            exportAll(rules, outputDir, false, options);
          }
          console.log(color.success("Exported to all formats"));
          exportedPaths.push(
            ".github/copilot-instructions.md",
            ".cursor/rules/",
            ".clinerules",
            ".windsurfrules",
            ".rules",
            "AGENTS.md",
            "CONVENTIONS.md",
            "CLAUDE.md",
            "GEMINI.md",
            "best_practices.md"
          );
        } else {
          let exportPath = "";
          switch (selectedFormat) {
            case "copilot":
              exportPath = (0, import_path3.join)(outputDir, ".github", "copilot-instructions.md");
              if (!isDryRun) exportToCopilot(rules, exportPath, options);
              exportedPaths.push(".github/copilot-instructions.md");
              break;
            case "cursor":
              if (!isDryRun) exportToCursor(rules, outputDir, options);
              exportPath = (0, import_path3.join)(outputDir, ".cursor/rules/");
              exportedPaths.push(".cursor/rules/");
              break;
            case "cline":
              exportPath = (0, import_path3.join)(outputDir, ".clinerules");
              if (!isDryRun) exportToCline(rules, exportPath, options);
              exportedPaths.push(".clinerules");
              break;
            case "windsurf":
              exportPath = (0, import_path3.join)(outputDir, ".windsurfrules");
              if (!isDryRun) exportToWindsurf(rules, exportPath, options);
              exportedPaths.push(".windsurfrules");
              break;
            case "zed":
              exportPath = (0, import_path3.join)(outputDir, ".rules");
              if (!isDryRun) exportToZed(rules, exportPath, options);
              exportedPaths.push(".rules");
              break;
            case "codex":
              exportPath = (0, import_path3.join)(outputDir, "AGENTS.md");
              if (!isDryRun) exportToCodex(rules, exportPath, options);
              exportedPaths.push("AGENTS.md");
              break;
            case "aider":
              exportPath = (0, import_path3.join)(outputDir, "CONVENTIONS.md");
              if (!isDryRun) exportToAider(rules, exportPath, options);
              exportedPaths.push("CONVENTIONS.md");
              break;
            case "claude":
              exportPath = (0, import_path3.join)(outputDir, "CLAUDE.md");
              if (!isDryRun) exportToClaudeCode(rules, exportPath, options);
              exportedPaths.push("CLAUDE.md");
              break;
            case "gemini":
              exportPath = (0, import_path3.join)(outputDir, "GEMINI.md");
              if (!isDryRun) exportToGemini(rules, exportPath, options);
              exportedPaths.push("GEMINI.md");
              break;
            case "qodo":
              exportPath = (0, import_path3.join)(outputDir, "best_practices.md");
              if (!isDryRun) exportToQodo(rules, exportPath, options);
              exportedPaths.push("best_practices.md");
              break;
          }
          if (exportPath) {
            console.log(color.success(`Exported to: ${color.path(exportPath)}`));
          }
        }
      }
      if (!values["include-private"] && privateRuleCount > 0) {
        console.log(color.dim(`
Excluded ${privateRuleCount} private rule(s). Use --include-private to include them.`));
      }
      if (!isDryRun && exportedPaths.length > 0 && !values["no-gitignore"]) {
        console.log();
        const shouldUpdateGitignore = await confirm("Add exported files to .gitignore?", true);
        if (shouldUpdateGitignore) {
          updateGitignoreWithPaths(outputDir, exportedPaths);
          console.log(color.success("Updated .gitignore"));
        }
      }
      break;
    }
    case "convert": {
      if (!target) {
        console.error(color.error("Input file path required"));
        process.exit(1);
      }
      const inputPath = (0, import_path3.resolve)(target);
      if (!(0, import_fs3.existsSync)(inputPath)) {
        console.error(color.error(`File does not exist: ${color.path(inputPath)}`));
        process.exit(1);
      }
      console.log(header("Converting File"));
      let format = values.format;
      if (!format) {
        if (inputPath.includes("copilot-instructions")) format = "copilot";
        else if (inputPath.endsWith(".mdc")) format = "cursor";
        else if (inputPath.includes(".clinerules")) format = "cline";
        else if (inputPath.includes(".windsurfrules")) format = "windsurf";
        else if (inputPath.endsWith(".rules")) format = "zed";
        else if (inputPath.endsWith("AGENTS.md")) format = "codex";
        else if (inputPath.endsWith("CLAUDE.md")) format = "claude";
        else if (inputPath.endsWith("GEMINI.md")) format = "gemini";
        else if (inputPath.endsWith("CONVENTIONS.md")) format = "aider";
        else if (inputPath.endsWith("best_practices.md")) format = "qodo";
        else {
          console.error(color.error("Cannot auto-detect format"));
          console.error(color.dim("Hint: Specify format with -f (copilot|cursor|cline|windsurf|zed|codex|aider|claude|gemini|qodo)"));
          process.exit(1);
        }
      }
      console.log(`Format: ${color.format(format)}`);
      console.log(`Input: ${color.path(inputPath)}`);
      const { importCopilot: importCopilot2, importCursor: importCursor2, importCline: importCline2, importWindsurf: importWindsurf2, importZed: importZed2, importCodex: importCodex2, importAider: importAider2, importClaudeCode: importClaudeCode2, importGemini: importGemini2, importQodo: importQodo2 } = await Promise.resolve().then(() => (init_importers(), importers_exports));
      let result;
      switch (format) {
        case "copilot":
          result = importCopilot2(inputPath);
          break;
        case "cursor":
          result = importCursor2(inputPath);
          break;
        case "cline":
          result = importCline2(inputPath);
          break;
        case "windsurf":
          result = importWindsurf2(inputPath);
          break;
        case "zed":
          result = importZed2(inputPath);
          break;
        case "codex":
          result = importCodex2(inputPath);
          break;
        case "aider":
          result = importAider2(inputPath);
          break;
        case "claude":
          result = importClaudeCode2(inputPath);
          break;
        case "gemini":
          result = importGemini2(inputPath);
          break;
        case "qodo":
          result = importQodo2(inputPath);
          break;
        default:
          console.error(color.error(`Unknown format: ${format}`));
          process.exit(1);
      }
      const outputDir = values.output || (0, import_path3.dirname)(inputPath);
      const agentDir = (0, import_path3.join)(outputDir, ".agent");
      if ((0, import_fs3.existsSync)(agentDir) && !values.overwrite) {
        (0, import_fs3.rmSync)(agentDir, { recursive: true, force: true });
      }
      if (isDryRun) {
        console.log(color.info(`Would export to: ${color.path(agentDir)}`));
        console.log(color.dim(`Rules found: ${result.rules.length}`));
      } else {
        exportToAgent(result.rules, outputDir);
        console.log(color.success(`Exported to: ${color.path(agentDir)}`));
        console.log(color.dim(`Created ${result.rules.length} .mdc file(s)`));
      }
      break;
    }
    default:
      console.error(color.error(`Unknown command: ${command}`));
      showHelp();
      process.exit(1);
  }
}
function updateGitignoreWithPaths(repoPath, paths) {
  const gitignorePath = (0, import_path3.join)(repoPath, ".gitignore");
  const patterns = [
    "",
    "# Added by dotagent: ignore exported AI rule files",
    ...paths.map((p) => p.endsWith("/") ? p + "**" : p),
    ""
  ].join("\n");
  if ((0, import_fs3.existsSync)(gitignorePath)) {
    const content = (0, import_fs3.readFileSync)(gitignorePath, "utf-8");
    const newPatterns = paths.filter((p) => {
      const pattern = p.endsWith("/") ? p + "**" : p;
      return !content.includes(pattern);
    });
    if (newPatterns.length > 0) {
      (0, import_fs3.appendFileSync)(gitignorePath, patterns);
    }
  } else {
    (0, import_fs3.writeFileSync)(gitignorePath, patterns.trim() + "\n");
  }
}
main().catch((error) => {
  console.error(color.error("Unexpected error:"));
  console.error(error);
  process.exit(1);
});
//# sourceMappingURL=cli.cjs.map