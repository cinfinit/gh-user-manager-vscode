// import * as vscode from 'vscode';
// import * as fs from 'fs/promises';
// import * as os from 'os';
// import * as path from 'path';
// import { execSync } from 'child_process';

// const CONFIG_PATH = path.join(os.homedir(), '.gh-user-manager-config.json');

// interface Profile {
//   name: string;
//   email: string;
//   username: string;
//   auth: 'https' | 'ssh';
//   token?: string | null;
// }

// interface Config {
//   profiles: Record<string, Profile>;
//   current: string | null;
// }

// async function loadConfig(): Promise<Config> {
//   try {
//     const raw = await fs.readFile(CONFIG_PATH, 'utf8');
//     return JSON.parse(raw);
//   } catch {
//     return { profiles: {}, current: null };
//   }
// }

// async function saveConfig(config: Config) {
//   await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
// }

// async function addProfile(profile: Profile) {
//   const config = await loadConfig();

//   if (config.profiles[profile.name]) {
//     throw new Error(`Profile "${profile.name}" already exists.`);
//   }

//   config.profiles[profile.name] = profile;
//   await saveConfig(config);
// }

// async function listProfiles(): Promise<Profile[]> {
//   const config = await loadConfig();
//   return Object.values(config.profiles);
// }

// async function deleteProfile(name: string) {
//   const config = await loadConfig();

//   if (!config.profiles[name]) {
//     throw new Error(`Profile "${name}" not found.`);
//   }

//   delete config.profiles[name];
//   if (config.current === name) {
//     config.current = null;
//   }
//   await saveConfig(config);
// }

// async function clearGithubCredentialsMac() {
//   if (process.platform !== 'darwin') {
//     return;
//   }
//   const { exec } = await import('child_process');
//   return new Promise<void>((resolve) => {
//     const deleteCmd = 'security delete-internet-password -s github.com';
//     const child = exec(deleteCmd);
//     child.on('close', () => resolve());
//     child.on('error', () => resolve());
//   });
// }

// async function switchProfile(name: string) {
//   const config = await loadConfig();
//   const profile = config.profiles[name];
//   if (!profile) {
//     throw new Error(`Profile "${name}" not found.`);
//   }

//   await clearGithubCredentialsMac();

//   execSync(`git config --global user.name "${profile.username}"`);
//   execSync(`git config --global user.email "${profile.email}"`);
//   execSync(`git config --global credential.helper ""`);
//   execSync(`git config --global credential.helper store`);

//   if (profile.auth === 'https' && profile.token) {
//     const cred = `https://${profile.username}:${profile.token}@github.com\n`;
//     await fs.writeFile(path.join(os.homedir(), '.git-credentials'), cred);
//   }

//   config.current = name;
//   await saveConfig(config);
// }

// export function activate(context: vscode.ExtensionContext) {
//   context.subscriptions.push(
//     vscode.commands.registerCommand('ghUserManager.addProfile', async () => {
//       try {
//         const name = await vscode.window.showInputBox({ prompt: 'Profile name (e.g. work, personal)' });
//         if (!name) { return; }

//         const email = await vscode.window.showInputBox({ prompt: 'Email for Git commits' });
//         if (!email) { return; }

//         const username = await vscode.window.showInputBox({ prompt: 'GitHub username' });
//         if (!username) { return; }

//         const auth = await vscode.window.showQuickPick(['https', 'ssh'], { placeHolder: 'Auth method' });
//         if (!auth) { return; }

//         let token: string | undefined = undefined;
//         if (auth === 'https') {
//           token = await vscode.window.showInputBox({ prompt: 'GitHub Personal Access Token (hidden)', password: true });
//         }

//         await addProfile({ name, email, username, auth: auth as 'https' | 'ssh', token: token || null });
//         vscode.window.showInformationMessage(`Profile "${name}" added.`);
//       } catch (e: any) {
//         vscode.window.showErrorMessage(`Failed to add profile: ${e.message}`);
//       }
//     }),

