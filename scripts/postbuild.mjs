import { copyFileSync, writeFileSync } from "node:fs";

// SPA 回退：GitHub Pages / EdgeOne Pages 用 404.html 兜底，内容与 index.html 一致
copyFileSync("dist/index.html", "dist/404.html");

// GitHub Pages 默认走 Jekyll，会忽略以 _ 开头的文件（如 _plugin-vue_export-helper-*.js）。
// 放一个 .nojekyll 空文件即关闭 Jekyll 处理，静态资源原样发布。
writeFileSync("dist/.nojekyll", "");

console.log("[postbuild] dist/404.html generated, .nojekyll written");
