"use strict";

import * as vscode from "vscode";
import { LicenseManager } from "@lucasprag/vscode-license";
import { FolderProjectsProvider, getProjects } from "./projects";
import { getRoots } from "./util";

const SANDBOX = {
  organizationId: "94b4a580-a66a-458c-9cfa-48c8d019f7e5",
  benefitId: "bdf7934a-a72f-4b7e-ad85-03299b555821",
  checkoutUrl: "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_jlnAI6qH8pQJxpjlGMHzL4NdazvqzFIY66fht4ZAao1/redirect",
};

const LIVE = {
  organizationId: "d2232643-dd19-4377-84a8-3c671011baa4",
  benefitId: "f481d7d7-1518-4572-ae0a-21a576c7fbd0",
  checkoutUrl: "https://buy.polar.sh/polar_cl_ibAYkhoQLRrkGwfysneBiYH0Cl3xceKB5olQv1skJjc",
};

export function activate(context: vscode.ExtensionContext) {
  const isDev = context.extensionMode === vscode.ExtensionMode.Development;
  const polar = isDev ? SANDBOX : LIVE;

  const license = new LicenseManager(context, {
    ...polar,
    sandbox: isDev,
    forcePopup: isDev,
    extensionName: "Folder Projects",
    commandPrefix: "folderProjects.license",
    gracePeriodDays: 14,
    reminderIntervalDays: 30,
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