//     vscode.commands.registerCommand('ghUserManager.switchProfile', async () => {
//       try {
//         const profiles = await listProfiles();
//         if (profiles.length === 0) {
//           vscode.window.showInformationMessage('No profiles saved.');
//           return;
//         }
//         const picked = await vscode.window.showQuickPick(profiles.map(p => p.name), { placeHolder: 'Select profile to switch' });
//         if (!picked) { return; }
//         await switchProfile(picked);
//         vscode.window.showInformationMessage(`Switched to profile "${picked}".`);
//       } catch (e: any) {
//         vscode.window.showErrorMessage(`Failed to switch profile: ${e.message}`);
//       }
//     }),

//     vscode.commands.registerCommand('ghUserManager.listProfiles', async () => {
//       try {
//         const profiles = await listProfiles();
//         if (profiles.length === 0) {
//           vscode.window.showInformationMessage('No profiles saved.');
//           return;
//         }
//         const list = profiles.map(p => `${p.name} (${p.email})`).join('\n');
//         vscode.window.showInformationMessage(`Saved profiles:\n${list}`);
//       } catch (e: any) {
//         vscode.window.showErrorMessage(`Failed to list profiles: ${e.message}`);
//       }
//     }),

//     vscode.commands.registerCommand('ghUserManager.deleteProfile', async () => {
//       try {
//         const profiles = await listProfiles();
//         if (profiles.length === 0) {
//           vscode.window.showInformationMessage('No profiles saved.');
//           return;
//         }
//         const picked = await vscode.window.showQuickPick(profiles.map(p => p.name), { placeHolder: 'Select profile to delete' });
//         if (!picked) { return; }
//         await deleteProfile(picked);
//         vscode.window.showInformationMessage(`Deleted profile "${picked}".`);
//       } catch (e: any) {
//         vscode.window.showErrorMessage(`Failed to delete profile: ${e.message}`);
//       }
//     }),
//   );
// }

// export function deactivate() {}



import * as vscode from 'vscode';
import { MultiStepInput } from './multiStepInput';
import { addProfile, switchProfile, listProfiles, deleteProfile } from './profile';

