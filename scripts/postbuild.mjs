import { copyFileSync } from "node:fs";

// SPA 回退：EdgeOne Pages 用 404.html 兜底，内容与 index.html 一致
copyFileSync("dist/index.html", "dist/404.html");
console.log("[postbuild] dist/404.html generated");
