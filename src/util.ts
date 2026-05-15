"use strict";

import { homedir } from "os";
import { resolve } from "path";
import { workspace } from "vscode";

export function resolvePath(p: string): string {
  p = p.replace(/^~/, homedir());
  p = p.replace(/\$\{HOME\}/g, homedir());
  p = p.replace(/\$([A-Z_][A-Z0-9_]*)/g, (_, name) => process.env[name] ?? _);
  return resolve(p);
}

export function getRoots(): string[] {
  return workspace.getConfiguration().get<string[]>("folderprojects.roots") ?? [];
}

export function getIgnorePatterns(): string[] {
  return workspace.getConfiguration().get<string[]>("folderprojects.ignore") ?? [];
}
