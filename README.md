# Admin Starter

前端复出练手的后台管理骨架。**Vite + Vue 3 + TypeScript + Element Plus + Vue Router + Pinia + Axios + Sass**

## 跑起来

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # 打包到 dist/
pnpm type-check   # 只做类型检查
```

登录页随便填都能进（是假登录），进去之后能看到后台布局。

## 目录结构

```
src/
├── api/              放接口定义（还没建，你自己加）
├── layouts/
│   └── BasicLayout.vue   后台整体布局：侧边栏 + 顶栏 + 内容区
├── router/
│   └── index.ts      路由表 + 登录守卫
├── stores/
│   └── user.ts       Pinia：token 和用户信息
├── styles/
│   └── index.scss    全局样式
├── utils/
│   └── request.ts    Axios 封装（拦截器）
├── views/
│   ├── HomeView.vue      首页
│   ├── LoginView.vue     登录页
│   └── NotFoundView.vue  404
├── App.vue
└── main.ts
```

## 已经接好的基础设施

- 路径别名 `@` → `src/`
- Element Plus 全量引入 + **中文语言包**
- Axios 实例 + 请求/响应拦截器（token 自动带上）
- 开发代理：`/api/*` → `http://localhost:3000`（见 `vite.config.ts`）
- 路由守卫：没 token 自动跳登录页，并记住原地址
- 环境变量：`.env.development` / `.env.production`

## 你接下来要做的（按顺序）

1. **换成真登录**：把 `LoginView.vue` 里那段假登录替换成 `request({ url: '/auth/login', ... })`
2. **补拦截器逻辑**：`utils/request.ts` 里的两个 TODO —— 业务码判断 + 401 跳登录
3. **加第一个业务页面**：在 `router/index.ts` 的 children 里加路由，在 `views/` 建页面
4. **加菜单**：在 `BasicLayout.vue` 里加对应的 `el-menu-item`
5. **写列表页**：表格 + 分页 + 搜索 + 新增/编辑弹窗（B 端最核心的一页）
6. **加数据看板**：装 `echarts`，做一张统计图

## 部署上线（Vercel）

线上地址：https://admin-starter-ten.vercel.app/

| 配置项 | 值 |
|---|---|
| 平台 | Vercel（GitHub 账号直接登录 → Import `GDYY/admin-starter`） |
| Build Command | `pnpm build` |
| Output Directory | `dist` |
| Node 版本 | 平台默认 22.x（`vite 8` 要求 `^20.19.0 \|\| >=22.12.0`，正好满足，无需额外配置） |

**`vercel.json` 必须留着**：路由用的是 `createWebHistory`（history 模式），Vercel 默认只按真实文件路径找资源，直接访问 `/inspect-item` 会 404。文件里的 `rewrites` 把所有路径回退到 `index.html`，交给前端路由处理。

**上线后必做的验证**：点进「点检项」或「设备台账」→ 按 F5 → 必须正常显示，不能出现 Vercel 的 404 页面。这一步过不了，说明 `vercel.json` 没生效。

**备用平台**（Vercel 打不开或访问慢时换）：

- **Cloudflare Pages**：Build command `pnpm build`，输出目录 `dist`；SPA 回退用根目录 `_redirects` 文件，内容 `/* /index.html 200`
- **Netlify**：发布目录 `dist`；SPA 回退同样用根目录 `_redirects` 文件，内容 `/* /index.html 200`

**线上版本的已知行为**（面试被问到时照实说）：

- 前端演示项目，**没有后端**，`api` 层直接操作内存假数据
- 新增/修改的数据在**当前页面会话内有效**，**刷新后重置为初始假数据** —— 这是预期行为，不是 bug
- 部署上去的只有前端静态文件；`vite.config.ts` 里的 `/api` 开发代理在生产环境不存在（目前也没用到）

## 常用命令备忘

```bash
pnpm add echarts              # 加图表库
pnpm add -D @types/node       # 需要 Node 类型时
pnpm dev --port 3000          # 换端口
pnpm preview                  # 本地预览 dist 产物（上线前先自测一遍）
```

## 注意

- **项目必须放在 F 盘**：pnpm 的 store 在 `F:\dev\pnpm-store`，硬链接不能跨盘，跨盘会退化成复制文件。
- Node 版本 `v24.21.0`，pnpm `12.11.2`。
