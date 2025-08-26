// src/parser.ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import { toMarkdown } from "mdast-util-to-markdown";
import yaml from "js-yaml";
function parseAgentMarkdown(markdown, options = {}) {
  console.warn("Warning: parseAgentMarkdown() is deprecated. Use importAgent() to import from .agent/ directory instead.");
  const processor = unified().use(remarkParse);
  const tree = processor.parse(markdown);
  const rules = [];
  let currentMetadata = null;
  let currentContent = [];
  let currentPosition;
  for (let i = 0; i < tree.children.length; i++) {
    const node = tree.children[i];
    if (node.type === "html" && isRuleComment(node.value)) {
      if (currentMetadata && currentContent.length > 0) {
        rules.push({
          metadata: currentMetadata,
          content: nodesToMarkdown(currentContent),
          position: currentPosition
        });
      }
      currentMetadata = parseRuleComment(node.value);
      currentContent = [];
      currentPosition = node.position ? {
        start: { ...node.position.start },
        end: { ...node.position.end }
      } : void 0;
    } else if (currentMetadata) {
      currentContent.push(node);
      if (currentPosition && node.position) {
        currentPosition.end = { ...node.position.end };
      }
    }
  }
  if (currentMetadata && currentContent.length > 0) {
    rules.push({
      metadata: currentMetadata,
      content: nodesToMarkdown(currentContent),
      position: currentPosition
    });
  }
  return rules;
}
function isRuleComment(html) {
  return /<!--\s*@[a-zA-Z0-9-]+(\s|$)/.test(html);
}
function parseRuleComment(html) {
  const match = html.match(/<!--\s*@([a-zA-Z0-9-]+)\s*([\s\S]*?)\s*-->/);
  if (!match) {
    throw new Error("Invalid rule comment format");
  }
  const id = match[1];
  const metaContent = match[2].trim();
  const metadata = { id };
  if (!metaContent) {
    return metadata;
  }
  if (metaContent.includes("\n") || metaContent.startsWith("-") || metaContent.includes(": ")) {
    try {
      const parsed = yaml.load(metaContent);
      if (typeof parsed === "object" && parsed !== null) {
        return { ...parsed, id };
      }
    } catch {
    }
  }
  if (!metaContent.includes("\n")) {
    const pairs = metaContent.matchAll(/(\w+):(\S+)(?:\s|$)/g);
    for (const [, key, value] of pairs) {
      if (key === "scope" && value.includes(",")) {
        metadata[key] = value.split(",").map((s) => s.trim());
      } else if (key === "alwaysApply" || key === "manual") {
        metadata[key] = value === "true";
      } else if (key !== "id") {
        metadata[key] = value;
      }
    }
  } else {
    const lines = metaContent.split("\n");
    for (const line of lines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        if (key === "scope" && value.includes(",")) {
          metadata[key] = value.split(",").map((s) => s.trim());
        } else if (key === "alwaysApply" || key === "manual") {
          metadata[key] = value === "true";
        } else if (key !== "id" && value) {
          metadata[key] = value;
        }
      }
    }
  }
  return metadata;
}
function nodesToMarkdown(nodes) {
  const tree = {
    type: "root",
    children: nodes
  };
  return toMarkdown(tree, {
    bullet: "-",
    emphasis: "*",
    rule: "-"
  }).trim();
}
function parseFenceEncodedMarkdown(markdown, options = {}) {
  const processor = unified().use(remarkParse);
  const tree = processor.parse(markdown);
  const rules = [];
  let currentMetadata = null;
  let currentContent = [];
  let currentPosition;
  for (let i = 0; i < tree.children.length; i++) {
    const node = tree.children[i];
    if (node.type === "code" && node.lang === "rule") {
      if (currentMetadata && currentContent.length > 0) {
        rules.push({
          metadata: currentMetadata,
          content: nodesToMarkdown(currentContent),
          position: currentPosition
        });
      }
      try {
        currentMetadata = yaml.load(node.value);
        if (!currentMetadata.id) {
          currentMetadata.id = `rule-${Date.now()}`;
        }
        currentContent = [];
        currentPosition = node.position ? {
          start: { ...node.position.start },
          end: { ...node.position.end }
        } : void 0;
      } catch (e) {
        if (options.strict) {
          throw new Error(`Failed to parse rule metadata: ${e}`);
        }
        currentMetadata = null;
      }
    } else if (currentMetadata) {
      currentContent.push(node);
      if (currentPosition && node.position) {
        currentPosition.end = { ...node.position.end };
      }
    }
  }
  if (currentMetadata && currentContent.length > 0) {
    rules.push({
      metadata: currentMetadata,
      content: nodesToMarkdown(currentContent),
      position: currentPosition
    });
  }
  return rules;
}

