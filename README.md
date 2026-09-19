# 等等贝贝吧

一款原生 JavaScript + Canvas 2D 的高清横版追逐跑酷游戏，可作为静态站点部署到 GitHub Pages。玩家操控董贝贝穿越校园入口、篮球场、银杏林路、湖畔施工区与黄昏天桥，追赶由独立 AI 控制的孟培杰。

## 游玩方式

- 自动前进；A / ← 减速并回头，D / → 消耗能量冲刺。
- 空格 / W / ↑ 或点击游戏画面跳跃；支持二段跳。
- 拾取能量补充冲刺；金币缩短距离；触碰篮球会自动踢向前方。香蕉、横风、巡逻障碍、施工箱、移动挡板、塌陷平台和弹簧需要不同应对。
- 主旅程是一张连续长地图；主页另可选择五个区域章节。赢下章节会解锁下一章，进度保存在当前设备浏览器中。
- 追上窗口在 85% 进度开启，但不是自动胜利；要在实际间距缩至 56px 内时才算追上。掉坑可从检查点继续；落后过远或到终点仍未追上会失败。

## 本地运行与测试

项目不需要安装依赖或构建。使用 Python 启动静态服务器：

```powershell
python -m http.server 4173
```

浏览器打开 `http://127.0.0.1:4173`。运行测试和路线模拟：

```powershell
node --test
node tools/level-bot.mjs
```

## 技术与素材

- 原生 HTML、CSS、JavaScript ES modules、Canvas 2D；无框架和打包流程。
- 画布逻辑尺寸 1280×540；固定步长默认 60 FPS，性能压力下自动降至 30 FPS。
- 五张区域高清背景优先使用 WebP，并按区域懒加载；PNG 作为回退。角色与道具使用本地图片资源，游戏音效由 Web Audio 本地合成。
- 仅包含根据参考制作的游戏素材，不包含用户提供的原始照片；无账号、服务器或云存档。

## GitHub Pages

本项目仓库为 `Icarus122/deng-deng-beibei`。如尚未配置 Pages，在 GitHub 仓库进入 **Settings → Pages**，选择 **Deploy from a branch**，来源设为 `main` 分支和 `/(root)`。仓库没有额外的 Actions 部署 workflow，也不需要构建。

之后在本地提交并推送到 `main`，GitHub Pages 会按仓库设置发布静态文件：

```powershell
git fetch origin
git status --short --branch
git add <要提交的文件>
git commit -m "docs: update game documentation"
git push origin main
```

推送成功不等于 Pages 已完成构建；应在仓库 **Settings → Pages** 查看发布状态和网址。是否能在微信内打开还取决于用户网络对 GitHub 的访问情况。

## 隐私

游戏进度仅保存在本机浏览器的 `localStorage`，不会上传；仓库不包含原始参考照片。
