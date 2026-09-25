# 等等贝贝吧

一款原生 JavaScript + Canvas 2D 的高清横版追逐游戏，可作为静态站点部署到 GitHub Pages。玩家操控董贝贝，在校园节的日落前追赶孟培杰，穿过校园天桥，再沿河岸旧街奔向钟楼。

## 游玩方式

- 自动前进；A / ← 减速并回头，D / → 消耗能量冲刺；P / Esc 暂停或继续。
- 空格 / W / ↑ 跳跃；电脑也可点击画面跳跃，手机使用右侧跳跃键；支持二段跳。
- 手机左侧方向键控制移动，HUD 右上角可暂停；手机按键位于游戏画面下方。
- 拾取能量补充冲刺；金币用于关卡挑战记录，不会让孟培杰瞬移。触碰篮球会自动踢向前方；第二关的指定篮球可开启上层近路。香蕉、横风、巡逻障碍、施工箱、移动挡板、塌陷平台和弹簧需要不同应对。
- 首页「选择关卡」可查看完整关卡和校园分段练习。第一关是连续校园旅程；通关后解锁独立的第二关「沿河旧街 · 钟楼下等我」。关前关后有可跳过剧情，选关面板可回看已解锁关卡的开场。
- 进度和已看剧情保存在当前设备浏览器；旧版第一关通关记录会自动解锁第二关。
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
- 七个区域按需加载高清 WebP 背景；原有区域仍保留 PNG 回退。校门、天桥、河岸和钟楼采用同一虚构校园小城的原创场景。角色与道具使用本地图片资源，游戏音效由 Web Audio 本地合成。
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
