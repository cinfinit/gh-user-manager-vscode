import * as vscode from 'vscode';

type InputStep = (input: MultiStepInput) => Thenable<void>;

export class MultiStepInput {
  private current?: vscode.QuickInput;

  async run(start: InputStep) {
    await start(this);
  }

  async showInputBox(options: vscode.InputBoxOptions): Promise<string | undefined> {
    return new Promise<string | undefined>((resolve) => {
      const input = vscode.window.createInputBox();
      this.current = input;

      Object.assign(input, options);

      input.onDidAccept(() => {
        resolve(input.value);
        input.dispose();
      });

      input.onDidHide(() => {
        resolve(undefined);
        input.dispose();
      });

      input.show();
    });
  }

  async showQuickPick(items: vscode.QuickPickItem[], options: vscode.QuickPickOptions): Promise<vscode.QuickPickItem | undefined> {
    return new Promise<vscode.QuickPickItem | undefined>((resolve) => {
      const quickPick = vscode.window.createQuickPick();
      this.current = quickPick;
      quickPick.items = items;
      Object.assign(quickPick, options);

      quickPick.onDidAccept(() => {
        resolve(quickPick.selectedItems[0]);
        quickPick.dispose();
      });

      quickPick.onDidHide(() => {
        resolve(undefined);
        quickPick.dispose();
      });

      quickPick.show();
    });
  }

  dispose() {
    this.current?.dispose();
  }
}
