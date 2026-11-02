import { Config } from "@remotion/cli/config";
import fs from "fs";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// This cloud container can't download Remotion's browser, so use the preinstalled headless shell.
const SHELL = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
if (fs.existsSync(SHELL)) Config.setBrowserExecutable(SHELL);