// src/importers.ts
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";
import matter from "gray-matter";

// src/yaml-parser.ts
import yaml2 from "js-yaml";
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
        return yaml2.load(fullyProcessedStr);
      } catch (error) {
        return yaml2.load(str);
      }
    },
    stringify: (data) => {
      const yamlOutput = yaml2.dump(data);
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
var grayMatterOptions = {
  engines: {
    yaml: createSafeYamlParser()
  }
};

// src/importers.ts
function isPrivateRule(filePath) {
  const lowerPath = filePath.toLowerCase();
  return lowerPath.includes(".local.") || lowerPath.includes("/private/") || lowerPath.includes("\\private\\");
}
async function importAll(repoPath) {
  const results = [];
  const errors = [];
  const agentDir = join(repoPath, ".agent");
  if (existsSync(agentDir)) {
    try {
      results.push(importAgent(agentDir));
    } catch (e) {
      errors.push({ file: agentDir, error: String(e) });
    }
  }
  const copilotPath = join(repoPath, ".github", "copilot-instructions.md");
  if (existsSync(copilotPath)) {
    try {
      results.push(importCopilot(copilotPath));
    } catch (e) {
      errors.push({ file: copilotPath, error: String(e) });
    }
  }
  const copilotLocalPath = join(repoPath, ".github", "copilot-instructions.local.md");
  if (existsSync(copilotLocalPath)) {
    try {
      results.push(importCopilot(copilotLocalPath));
    } catch (e) {
      errors.push({ file: copilotLocalPath, error: String(e) });
    }
  }
  const cursorDir = join(repoPath, ".cursor");
  if (existsSync(cursorDir)) {
    try {
      results.push(importCursor(cursorDir));
    } catch (e) {
      errors.push({ file: cursorDir, error: String(e) });
    }
  }
  const cursorRulesFile = join(repoPath, ".cursorrules");
  if (existsSync(cursorRulesFile)) {
    try {
      results.push(importCursorLegacy(cursorRulesFile));
    } catch (e) {
      errors.push({ file: cursorRulesFile, error: String(e) });
    }
  }
  const clinerules = join(repoPath, ".clinerules");
  if (existsSync(clinerules)) {
    try {
      results.push(importCline(clinerules));
    } catch (e) {
      errors.push({ file: clinerules, error: String(e) });
    }
  }
  const clinerulesLocal = join(repoPath, ".clinerules.local");
  if (existsSync(clinerulesLocal)) {
    try {
      results.push(importCline(clinerulesLocal));
    } catch (e) {
      errors.push({ file: clinerulesLocal, error: String(e) });
    }
  }
  const windsurfRules = join(repoPath, ".windsurfrules");
  if (existsSync(windsurfRules)) {
    try {
      results.push(importWindsurf(windsurfRules));
    } catch (e) {
      errors.push({ file: windsurfRules, error: String(e) });
    }
  }
  const windsurfRulesLocal = join(repoPath, ".windsurfrules.local");
  if (existsSync(windsurfRulesLocal)) {
    try {
      results.push(importWindsurf(windsurfRulesLocal));
    } catch (e) {
      errors.push({ file: windsurfRulesLocal, error: String(e) });
    }
  }
  const zedRules = join(repoPath, ".rules");
  if (existsSync(zedRules)) {
    try {
      results.push(importZed(zedRules));
    } catch (e) {
      errors.push({ file: zedRules, error: String(e) });
    }
  }
  const zedRulesLocal = join(repoPath, ".rules.local");
  if (existsSync(zedRulesLocal)) {
    try {
      results.push(importZed(zedRulesLocal));
    } catch (e) {
      errors.push({ file: zedRulesLocal, error: String(e) });
    }
  }
  const agentsMd = join(repoPath, "AGENTS.md");
  if (existsSync(agentsMd)) {
    try {
      results.push(importCodex(agentsMd));
    } catch (e) {
      errors.push({ file: agentsMd, error: String(e) });
    }
  }
  const agentsLocalMd = join(repoPath, "AGENTS.local.md");
  if (existsSync(agentsLocalMd)) {
    try {
      results.push(importCodex(agentsLocalMd));
    } catch (e) {
      errors.push({ file: agentsLocalMd, error: String(e) });
    }
  }
  const claudeMd = join(repoPath, "CLAUDE.md");
  if (existsSync(claudeMd)) {
    try {
      results.push(importClaudeCode(claudeMd));
    } catch (e) {
      errors.push({ file: claudeMd, error: String(e) });
    }
  }
  const geminiMd = join(repoPath, "GEMINI.md");
  if (existsSync(geminiMd)) {
    try {
      results.push(importGemini(geminiMd));
    } catch (e) {
      errors.push({ file: geminiMd, error: String(e) });
    }
  }
  const bestPracticesMd = join(repoPath, "best_practices.md");
  if (existsSync(bestPracticesMd)) {
    try {
      results.push(importQodo(bestPracticesMd));
    } catch (e) {
      errors.push({ file: bestPracticesMd, error: String(e) });
    }
  }
  const claudeLocalMd = join(repoPath, "CLAUDE.local.md");
  if (existsSync(claudeLocalMd)) {
    try {
      results.push(importClaudeCode(claudeLocalMd));
    } catch (e) {
      errors.push({ file: claudeLocalMd, error: String(e) });
    }
  }
  const geminiLocalMd = join(repoPath, "GEMINI.local.md");
  if (existsSync(geminiLocalMd)) {
    try {
      results.push(importGemini(geminiLocalMd));
    } catch (e) {
      errors.push({ file: geminiLocalMd, error: String(e) });
    }
  }
  const conventionsMd = join(repoPath, "CONVENTIONS.md");
  if (existsSync(conventionsMd)) {
    try {
      results.push(importAider(conventionsMd));
    } catch (e) {
      errors.push({ file: conventionsMd, error: String(e) });
    }
  }
  const conventionsLocalMd = join(repoPath, "CONVENTIONS.local.md");
  if (existsSync(conventionsLocalMd)) {
    try {
      results.push(importAider(conventionsLocalMd));
    } catch (e) {
      errors.push({ file: conventionsLocalMd, error: String(e) });
    }
  }
  const amazonqRulesDir = join(repoPath, ".amazonq", "rules");
  if (existsSync(amazonqRulesDir)) {
    try {
      results.push(importAmazonQ(amazonqRulesDir));
    } catch (e) {
      errors.push({ file: amazonqRulesDir, error: String(e) });
    }
  }
  return { results, errors };
}
function importCopilot(filePath) {
  const content = readFileSync(filePath, "utf-8");
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
    const entries = readdirSync(dir, { withFileTypes: true });
    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relPath = relativePath ? join(relativePath, entry.name) : entry.name;
      if (entry.isDirectory()) {
        findMarkdownFiles(fullPath, relPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const content = readFileSync(fullPath, "utf-8");
        const { data, content: body } = matter(content, grayMatterOptions);
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
    const entries = readdirSync(dir, { withFileTypes: true });
    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relPath = relativePath ? join(relativePath, entry.name) : entry.name;
      if (entry.isDirectory()) {
        findCursorFiles(fullPath, relPath);
      } else if (entry.isFile() && (entry.name.endsWith(".mdc") || entry.name.endsWith(".md"))) {
        const content = readFileSync(fullPath, "utf-8");
        const { data, content: body } = matter(content, grayMatterOptions);
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
  const content = readFileSync(filePath, "utf-8");
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
  if (existsSync(rulesPath) && statSync(rulesPath).isDirectory()) {
    let findMdFiles2 = function(dir, relativePath = "") {
      const entries = readdirSync(dir, { withFileTypes: true });
      entries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relPath = relativePath ? join(relativePath, entry.name) : entry.name;
        if (entry.isDirectory()) {
          findMdFiles2(fullPath, relPath);
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          const content = readFileSync(fullPath, "utf-8");
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
    const content = readFileSync(rulesPath, "utf-8");
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
  const content = readFileSync(filePath, "utf-8");
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
  const content = readFileSync(filePath, "utf-8");
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
  const content = readFileSync(filePath, "utf-8");
  const format = basename(filePath) === "AGENTS.md" || basename(filePath) === "AGENTS.local.md" ? "codex" : "unknown";
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
  const content = readFileSync(filePath, "utf-8");
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
  const content = readFileSync(filePath, "utf-8");
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
  const content = readFileSync(filePath, "utf-8");
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
  const content = readFileSync(filePath, "utf-8");
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
    const entries = readdirSync(dir, { withFileTypes: true });
    entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relPath = relativePath ? join(relativePath, entry.name) : entry.name;
      if (entry.isDirectory()) {
        findMdFiles(fullPath, relPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const content = readFileSync(fullPath, "utf-8");
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

// src/exporters.ts
import { writeFileSync, mkdirSync, existsSync as existsSync2 } from "fs";
import { join as join2, dirname } from "path";
import yaml3 from "js-yaml";
import matter2 from "gray-matter";
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
function toAgentMarkdown(rules) {
  console.warn("Warning: toAgentMarkdown() is deprecated. Use exportToAgent() to export to .agent/ directory instead.");
  const sections = [];
  for (const rule of rules) {
    const { metadata, content } = rule;
    const { id, ...otherMetadata } = metadata;
    let metaComment = `<!-- @${id}`;
    if (Object.keys(otherMetadata).length > 0) {
      const metaYaml = yaml3.dump(otherMetadata, {
        flowLevel: 1,
        lineWidth: -1
      }).trim();
      metaComment += `
${metaYaml}`;
    }
    metaComment += " -->";
    sections.push(`${metaComment}

${content}`);
  }
  return sections.join("\n\n");
}
function exportToCopilot(rules, outputPath, options) {
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  const alwaysApplyRules = filteredRules.filter((r) => r.metadata.alwaysApply !== false);
  const conditionalSection = generateConditionalRulesSection(filteredRules, dirname(outputPath));
  const mainContent = alwaysApplyRules.map((rule) => rule.content).join("\n\n---\n\n");
  const fullContent = conditionalSection ? `${mainContent}

---

${conditionalSection}` : mainContent;
  ensureDirectoryExists(outputPath);
  writeFileSync(outputPath, fullContent, "utf-8");
}
function exportToAgent(rules, outputDir, options) {
  const agentDir = join2(outputDir, ".agent");
  mkdirSync(agentDir, { recursive: true });
  let topIndex = 1;
  rules.forEach((rule) => {
    let filename;
    let filePath;
    if (rule.metadata.id && rule.metadata.id.includes("/")) {
      const parts = rule.metadata.id.split("/");
      const fileName = parts.pop() + ".md";
      const subDir = join2(agentDir, ...parts);
      mkdirSync(subDir, { recursive: true });
      filePath = join2(subDir, fileName);
    } else {
      if (rule.metadata.private) {
        const prefix = String(topIndex).padStart(3, "0") + "-";
        topIndex++;
        filename = `${prefix}${rule.metadata.id || "rule"}.md`;
        const privDir = join2(agentDir, "private");
        mkdirSync(privDir, { recursive: true });
        filePath = join2(privDir, filename);
      } else {
        filename = `${rule.metadata.id || "rule"}.md`;
        filePath = join2(agentDir, filename);
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
    const mdContent = matter2.stringify(rule.content, frontMatter, grayMatterOptions);
    writeFileSync(filePath, mdContent, "utf-8");
  });
}
function exportToCursor(rules, outputDir, options) {
  const rulesDir = join2(outputDir, ".cursor", "rules");
  mkdirSync(rulesDir, { recursive: true });
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  for (const rule of filteredRules) {
    let filePath;
    if (rule.metadata.id && rule.metadata.id.includes("/")) {
      const parts = rule.metadata.id.split("/");
      const fileName = parts.pop() + ".mdc";
      const subDir = join2(rulesDir, ...parts);
      mkdirSync(subDir, { recursive: true });
      filePath = join2(subDir, fileName);
    } else {
      const filename = `${rule.metadata.id || "rule"}.mdc`;
      filePath = join2(rulesDir, filename);
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
    const mdcContent = matter2.stringify(rule.content, frontMatter, grayMatterOptions);
    writeFileSync(filePath, mdcContent, "utf-8");
  }
}
function exportToCline(rules, outputPath, options) {
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  if (outputPath.endsWith(".clinerules")) {
    const alwaysApplyRules = filteredRules.filter((r) => r.metadata.alwaysApply !== false);
    const conditionalSection = generateConditionalRulesSection(filteredRules, dirname(outputPath));
    const mainContent = alwaysApplyRules.map((rule) => {
      const header = rule.metadata.description ? `## ${rule.metadata.description}

` : "";
      return header + rule.content;
    }).join("\n\n");
    const fullContent = conditionalSection ? `${mainContent}

${conditionalSection}` : mainContent;
    ensureDirectoryExists(outputPath);
    writeFileSync(outputPath, fullContent, "utf-8");
  } else {
    const rulesDir = join2(outputPath, ".clinerules");
    mkdirSync(rulesDir, { recursive: true });
    filteredRules.forEach((rule, index) => {
      const filename = `${String(index + 1).padStart(2, "0")}-${rule.metadata.id || "rule"}.md`;
      const filePath = join2(rulesDir, filename);
      writeFileSync(filePath, rule.content, "utf-8");
    });
  }
}
function exportToWindsurf(rules, outputPath, options) {
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  const alwaysApplyRules = filteredRules.filter((r) => r.metadata.alwaysApply !== false);
  const conditionalSection = generateConditionalRulesSection(filteredRules, dirname(outputPath));
  const mainContent = alwaysApplyRules.map((rule) => rule.content).join("\n\n");
  const fullContent = conditionalSection ? `${mainContent}

${conditionalSection}` : mainContent;
  ensureDirectoryExists(outputPath);
  writeFileSync(outputPath, fullContent, "utf-8");
}
function exportToZed(rules, outputPath, options) {
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  const alwaysApplyRules = filteredRules.filter((r) => r.metadata.alwaysApply !== false);
  const conditionalSection = generateConditionalRulesSection(filteredRules, dirname(outputPath));
  const mainContent = alwaysApplyRules.map((rule) => rule.content).join("\n\n");
  const fullContent = conditionalSection ? `${mainContent}

${conditionalSection}` : mainContent;
  ensureDirectoryExists(outputPath);
  writeFileSync(outputPath, fullContent, "utf-8");
}
function exportToCodex(rules, outputPath, options) {
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  const alwaysApplyRules = filteredRules.filter((r) => r.metadata.alwaysApply !== false);
  const conditionalSection = generateConditionalRulesSection(filteredRules, dirname(outputPath));
  const mainContent = alwaysApplyRules.map((rule) => {
    const header = rule.metadata.description ? `# ${rule.metadata.description}

` : "";
    return header + rule.content;
  }).join("\n\n");
  const fullContent = conditionalSection ? `${mainContent}

${conditionalSection}` : mainContent;
  ensureDirectoryExists(outputPath);
  writeFileSync(outputPath, fullContent, "utf-8");
}
function exportToAider(rules, outputPath, options) {
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  const alwaysApplyRules = filteredRules.filter((r) => r.metadata.alwaysApply !== false);
  const conditionalSection = generateConditionalRulesSection(filteredRules, dirname(outputPath));
  const mainContent = alwaysApplyRules.map((rule) => rule.content).join("\n\n");
  const fullContent = conditionalSection ? `${mainContent}

${conditionalSection}` : mainContent;
  ensureDirectoryExists(outputPath);
  writeFileSync(outputPath, fullContent, "utf-8");
}
function exportToClaudeCode(rules, outputPath, options) {
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  const alwaysApplyRules = filteredRules.filter((r) => r.metadata.alwaysApply !== false);
  const conditionalSection = generateConditionalRulesSection(filteredRules, dirname(outputPath));
  const mainContent = alwaysApplyRules.map((rule) => {
    const header = rule.metadata.description ? `# ${rule.metadata.description}

` : "";
    return header + rule.content;
  }).join("\n\n");
  const fullContent = conditionalSection ? `${mainContent}

${conditionalSection}` : mainContent;
  ensureDirectoryExists(outputPath);
  writeFileSync(outputPath, fullContent, "utf-8");
}
function exportToGemini(rules, outputPath, options) {
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  const content = filteredRules.map((rule) => {
    const header = rule.metadata.description ? `# ${rule.metadata.description}

` : "";
    return header + rule.content;
  }).join("\n\n");
  ensureDirectoryExists(outputPath);
  writeFileSync(outputPath, content, "utf-8");
}
function exportToQodo(rules, outputPath, options) {
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  const alwaysApplyRules = filteredRules.filter((r) => r.metadata.alwaysApply !== false);
  const conditionalSection = generateConditionalRulesSection(filteredRules, dirname(outputPath));
  const mainContent = alwaysApplyRules.map((rule) => {
    const header = rule.metadata.description ? `# ${rule.metadata.description}

` : "";
    return header + rule.content;
  }).join("\n\n---\n\n");
  const fullContent = conditionalSection ? `${mainContent}

---

${conditionalSection}` : mainContent;
  ensureDirectoryExists(outputPath);
  writeFileSync(outputPath, fullContent, "utf-8");
}
function exportToAmazonQ(rules, outputDir, options) {
  const rulesDir = join2(outputDir, ".amazonq", "rules");
  mkdirSync(rulesDir, { recursive: true });
  const filteredRules = rules.filter((rule) => !rule.metadata.private || options?.includePrivate);
  for (const rule of filteredRules) {
    let filePath;
    if (rule.metadata.id && rule.metadata.id.includes("/")) {
      const parts = rule.metadata.id.split("/");
      const fileName = parts.pop() + ".md";
      const subDir = join2(rulesDir, ...parts);
      mkdirSync(subDir, { recursive: true });
      filePath = join2(subDir, fileName);
    } else {
      const cleanId = rule.metadata.id?.startsWith("amazonq-") ? rule.metadata.id.substring(8) : rule.metadata.id || "rule";
      const filename = `${cleanId}.md`;
      filePath = join2(rulesDir, filename);
    }
    writeFileSync(filePath, rule.content, "utf-8");
  }
}
function exportAll(rules, repoPath, dryRun = false, options = { includePrivate: false }) {
  if (!dryRun) {
    exportToAgent(rules, repoPath, options);
    exportToCopilot(rules, join2(repoPath, ".github", "copilot-instructions.md"), options);
    exportToCursor(rules, repoPath, options);
    exportToCline(rules, join2(repoPath, ".clinerules"), options);
    exportToWindsurf(rules, join2(repoPath, ".windsurfrules"), options);
    exportToZed(rules, join2(repoPath, ".rules"), options);
    exportToCodex(rules, join2(repoPath, "AGENTS.md"), options);
    exportToAider(rules, join2(repoPath, "CONVENTIONS.md"), options);
    exportToClaudeCode(rules, join2(repoPath, "CLAUDE.md"), options);
    exportToGemini(rules, join2(repoPath, "GEMINI.md"), options);
    exportToQodo(rules, join2(repoPath, "best_practices.md"), options);
    exportToAmazonQ(rules, repoPath, options);
  }
}
function ensureDirectoryExists(filePath) {
  const dir = dirname(filePath);
  if (!existsSync2(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}
export {
  exportAll,
  exportToAgent,
  exportToAider,
  exportToAmazonQ,
  exportToClaudeCode,
  exportToCline,
  exportToCodex,
  exportToCopilot,
  exportToCursor,
  exportToGemini,
  exportToQodo,
  exportToWindsurf,
  exportToZed,
  importAgent,
  importAider,
  importAll,
  importAmazonQ,
  importClaudeCode,
  importCline,
  importCodex,
  importCopilot,
  importCursor,
  importCursorLegacy,
  importGemini,
  importQodo,
  importWindsurf,
  importZed,
  parseAgentMarkdown,
  parseFenceEncodedMarkdown,
  toAgentMarkdown
};
//# sourceMappingURL=index.js.map