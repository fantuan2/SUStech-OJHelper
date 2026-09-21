# OJHelper

面向 [Hydro](https://github.com/hydro-dev/Hydro) OJ 的浏览器扩展（Chrome Manifest V3），提供**代码规范化**与**比赛辅助**功能。

其实是被每次都要手动把本地的代码手动修改类名烦到的计算机新生的vibe coding玩具，大家看个乐就好。

默认支持 **SUSTech OJ**（`https://acm.sustech.edu.cn`），其他 Hydro 站点可在明确风险提示后按站点启用（Beta，但为什么是beta呢？因为据说这是宇宙免责声明，当然以后也不会拿掉beta的）。

English version: [README.en.md](README.en.md)

## 功能

### 代码规范化

- 在题目递交页 / 在线编程 编辑器中注入「规范化」按钮，一键整理代码。
- **Java**
  - 将包含 `main` 方法的主类重命名为 `Main`（类名与构造器同步替换）。
  - 统一 `main` 方法签名。
  - 删除 `package` 声明、移除 BOM。
  - 可选：去除 `//` 与 `/* */` 注释。
- **C/C++**：已注册占位，暂未实现规范化。
  - 为什么没有写呢？因为我不会啊，所以我也不用，所以我不知道是什么情况（

### 比赛辅助

- **比赛倒计时横幅**：在首页与比赛列表显示最近一场未结束比赛的开始/结束时间与实时倒计时。
- **继续比赛**：首页显示「继续比赛」按钮，自动定位到**最快结束的进行中比赛**里**第一道未通过的题目**；若没有进行中的比赛或已全部通过，则置灰显示。
- **上一题 / 下一题**：在比赛题目页按内置题号导航条快速切换。
- **定位到我**：在榜单页一键滚动并高亮自己的行。

## 安装

1. 打开浏览器扩展管理页面，开启「开发者模式」。
2. 点击「加载已解压的扩展程序」，选择最新release（含 `manifest.json`）。
3. SUSTech OJ 直接可用；访问其他 Hydro 站点时，点击扩展图标按提示启用。

> 需要 Chrome 111+（依赖 `chrome.scripting.registerContentScripts`）。

## 其他 Hydro 站点（Beta）

非 SUSTech 站点为 **Beta** 支持，可能与站点已有脚本/样式冲突。启用流程：

1. 打开目标 Hydro 站点，点击工具栏扩展图标。
2. 若识别为 Hydro 且未启用，点击「启用此站点…」。
3. 在独立免责窗口中阅读风险、勾选确认，等待 5 秒倒计时结束后点击启用。
4. 刷新该 OJ 页面生效。

已启用站点可在扩展设置页（`options`）的「已启用的 OJ 站点」区块中查看或移除。SUSTech 的OJ为默认启用，不可移除。

## 设置

- **扩展设置页**：点击扩展图标 → 「打开设置」，或右键扩展 →「选项」。
- **站点内设置面板**：在 Hydro 的 `home/settings/preference` 页面内嵌显示。

可配置项：代码通用（去除注释）、比赛倒计时开关、继续比赛按钮开关，以及各语言（如 Java 主类名、main 签名）参数。

## 项目结构

```
manifest.json                 扩展清单（MV3）
icons/                        图标
src/
  background.js               Service Worker：按站点动态注册内容脚本
  popup/                      工具栏弹窗：站点状态与启用入口
  disclaimer/                 高强度免责窗口（Beta 站点启用前）
  options/                    扩展设置页
  lib/
    core.js                   语言模块注册表 + 代码工具
    hydro.js                  运行时 Hydro 指纹检测（OJHDetect）
    registry.js               脚本定义与默认站点单一来源（OJHScripts）
    i18n.js                   中英文文案
    settings.js               设置读写与迁移
    settings-ui.js            设置界面构建
    contest-util.js           比赛解析与导航纯函数
    langs/                    语言模块（java、cc）
  content/                    内容脚本（注入页面）
test/                         Node 单元测试
```

## 工作原理

- **默认站点**（SUSTech）通过 `manifest.json` 的 `content_scripts` 静态注入。
- **其他站点**在用户授权后，由 `background.js` 使用 `chrome.scripting.registerContentScripts` 按 origin 动态注册（匹配 `origin/d/*`）。
- 所有内容脚本在初始化前调用 `OJHDetect.isHydro()` 进行运行时指纹校验（`window.Hydro` 或 Hydro 主题 DOM 特征），确保仅在真正的 Hydro 页面运行。

## 开发

无构建步骤，纯原生 JavaScript。运行测试：

```powershell
node test/normalize.test.js
node test/settings.test.js
node test/i18n.test.js
node test/contest-util.test.js
node test/hydro-detect.test.js
```

## 权限说明

| 权限                        | 用途                                         |
| --------------------------- | -------------------------------------------- |
| `storage`                   | 保存扩展设置                                 |
| `scripting`                 | 为已授权的非默认站点动态注册内容脚本         |
| `activeTab`                 | 在用户点击扩展图标时识别当前站点是否为 Hydro |
| `host_permissions`          | 默认站点 `acm.sustech.edu.cn`                |
| `optional_host_permissions` | 其他 Hydro 站点，按站点授权                  |

## 免责声明

扩展为自用程序，未经过充分测试，可能与站点已有功能冲突，改写后的代码未必符合站点的提交要求。使用本扩展所造成的一切后果由使用者自行承担。

本工具与南方科技大学及其下属任何部门没有任何直接关系。

本工具跟SVcode氛围编程社没有任何直接关系。

## 许可证

本项目按照MIT协议开源，希望我能因此读上MIT（想peach）



## 私货

悄悄宣传下SVcode氛围编程社，这是面向南方科技大学vibe coding开发者，以及任何对vibe coding感兴趣的同学的社团。

欢迎有好点子的同学的加入，一起学习，试错和创造。
