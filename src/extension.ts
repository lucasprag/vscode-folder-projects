"use strict";

import * as vscode from "vscode";
import { LicenseManager } from "@lucasprag/vscode-license";
import { FolderProjectsProvider, getProjects } from "./projects";
import { getRoots } from "./util";

const STORE_ID = 0;           // TODO: Lemon Squeezy store ID
const PRODUCT_ID = 0;         // TODO: Folder Projects product ID
const BUNDLE_PRODUCT_ID = 0;  // TODO: lucasprag bundle product ID
const CHECKOUT_URL = "";      // TODO: Lemon Squeezy checkout URL

export function activate(context: vscode.ExtensionContext) {
  const license = new LicenseManager(context, {
    storeId: STORE_ID,
    productIds: [PRODUCT_ID, BUNDLE_PRODUCT_ID],
    extensionName: "Folder Projects",
    checkoutUrl: CHECKOUT_URL,
    commandPrefix: "folderProjects.license",
    gracePeriodDays: 7,
    reminderIntervalDays: 3,
  });

  license.initialize();

  const provider = new FolderProjectsProvider();

  const view = vscode.window.createTreeView("folderprojects", {
    treeDataProvider: provider,
    showCollapseAll: true,
  });

  context.subscriptions.push(
    view,
    vscode.commands.registerCommand("folderProjects.listProjectsToOpen", listProjectsToOpen),
    vscode.commands.registerCommand("folderProjects.openSettings", openSettings),
    vscode.commands.registerCommand("folderProjects.refresh", () => provider.refresh()),
    vscode.commands.registerCommand("folderProjects.openProject", (path: string) => {
      vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(path));
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("folderprojects")) {
        provider.refresh();
      }
    })
  );

  if (getRoots().length === 0) {
    vscode.window
      .showInformationMessage(
        "Folder Projects: No root directories configured.",
        "Open Settings"
      )
      .then((sel) => {
        if (sel) {
          openSettings();
        }
      });
  }
}

async function listProjectsToOpen() {
  const projects = getProjects();

  if (projects.length === 0) {
    vscode.window
      .showInformationMessage(
        "Folder Projects: No projects found. Add root directories in settings.",
        "Open Settings"
      )
      .then((sel) => {
        if (sel) {
          openSettings();
        }
      });
    return;
  }

  const pick = await vscode.window.showQuickPick(
    projects.map((p) => ({
      label: p.label,
      description: p.rootLabel,
      detail: p.path,
    })),
    { placeHolder: "Select a project to open..." }
  );

  if (pick) {
    vscode.commands.executeCommand(
      "vscode.openFolder",
      vscode.Uri.file(pick.detail)
    );
  }
}

function openSettings() {
  vscode.commands.executeCommand(
    "workbench.action.openSettings",
    "folderprojects"
  );
}

export function deactivate() {}
