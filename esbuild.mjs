import * as esbuild from "esbuild";
import { copyFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";

const isWatch = process.argv.includes("--watch");

// Bundle the extension (Node.js, runs in VS Code host)
const extensionBuild = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node18",
  sourcemap: true,
};

// Bundle html-to-image for the webview (browser context)
const webviewLibBuild = {
  entryPoints: ["node_modules/html-to-image/lib/index.js"],
  bundle: true,
  outfile: "media/webview/html-to-image.min.js",
  format: "iife",
  globalName: "htmlToImage",
  platform: "browser",
  target: "es2020",
  minify: true,
};

if (isWatch) {
  const extCtx = await esbuild.context(extensionBuild);
  const webCtx = await esbuild.context(webviewLibBuild);
  await Promise.all([extCtx.watch(), webCtx.watch()]);
  console.log("Watching for changes...");
} else {
  await Promise.all([
    esbuild.build(extensionBuild),
    esbuild.build(webviewLibBuild),
  ]);
  console.log("Build complete.");
}
