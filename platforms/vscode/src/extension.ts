import * as vscode from "vscode";

import { MemoryEditorProvider } from "./MemoryEditorProvider";

/** What a brand new diagram contains: one empty frame to build from. */
const emptyDiagram = {
  viewport: { x: 0, y: 0, zoom: 1 },
  options: {},
  klasses: {},
  steps: [
    {
      objects: {},
      variables: {},
      methodCalls: {
        "1": {
          name: "App.main",
          index: 0,
          localVariables: {},
          position: { x: 0, y: 0 },
        },
      },
    },
  ],
};

/**
 * The `.jmp` file the user is looking at.
 *
 * With a custom editor in front, there is no active *text* editor, so the tab
 * is what has to be asked. Falling back to the text editor covers the case of
 * a diagram opened as source.
 */
const activeDiagramUri = (): vscode.Uri | undefined => {
  const input = vscode.window.tabGroups.activeTabGroup.activeTab?.input;
  const fromTab =
    input instanceof vscode.TabInputCustom || input instanceof vscode.TabInputText
      ? input.uri
      : undefined;
  const uri = fromTab ?? vscode.window.activeTextEditor?.document.uri;
  return uri?.path.endsWith(".jmp") ? uri : undefined;
};

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      MemoryEditorProvider.viewType,
      new MemoryEditorProvider(context),
      {
        webviewOptions: { retainContextWhenHidden: true },
        supportsMultipleEditorsPerDocument: false,
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("jmp.new", async () => {
      const folder = vscode.workspace.workspaceFolders?.[0];
      if (!folder) {
        vscode.window.showErrorMessage(
          "Open a folder or workspace before creating a diagram.",
        );
        return;
      }

      const name = await vscode.window.showInputBox({
        prompt: "Name for the new diagram",
        placeHolder: "linked-list",
        validateInput: (value) => {
          if (!value) return "A name is required";
          if (!/^[a-zA-Z0-9 _-]+$/.test(value)) {
            return "Use letters, numbers, spaces, hyphens and underscores";
          }
          return null;
        },
      });
      if (!name) return;

      const uri = vscode.Uri.joinPath(folder.uri, `${name}.jmp`);
      try {
        await vscode.workspace.fs.stat(uri);
        vscode.window.showErrorMessage(`${name}.jmp already exists.`);
        return;
      } catch {
        // Does not exist yet, which is what we want.
      }

      await vscode.workspace.fs.writeFile(
        uri,
        Buffer.from(`${JSON.stringify(emptyDiagram, null, 2)}\n`, "utf8"),
      );
      await vscode.commands.executeCommand(
        "vscode.openWith",
        uri,
        MemoryEditorProvider.viewType,
      );
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("jmp.showSource", async () => {
      const uri = activeDiagramUri();
      if (!uri) {
        vscode.window.showErrorMessage("No .jmp file is open.");
        return;
      }
      await vscode.commands.executeCommand("vscode.openWith", uri, "default");
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("jmp.showDiagram", async () => {
      const uri = activeDiagramUri();
      if (!uri) {
        vscode.window.showErrorMessage("No .jmp file is open.");
        return;
      }
      await vscode.commands.executeCommand(
        "vscode.openWith",
        uri,
        MemoryEditorProvider.viewType,
      );
    }),
  );
}

export function deactivate() {}
