# 等等贝贝吧

一个可直接部署到 GitHub Pages 的原创像素追逐平台小游戏。玩家操控董贝贝，穿过校园入口、篮球场、银杏林路、湖畔施工区与黄昏天桥组成的一张连续长地图，追上孟培杰。顺畅通关约 5 分钟，首次游玩通常需要 5–8 分钟。

## 操作

- 自动前进；A / ← 可减速回头；空格 / W / ↑ 或点游戏画面跳跃。
- 手机：点击游戏画面跳跃

收集闪光的“贝贝能量”会短时冲刺。碰到篮球会自动踢向孟培杰；香蕉皮会让贝贝暂时滑倒。掉进坑会从最近检查点继续，撞到书包或落后太远会失败。路程达到 70% 后，靠近孟培杰将出现概率追上机会；孟培杰也会自主加速、减速或倒地。角色具备奔跑、跳跃、滑倒、哭泣与胜利动作。

## 本地预览

在项目目录运行：

```powershell
python -m http.server 4173
```

然后打开 `http://127.0.0.1:4173`。

## GitHub Pages 发布

1. 在 GitHub 创建一个新的公开仓库，例如 `deng-deng-beibei`。
2. 把本项目文件上传到仓库根目录并推送到 `main` 分支。
3. 打开仓库 **Settings -> Pages**。
4. 在 **Build and deployment** 中选择 **Deploy from a branch**，选择 `main` 和 `/(root)`，然后保存。
5. 等待 GitHub 显示公开网址；该网址可在微信内尝试打开。不同网络对 GitHub 的可达性可能不同。

后续更新：

```powershell
git pull --rebase origin main
git add .
git commit -m "feat: update deng deng beibei game"
git push origin main
```

## 隐私说明

项目只使用根据参考照片生成的像素头像素材；不包含原始照片。