export function activate(context: vscode.ExtensionContext) {
  console.log('🎉 GitHub User Manager extension activated');

  // Add Profile with multi-step input
  context.subscriptions.push(
    vscode.commands.registerCommand('ghUserManager.addProfile', async () => {
      await collectProfileInfo();
    })
  );

  // Other commands remain simple
  context.subscriptions.push(
    vscode.commands.registerCommand('ghUserManager.switchProfile', async () => {
      const config = listProfiles();
      const items = Object.keys(config.profiles).map(name => ({
        label: name,
        description: config.profiles[name].email
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a profile to switch',
        ignoreFocusOut: true
      });

      if (selected) {
        await switchProfile(selected.label);
        vscode.window.showInformationMessage(`Switched to "${selected.label}"`);
      }
    })
  );

//   context.subscriptions.push(
//     vscode.commands.registerCommand('ghUserManager.listProfiles', () => {
//       const config = listProfiles();
//       const profiles = Object.entries(config.profiles);
//       if (profiles.length === 0) {
//         vscode.window.showInformationMessage('No profiles saved.');
//       } else {
//         const current = config.current || 'None';
//         const list = profiles.map(([name, p]) => `${name} (${p.email})${name === current ? ' (current)' : ''}`).join('\n');
//         vscode.window.showInformationMessage(`Saved profiles:\n${list}`);
//       }
//     })
//   );

// context.subscriptions.push(
// 	vscode.commands.registerCommand('ghUserManager.listProfiles', async () => {
// 	  const config = listProfiles();
// 	  const profiles = config.profiles;
// 	  const current = config.current;
  
// 	  if (Object.keys(profiles).length === 0) {
// 		vscode.window.showInformationMessage('No profiles saved.');
// 		return;
// 	  }
  
// 	  const items: vscode.QuickPickItem[] = Object.entries(profiles).map(([name, profile]) => ({
// 		label: `${name}${name === current ? ' 🔹 (current)' : ''}`,
// 		description: `${profile.email} — ${profile.auth.toUpperCase()}`
// 	  }));
  
// 	  await vscode.window.showQuickPick(items, {
// 		title: 'Saved GitHub Profiles',
// 		placeHolder: 'Your configured GitHub user profiles',
// 		canPickMany: false,
// 		ignoreFocusOut: true
// 	  });
// 	})
//   );
  
context.subscriptions.push(
	vscode.commands.registerCommand('ghUserManager.listProfiles', async () => {
	  const config = listProfiles();
	  const profiles = config.profiles;
	  const current = config.current;
  
	  if (Object.keys(profiles).length === 0) {
		vscode.window.showInformationMessage('No profiles saved.');
		return;
	  }
  
	  const items: vscode.QuickPickItem[] = Object.entries(profiles).map(([name, profile]) => ({
		label: `${name}${name === current ? ' 🔹 (current)' : ''}`,
		description: `${profile.email} — ${profile.auth.toUpperCase()}`,
		detail: `GitHub Username: ${profile.username}`
	  }));
  
	  const selected = await vscode.window.showQuickPick(items, {
		title: 'Saved GitHub Profiles',
		placeHolder: 'Select a profile to view details',
		canPickMany: false,
		ignoreFocusOut: true
	  });
  
	  if (selected) {
		// Find the actual profile object
		const profileName = selected.label.replace(' 🔹 (current)', '');
		const profile = profiles[profileName];
  
		vscode.window.showInformationMessage(
		  `📄 Profile: ${profileName}\n` +
		  `👤 GitHub Username: ${profile.username}\n` +
		  `📧 Email: ${profile.email}\n` +
		  `🔐 Auth Method: ${profile.auth.toUpperCase()}\n` +
		  `${profileName === current ? '⭐ This is your current profile.' : ''}`
		);
	  }
	})
  );
  
  context.subscriptions.push(
    vscode.commands.registerCommand('ghUserManager.deleteProfile', async () => {
      const config = listProfiles();
      const items = Object.keys(config.profiles).map(name => ({
        label: name,
        description: config.profiles[name].email
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a profile to delete',
        ignoreFocusOut: true
      });

      if (selected) {
        await deleteProfile(selected.label);
        vscode.window.showInformationMessage(`Deleted profile "${selected.label}"`);
      }
    })
  );
}

async function collectProfileInfo() {
	const input = new MultiStepInput();
  
	let name = '';
	let email = '';
	let username = '';
	let auth: 'https' | 'ssh' = 'https';
	let token: string | undefined;
  
	try {
	  await input.run(async (input) => {
		name = (await input.showInputBox({
		  title: 'Add GitHub Profile (Step 1/5)',
		  prompt: 'Enter profile name (e.g. work, personal)',
		  ignoreFocusOut: true,
		})) || '';
		if (!name) throw new Error('Cancelled');
  
		email = (await input.showInputBox({
		  title: 'Add GitHub Profile (Step 2/5)',
		  prompt: 'Enter email for Git commits',
		  ignoreFocusOut: true,
		})) || '';
		if (!email) throw new Error('Cancelled');
  
		username = (await input.showInputBox({
		  title: 'Add GitHub Profile (Step 3/5)',
		  prompt: 'Enter GitHub username',
		  ignoreFocusOut: true,
		})) || '';
		if (!username) throw new Error('Cancelled');
  
		const authPick = await input.showQuickPick(
		  [
			{ label: 'https', description: 'Use HTTPS and token' },
			{ label: 'ssh', description: 'Use SSH keys' },
		  ],
		  {
			title: 'Add GitHub Profile (Step 4/5)',
			placeHolder: 'Choose authentication method',
			ignoreFocusOut: true,
		  }
		);
  
		if (!authPick) throw new Error('Cancelled');
		auth = authPick.label as 'https' | 'ssh';
  
		if (auth === 'https') {
		  token = await input.showInputBox({
			title: 'Add GitHub Profile (Step 5/5)',
			prompt: 'Enter Personal Access Token (hidden)',
			password: true,
			ignoreFocusOut: true,
		  });
		}
	  });
	} catch {
	  vscode.window.showWarningMessage('Profile creation cancelled or incomplete.');
	  return;
	}
  
	if (!name || !email || !username) {
	  vscode.window.showWarningMessage('Profile creation incomplete.');
	  return;
	}
  
	await addProfile({ name, email, username, auth, token: token || null });
	vscode.window.showInformationMessage(`Profile "${name}" added.`);
  }
  

export function deactivate() {}
