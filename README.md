# Obsidian WeChat Publisher

将 Obsidian Markdown 笔记转换为适合微信公众号编辑器的 HTML，并将正文图片上传到微信素材服务器，最后推送到公众号草稿箱。

> 这是基于 [RanceLee/wechat-publisher](https://github.com/RanceLee233/wechat-publisher) 的本地修改构建版。仓库提供 Obsidian 可直接加载的编译产物，并非完整的 TypeScript 源码工程。

## 功能特点

- 在 Obsidian 中预览公众号排版效果。
- 将 Markdown 转换为带内联样式的微信兼容 HTML。
- 支持本地图片、Obsidian 图片嵌入、LaTeX 公式和 Mermaid 图。
- 上传正文图片和封面，创建或更新微信公众号草稿。
- 支持主题、字体、段落和图片质量等排版配置。
- 支持普通文章及插件原有的图片类内容流程。

## 本版本的兼容性优化

在上游版本基础上，本构建版针对实际公众号草稿效果做了以下调整：

- **高清公式**：公式先由 MathJax 渲染为 SVG，再按可配置倍率栅格化为 PNG，降低手机端公式模糊的问题。
- **行内公式尺寸**：保留公式的逻辑宽高，避免高分辨率图片在句子中被当成大图放大。
- **图片质量配置**：可调节公式渲染倍率和文章 JPEG 压缩质量，在清晰度与草稿体积之间取舍。
- **表格宽度**：根据各列文字量生成 `colgroup`，同时限制表格总宽度、允许单元格换行并适当缩小表格字号。
- **章节标题**：对文章中的一级章节标题使用微信兼容的居中包裹结构。
- **外部链接**：补充微信编辑器识别链接所需的属性；但链接是否可点击仍受公众号类型、微信客户端和平台审核规则限制。

这些调整用于提高草稿转换后的稳定性，并不能阻止微信编辑器或客户端再次改写 HTML。

## 运行要求

- Obsidian **1.5.0 或更高版本**
- Obsidian 桌面端；插件清单中的 `isDesktopOnly` 为 `true`
- 可访问微信公众号 API 的网络
- 已认证并具备相应接口权限的公众号
- 公众号 AppID、AppSecret，以及已配置的 API 调用 IP 白名单

## 安装方法

### 方法一：下载仓库文件

1. 下载本仓库。
2. 在你的 vault 中创建插件目录：

   ```text
   <vault>/.obsidian/plugins/wechat-publisher/
   ```

3. 将以下三个文件复制到该目录：

   ```text
   main.js
   manifest.json
   styles.css
   ```

4. 重启 Obsidian，或重新加载当前窗口。
5. 打开“设置 → 第三方插件”，启用 **WeChat Publisher**。

### 方法二：Git 克隆

在目标 vault 根目录执行：

```bash
git clone git@github.com:dltt1991/obsidian-wechat-publisher.git \
  .obsidian/plugins/wechat-publisher
```

然后重新加载 Obsidian 并启用插件。

> 仓库根目录还包含 README、LICENSE 和 Git 元数据，它们不会影响插件运行。

## 公众号配置

1. 登录[微信公众平台](https://mp.weixin.qq.com/)取得公众号的 AppID 和 AppSecret。
2. 在公众号后台将当前公网出口 IP 加入 API 调用 IP 白名单。
3. 打开 Obsidian 的 WeChat Publisher 设置页。
4. 新建或编辑公众号账号，填写 AppID、AppSecret、默认作者等信息。
5. 根据需要选择主题，并调整公式渲染倍率、JPEG 质量及其他排版参数。
6. 先使用预览功能检查标题、公式、图片和表格，再推送草稿。

如果出现 `invalid ip`、`invalid credential` 或获取 `access_token` 失败，优先检查 IP 白名单、AppID/AppSecret 和公众号接口权限。

## 使用方法

1. 在 Obsidian 中打开要发布的 Markdown 笔记。
2. 准备文章标题、正文和封面；需要时在 YAML frontmatter 中填写插件支持的文章信息。
3. 从命令面板运行 WeChat Publisher 的预览命令，检查排版结果。
4. 如需手工粘贴，可使用复制 HTML 功能。
5. 运行推送到微信公众号草稿箱的命令，选择账号、封面和样式配置。
6. 登录微信公众平台，在草稿箱中复核摘要、封面、链接、表格和公式。
7. 完成人工检查后，再由公众号后台正式发布。

建议始终在手机预览中检查一次。微信公众号可能对 HTML、外链和表格样式进行二次过滤，Obsidian 内的预览不能完全代替最终预览。

## 实现原理

整体流程可以概括为：

```text
Obsidian Markdown
      ↓
Obsidian 语法、公式、图表和图片预处理
      ↓
Markdown 转 HTML
      ↓
主题 CSS 内联
      ↓
微信兼容性修正
      ↓
正文图片上传到微信
      ↓
封面素材上传或复用
      ↓
创建或更新公众号草稿
```

### 1. Obsidian 入口与 Markdown 读取

插件入口向 Obsidian 注册设置页、预览视图和发布相关命令。执行命令时，插件读取当前活动笔记及其 YAML frontmatter，再把正文和文章元数据交给统一的 Markdown 处理流程。

这里分离“文章内容”和“发布配置”：正文决定最终 HTML，账号、作者、封面和草稿记录则参与微信 API 请求。

### 2. Obsidian 语法和公式预处理

微信公众号并不认识 Obsidian 的 Wiki 图片嵌入、LaTeX 或 Mermaid，因此这些内容必须在 Markdown 转换前后被替换：

- 本地图片和 `![[image.png]]` 会解析为 vault 中的真实文件。
- LaTeX 公式由 MathJax 生成 SVG，再通过 Canvas 转为 PNG。
- 渲染倍率只增加 PNG 的物理像素数；页面仍使用原始逻辑尺寸显示，因此行内公式不会随分辨率一起放大。
- Mermaid 图先生成 SVG，再转为公众号能够接收的图片。
- Callout、脚注、高亮等 Markdown 扩展会被转换为普通 HTML 结构。

公式和图表转成图片，是因为微信公众号编辑器不执行笔记里的 MathJax 或 Mermaid 脚本。

### 3. Markdown 转 HTML 与样式内联

预处理后的 Markdown 通过 Markdown/GFM 解析器生成 HTML。主题系统为标题、段落、引用、代码、表格和图片生成 CSS，随后使用 CSS 内联处理将样式写进每个元素的 `style` 属性。

这样做不是为了生成普通网页，而是为了适应微信公众号编辑器：编辑器通常不会保留独立样式表，却会保留一部分元素内联样式。

### 4. 微信兼容性修正

生成 HTML 后，插件还会处理微信编辑器容易改写的结构：

- 表格使用总宽度约束和按内容估算的列宽，并允许长文本换行。
- 行内公式使用源 SVG 的逻辑尺寸，而不是高分辨率 PNG 的像素尺寸。
- 章节标题用兼容性更好的块级结构实现居中。
- 外部链接补充 `href`、`target` 和微信识别属性。
- 图片被限制在正文可用宽度内，避免横向溢出。

微信仍可能在草稿保存、手机预览或发布时过滤部分属性，所以推送后必须人工复核。

### 5. 图片上传和草稿创建

发布阶段先使用 AppID 和 AppSecret 获取 `access_token`，然后执行以下操作：

1. 将正文中的本地图片、公式图和 Mermaid 图上传到微信正文图片接口。
2. 用微信返回的 CDN 地址替换 HTML 中的临时图片地址。
3. 上传或复用封面素材，取得草稿接口需要的 `thumb_media_id`。
4. 压缩和检查正文 HTML，避免超过接口允许的体积。
5. 调用微信草稿接口创建新草稿，或根据已有记录更新草稿。
6. 在本地保存必要的素材和草稿映射，减少重复上传。

也就是说，插件不是把 Obsidian 页面截图后发布，而是把 Markdown 重建为微信允许的 HTML，并单独托管其中的图片。

## 数据与安全

插件运行后可能在下列文件中保存本地账号配置和状态：

```text
<vault>/.obsidian/plugins/wechat-publisher/data.json
```

该文件可能包含 AppID、AppSecret、素材记录、草稿记录和其他账号信息：

- 不要将 `data.json` 提交到 Git。
- 不要把它发送给他人或放入公开网盘。
- 本仓库的 `.gitignore` 已排除该文件，但复制代码时仍应自行检查。
- 如果凭据曾经泄露，请立即在微信公众平台重置 AppSecret。
- 发布前检查当前仓库的暂存文件，不要依赖忽略规则代替人工确认。

## 已知限制

- 插件仅支持 Obsidian 桌面端。
- 当前仓库只有编译后的 `main.js`，不包含上游 TypeScript 源码和构建工程。
- 微信公众号会过滤或重写部分 HTML/CSS；表格列宽、外链点击和复杂排版无法由插件绝对控制。
- 某些外部链接在手机端不可点击，可能是微信平台策略或账号权限所致。
- 图片和 HTML 仍受微信接口大小限制；过高的公式倍率或 JPEG 质量会增加上传体积。
- 安装上游更新或重新安装插件可能覆盖本仓库定制的 `main.js`。

## 更新说明

本仓库发布的是本地验证过的构建产物。更新时应先备份当前三个插件文件，再比较新版本对公式、表格、标题和外链处理的变化。不要把旧版本的 `data.json` 上传到仓库；需要迁移账号时，应在可信设备上本地处理。

## 致谢与许可证

- 原项目：[RanceLee/wechat-publisher](https://github.com/RanceLee233/wechat-publisher)
- 原作者：[RanceLee](https://github.com/RanceLee233)
- 本仓库保留原项目作者信息，并记录本地公众号兼容性修改。
- 代码按照仓库中的 [MIT License](LICENSE) 发布，版权声明为 `Copyright (c) 2026 RanceLee`。
