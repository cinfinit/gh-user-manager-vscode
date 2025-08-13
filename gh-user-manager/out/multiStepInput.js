"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiStepInput = void 0;
const vscode = __importStar(require("vscode"));
class MultiStepInput {
    current;
    async run(start) {
        await start(this);
    }
    async showInputBox(options) {
        return new Promise((resolve) => {
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
    async showQuickPick(items, options) {
        return new Promise((resolve) => {
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
exports.MultiStepInput = MultiStepInput;
//# sourceMappingURL=multiStepInput.js.map