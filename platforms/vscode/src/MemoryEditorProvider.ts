import * as vscode from "vscode";

/**
 * The custom editor behind `.jmp` files.
 *
 * A `.jmp` file is the same JSON the playground puts in a URL, so the document
 * stays the single source of truth: every edit in the webview is written
 * straight into it, which is what makes VS Code's own dirty marker, its undo
 * stack and plain Ctrl+S work without the extension implementing any of them.
 */
export class MemoryEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = "jmp.editor";

  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    const post = (message: unknown) => webviewPanel.webview.postMessage(message);

    /**
     * The text this editor last wrote itself.
     *
     * A change event carrying it is our own edit coming back around, and
     * reloading the webview from it would throw away the user's undo history
     * and whatever they had selected mid-drag.
     */
    let ownEdit: string | null = null;

    /** Resolves the pending flush when the webview answers one. */
    let resolveFlush: ((text: string | null) => void) | null = null;

    const serialize = (memory: unknown) => `${JSON.stringify(memory, null, 2)}\n`;

    const writeToDocument = async (memory: unknown) => {
      const text = serialize(memory);
      if (document.getText() === text) return;

      ownEdit = text;
      const edit = new vscode.WorkspaceEdit();
      edit.replace(
        document.uri,
        new vscode.Range(0, 0, document.lineCount, 0),
        text,
      );
      await vscode.workspace.applyEdit(edit);
    };

    /**
     * The webview's latest diagram, whether or not its debounce has fired.
     *
     * Saving has to catch the keystroke from a moment ago, so the save waits
     * for an answer rather than hoping one arrives — and gives up after a
     * moment rather than blocking the save if the webview is wedged.
     */
    const flush = () =>
      new Promise<string | null>((resolve) => {
        const timer = setTimeout(() => {
          resolveFlush = null;
          resolve(null);
        }, 500);
        resolveFlush = (text) => {
          clearTimeout(timer);
          resolveFlush = null;
          resolve(text);
        };
        post({ type: "flush" });
      });

    const changeSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() !== document.uri.toString()) return;
      if (e.contentChanges.length === 0) return;

      if (e.document.getText() === ownEdit) {
        ownEdit = null;
        return;
      }
      ownEdit = null;
      post({ type: "update", content: e.document.getText() });
    });

    // Returning the edit from `waitUntil` is how VS Code wants a document
    // amended on the way to disk; applying one from here would race the save.
    const willSaveSubscription = vscode.workspace.onWillSaveTextDocument((e) => {
      if (e.document.uri.toString() !== document.uri.toString()) return;

      e.waitUntil(
        flush().then((text) => {
          if (text === null || text === document.getText()) return [];
          ownEdit = text;
          return [
            vscode.TextEdit.replace(
              new vscode.Range(0, 0, document.lineCount, 0),
              text,
            ),
          ];
        }),
      );
    });

    const messageSubscription = webviewPanel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case "ready":
            post({ type: "update", content: document.getText() });
            return;
          case "edit":
            await writeToDocument(message.content);
            return;
          case "save":
            // The playground's own Save button. VS Code owns saving, so it
            // writes the diagram and then asks VS Code to do exactly what
            // Ctrl+S does.
            await writeToDocument(message.content);
            await document.save();
            return;
          case "flushed":
            resolveFlush?.(serialize(message.content));
            return;
        }
      },
    );

    webviewPanel.onDidDispose(() => {
      changeSubscription.dispose();
      willSaveSubscription.dispose();
      messageSubscription.dispose();
      resolveFlush?.(null);
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview.js"),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview.css"),
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:; font-src ${webview.cspSource} data:;">
  <link href="${styleUri}" rel="stylesheet">
  <title>Java Memory Playground</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    #root {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  const array = new Uint32Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 0xffffffff);
    }
  }
  return Array.from(array, (num) => num.toString(16).padStart(8, "0")).join("");
}
