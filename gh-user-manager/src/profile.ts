import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const configPath = path.join(os.homedir(), '.gh-user-manager-config.json');

interface Profile {
  name: string;
  email: string;
  username: string;
  auth: 'https' | 'ssh';
  token: string | null;
}

interface Config {
  profiles: Record<string, Profile>;
  current: string | null;
}

function loadConfig(): Config {
  if (!fs.existsSync(configPath)) {
    return { profiles: {}, current: null };
  }
  const raw = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(raw);
}

function saveConfig(config: Config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export async function addProfile(options: {
  name: string;
  email: string;
  username: string;
  auth: 'https' | 'ssh';
  token?: string | null;
}) {
  const { name, email, username, auth, token } = options;
  const config = loadConfig();

  if (config.profiles[name]) {
    throw new Error(`Profile "${name}" already exists.`);
  }

  config.profiles[name] = { name, email, username, auth, token: token || null };
  saveConfig(config);
}

export function listProfiles(): Config {
  return loadConfig();
}

export async function switchProfile(name: string) {
  const config = loadConfig();
  const profile = config.profiles[name];

  if (!profile) {
    throw new Error(`Profile "${name}" not found.`);
  }

  if (process.platform === 'darwin') {
    try {
      while (true) {
        execSync('security delete-internet-password -s github.com', { stdio: 'ignore' });
      }
    } catch {
      // no more entries
    }
  }

  execSync(`git config --global user.name "${profile.username}"`);
  execSync(`git config --global user.email "${profile.email}"`);
  execSync(`git config --global credential.helper ""`);
  execSync(`git config --global credential.helper store`);

  if (profile.auth === 'https' && profile.token) {
    const cred = `https://${profile.username}:${profile.token}@github.com\n`;
    fs.writeFileSync(path.join(os.homedir(), '.git-credentials'), cred);
    execSync(`git config --global credential.helper store`);
  }

  config.current = name;
  saveConfig(config);
}

export async function deleteProfile(name: string) {
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
        execSync('security delete-internet-password -s github.com', { stdio: 'ignore' });
      }
    } catch {
      // no more entries
    }
  }
}
