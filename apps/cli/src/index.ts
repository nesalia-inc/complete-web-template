#!/usr/bin/env node

import { login, status, logout } from "./commands/auth.js";

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case "auth":
      const subCommand = args[1];
      switch (subCommand) {
        case "login":
          await login();
          break;
        case "status":
          await status();
          break;
        case "logout":
          await logout();
          break;
        default:
          console.log(`Unknown subcommand: ${subCommand}`);
          break;
      }
      break;
    case "--version":
    case "-v":
      console.log("@complete-web-template/cli v1.0.0");
      break;
    default:
      console.log(`
@complete-web-template/cli v1.0.0

Usage:
  cli auth login      Login via device authorization
  cli auth status     Check authentication status
  cli auth logout     Logout and clear credentials
`);
      break;
  }
}

main().catch(console.error);