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

## 常用命令备忘

```bash
pnpm add echarts              # 加图表库
pnpm add -D @types/node       # 需要 Node 类型时
pnpm dev --port 3000          # 换端口
```

## 注意

- **项目必须放在 F 盘**：pnpm 的 store 在 `F:\dev\pnpm-store`，硬链接不能跨盘，跨盘会退化成复制文件。
- Node 版本 `v24.21.0`，pnpm `12.11.2`。
