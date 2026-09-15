# 等等贝贝吧

一个可直接部署到 GitHub Pages 的原创像素追逐平台小游戏。玩家操控董贝贝，通过校园小路与黄昏天桥，追上孟培杰。

## 操作

- 移动：A / D 或 ← / →
- 跳跃与二段跳：空格 / W / ↑
- 手机：点击游戏画面跳跃

收集闪光的“贝贝能量”会短时冲刺。撞到书包、掉进坑或落后太远会失败；掉坑会从最近检查点继续。

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
