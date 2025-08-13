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
exports.addProfile = addProfile;
exports.listProfiles = listProfiles;
exports.switchProfile = switchProfile;
exports.deleteProfile = deleteProfile;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const configPath = path.join(os.homedir(), '.gh-user-manager-config.json');
function loadConfig() {
    if (!fs.existsSync(configPath)) {
        return { profiles: {}, current: null };
    }
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw);
}
function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
async function addProfile(options) {
    const { name, email, username, auth, token } = options;
    const config = loadConfig();
    if (config.profiles[name]) {
        throw new Error(`Profile "${name}" already exists.`);
    }
    config.profiles[name] = { name, email, username, auth, token: token || null };
    saveConfig(config);
}
function listProfiles() {
    return loadConfig();
}
async function switchProfile(name) {
    const config = loadConfig();
    const profile = config.profiles[name];
    if (!profile) {
        throw new Error(`Profile "${name}" not found.`);
    }
    if (process.platform === 'darwin') {
        try {
            while (true) {
                (0, child_process_1.execSync)('security delete-internet-password -s github.com', { stdio: 'ignore' });
            }
        }
        catch {
            // no more entries
        }
    }
    (0, child_process_1.execSync)(`git config --global user.name "${profile.username}"`);
    (0, child_process_1.execSync)(`git config --global user.email "${profile.email}"`);
    (0, child_process_1.execSync)(`git config --global credential.helper ""`);
    (0, child_process_1.execSync)(`git config --global credential.helper store`);
    if (profile.auth === 'https' && profile.token) {
        const cred = `https://${profile.username}:${profile.token}@github.com\n`;
        fs.writeFileSync(path.join(os.homedir(), '.git-credentials'), cred);
        (0, child_process_1.execSync)(`git config --global credential.helper store`);
    }
    config.current = name;
    saveConfig(config);
}
async function deleteProfile(name) {
    const config = loadConfig();
    if (!config.profiles[name]) {
        throw new Error(`Profile "${name}" not found.`);
    }
    delete config.profiles[name];
    if (config.current === name) {
        config.current = null;
    }
    saveConfig(config);
    if (process.platform === 'darwin') {
        try {
            while (true) {
                (0, child_process_1.execSync)('security delete-internet-password -s github.com', { stdio: 'ignore' });
            }
        }
        catch {
            // no more entries
        }
    }
}
//# sourceMappingURL=profile.js.map