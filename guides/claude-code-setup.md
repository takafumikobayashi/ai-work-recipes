---
id: claude-code-setup
title: Claude Code をはじめる（Mac・Windows）
nav_group: top
order: 2
---

Claude Code は、Anthropic社のAI「Claude」が、あなたのパソコンのフォルダの中で、ファイルを読んだり作ったり直したりしながら作業を進めるツールです。チャット型のAIに資料を貼って答えをもらうのとは違い、AIが直接ファイルを扱います。

このページの内容は 2026年11月3日 時点の [公式ドキュメント](https://code.claude.com/docs/ja/setup) に基づいています。画面や手順は変わることがあるため、うまくいかないときは公式ドキュメントも確認してください。

## 用意するもの

- **Claudeの有料プラン**（Pro、Max、Team、Enterpriseなど）、または開発者向けの Claude Console のアカウント。**無料プランでは使えません**
- **パソコン**：macOS 13 以上の Mac、または Windows 10（バージョン 1809）以上の Windows。メモリ 4GB 以上
- **インターネット接続**

組織のパソコンで使う場合は、ソフトのインストールと、AIにファイルを読ませてよいかを、組織の担当者に先に確認してください。

## 使い方を選ぶ

使い方は2つあります。はじめての方は **A：デスクトップアプリ** がおすすめです。

| | A：デスクトップアプリ | B：ターミナル（黒い画面） |
|---|---|---|
| 操作 | ふつうのアプリと同じく、クリックで操作 | 文字でコマンドを入力 |
| 向いている人 | はじめての方、ターミナルを使ったことがない方 | 開発の経験がある方 |
| インストール | アプリをダウンロードするだけ | コマンドを1行貼り付ける |

## A：デスクトップアプリで使う

### 1. アプリを入れる

- **Mac**：[Mac版をダウンロード](https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect) し、開いたファイルの Claude のアイコンを「アプリケーション」フォルダにドラッグします
- **Windows**：[Windows版をダウンロード](https://claude.ai/api/desktop/win32/x64/setup/latest/redirect) し、ダウンロードしたファイルを開いてインストールします。ARM版のWindowsでは [ARM64版](https://claude.ai/api/desktop/win32/arm64/setup/latest/redirect) を使います

### 2. ログインして「Code」を開く

1. Claude のアプリを起動し（Macは「アプリケーション」フォルダ、Windowsはスタートメニューから）、Claudeのアカウントでログインします
2. 左のサイドバーの上にある **Code**（コード）をクリックします。アイコンだけが並んでいるときは、マウスを重ねると名前が出ます

「アップグレード」の案内が出たときは、有料プランへの登録が必要です。

### 3. フォルダを選んで頼む

1. 入力欄の下の、いちばん左のボタン（環境の選択）で、**Local** の一番上を選びます
2. その隣のボタンで **Open folder…** を選び、作業したいフォルダを選びます
3. 入力欄に、やってほしいことを日本語で書いて送ります

はじめは、大事なファイルの入っていない、練習用のフォルダで試すのがおすすめです。

## B：ターミナルで使う

### Mac の場合

**1. ターミナルを開く**

`Command` + `スペース` を押し、「ターミナル」と入力して `Enter` を押します。

**2. インストールする**

次の1行をコピーし、ターミナルに貼り付けて（`Command` + `V`）、`Enter` を押します。

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

ダウンロード中は何も表示されません。「Claude Code successfully installed!」と表示されるまで待ちます。

**3. 確かめる**

ターミナルのウィンドウを開き直してから、次を入力して `Enter` を押します。`2.1.211 (Claude Code)` のようにバージョンの番号が表示されれば成功です。

```bash
claude --version
```

Homebrew を使っている方は、`brew install --cask claude-code` でもインストールできます。この場合は自動で更新されないため、ときどき `brew upgrade claude-code` を実行してください。

### Windows の場合

**1. （任意）Git for Windows を入れる**

[Git for Windows](https://git-scm.com/downloads/win) を入れておくと、Claude Code ができる作業が増えます。入れなくても使えます。インストールの画面はたくさん出ますが、すべて「Next」のままで大丈夫です。

**2. PowerShell を開く**

`Windows` キー + `X` を押し、メニューから **Windows PowerShell**（または **ターミナル**）を選びます。行の先頭に `PS C:\Users\あなたの名前>` のように **PS** が付いていれば PowerShell です。「(x86)」と付いたものは選ばないでください。

**3. インストールする**

次の1行をコピーし、PowerShell に貼り付けて（`Ctrl` + `V` または右クリック）、`Enter` を押します。管理者として実行する必要はありません。

```powershell
irm https://claude.ai/install.ps1 | iex
```

ダウンロード中は何も表示されません。「Claude Code successfully installed!」と表示されるまで待ちます。

行の先頭に **PS** が付いていない画面（コマンドプロンプト）を開いてしまった場合は、代わりに次を使います。

```bat
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

**4. 確かめる**

PowerShell のウィンドウを開き直してから、次を入力して `Enter` を押します。バージョンの番号が表示されれば成功です。

```powershell
claude --version
```

WinGet を使っている方は、`winget install Anthropic.ClaudeCode` でもインストールできます。この場合は自動で更新されないため、ときどき `winget upgrade Anthropic.ClaudeCode` を実行してください。

### はじめて起動する（Mac・Windows 共通）

作業したいフォルダに移動してから、`claude` と入力して `Enter` を押します。

```bash
cd 作業したいフォルダの場所
claude
```

初回はブラウザが開くので、Claudeのアカウントでログインします。一度ログインすれば、次からは不要です。

ターミナルでの操作のコツです。

- 画面はクリックできません。矢印キーで選び、`Enter` で決定します
- AIの作業を止めたいときは `Esc` を押します
- 終わるときは `/exit` と入力するか、`Ctrl` + `D` を2回押します
- 使えるコマンドは `/help` で確認できます

## はじめに頼んでみること

日本語で、同僚に頼むように書けば大丈夫です。

```text
このフォルダに何が入っているか、説明してください
```

```text
このフォルダのファイルを、種類ごとにフォルダに分けて整理する案を出してください。まだ動かさないでください
```

```text
「こんにちは」と表示するだけの、簡単なWebページを作ってください
```

ファイルを作ったり変えたりする前に、AIが確認を求めてきます。内容を見て、よければ許可します。

## うまくいかないとき

| 表示されたこと | 対処 |
|---|---|
| Mac：`command not found: claude` | 下の「Mac：claude が見つからない」を実行し、ターミナルを開き直す |
| Windows：`claude` が「認識されません」（`is not recognized`） | 下の「Windows：claude が見つからない」を実行し、PowerShell を開き直す |
| Windows：`irm` が「認識されません」 | コマンドプロンプトを開いています。PowerShell を開き直すか、コマンドプロンプト用の1行を使う |
| Windows：`SSL/TLS` のエラー | 古い Windows 10 で起きます。下の「Windows：SSL/TLS のエラー」を実行する |
| Windows：`does not support 32-bit Windows` | 「Windows PowerShell (x86)」を開いています。「(x86)」の付いていない方を開き直す |
| Mac：`syntax error near unexpected token '<'` | もう一度実行する。続くときは、利用できる国・地域か、組織のネットワークの制限を確認する |
| ログインで止まる、`403` | 有料プランに登録しているか、組織のアカウントで利用が許可されているかを確認する |

**Mac：claude が見つからない**

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Windows：claude が見つからない**

```powershell
$currentPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
[Environment]::SetEnvironmentVariable('PATH', "$currentPath;$env:USERPROFILE\.local\bin", 'User')
```

**Windows：SSL/TLS のエラー**

```powershell
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
irm https://claude.ai/install.ps1 | iex
```

インストールの状態をくわしく調べたいときは、`claude doctor` を実行します。そのほかのエラーは、公式の [インストールのトラブルシューティング](https://code.claude.com/docs/ja/troubleshoot-install) を見てください。

## 更新とアンインストール

- **更新**：上の1行の方法で入れた場合は、自動で更新されます。すぐに更新したいときは `claude update` を実行します
- **アンインストール**：入れた方法によって手順が違います。公式ドキュメントの [セットアップ](https://code.claude.com/docs/ja/setup) の「アンインストール」を見てください

## 安全に使うために

- AIはフォルダの中のファイルを読みます。組織の規定でAIへの入力が認められていない情報の入ったフォルダでは使わないでください
- はじめは、AIが変更する前に確認を求める設定のまま使い、変更の内容を見てから許可してください
- 大事なファイルは、作業の前にコピーを取っておくと安心です

## もっと知りたいとき

- [Claude Code 公式ドキュメント（日本語）](https://code.claude.com/docs/ja/quickstart)
- [ターミナルをはじめて使う方向けのガイド（公式）](https://code.claude.com/docs/ja/terminal-guide)
- [デスクトップアプリのはじめ方（公式）](https://code.claude.com/docs/ja/desktop-quickstart)
