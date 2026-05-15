"use strict";

import { readdirSync, existsSync } from "fs";
import { join } from "path";
import {
  Event,
  EventEmitter,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  Uri,
} from "vscode";
import { minimatch } from "minimatch";
import { getRoots, getIgnorePatterns, resolvePath } from "./util";

function isIgnored(folderPath: string, name: string, patterns: string[]): boolean {
  return patterns.some((pattern) =>
    pattern.includes("/")
      ? minimatch(folderPath, pattern, { dot: true })
      : minimatch(name, pattern, { dot: true })
  );
}

export interface ProjectItem {
  label: string;
  path: string;
  rootLabel: string;
}

export function getProjects(): ProjectItem[] {
  const projects: ProjectItem[] = [];

  for (const root of getRoots()) {
    const resolved = resolvePath(root);
    if (!existsSync(resolved)) {
      continue;
    }
    try {
      const ignorePatterns = getIgnorePatterns();
      const dirs = readdirSync(resolved, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .filter((d) => !isIgnored(join(resolved, d.name), d.name, ignorePatterns))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((d) => ({
          label: d.name,
          path: join(resolved, d.name),
          rootLabel: root,
        }));
      projects.push(...dirs);
    } catch {
      // skip inaccessible directories
    }
  }

  return projects;
}

interface RootNode {
  kind: "root";
  path: string;
  label: string;
}

interface ProjectNode {
  kind: "project";
  path: string;
  label: string;
}

type FolderNode = RootNode | ProjectNode;

export class FolderProjectsProvider implements TreeDataProvider<FolderNode> {
  private _onDidChangeTreeData = new EventEmitter<
    FolderNode | undefined | null | void
  >();
  readonly onDidChangeTreeData: Event<FolderNode | undefined | null | void> =
    this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: FolderNode): TreeItem {
    if (element.kind === "root") {
      const item = new TreeItem(
        element.label,
        TreeItemCollapsibleState.Expanded
      );
      item.iconPath = new ThemeIcon("folder-opened");
      item.tooltip = element.path;
      item.contextValue = "root";
      return item;
    }

    const item = new TreeItem(element.label, TreeItemCollapsibleState.None);
    item.iconPath = new ThemeIcon("folder");
    item.tooltip = element.path;
    item.resourceUri = Uri.file(element.path);
    item.command = {
      command: "folderProjects.openProject",
      title: "Open Project",
      arguments: [element.path],
    };
    item.contextValue = "project";
    return item;
  }

  getChildren(element?: FolderNode): FolderNode[] {
    if (!element) {
      return getRoots().map((root) => ({
        kind: "root" as const,
        path: resolvePath(root),
        label: root,
      }));
    }

    if (element.kind === "root") {
      if (!existsSync(element.path)) {
        return [];
      }
      try {
        const ignorePatterns = getIgnorePatterns();
        return readdirSync(element.path, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .filter((d) => !isIgnored(join(element.path, d.name), d.name, ignorePatterns))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((d) => ({
            kind: "project" as const,
            path: join(element.path, d.name),
            label: d.name,
          }));
      } catch {
        return [];
      }
    }

    return [];
  }
}
