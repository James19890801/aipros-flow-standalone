#!/usr/bin/env bash
# aipros-flowchart Skill — 通用安装脚本（任意本地 Agent）
# 用法: ./install.sh [目标目录]  不带参数则自动探测已安装的 Agent
set -euo pipefail
SRC="$(cd "$(dirname "$0")" && pwd)"

# 各 Agent 的 skills 目录约定
CANDIDATES=(
  "$HOME/.claude/skills"     # Claude Code / Claude Agent SDK
  "$HOME/.codex/skills"      # Codex CLI
  "$HOME/.qoder/skills"      # Qoder / QoderWork
  "$HOME/.cursor/skills"     # Cursor
  "$HOME/.gemini/skills"     # Gemini CLI
  "$HOME/.config/opencode/skills"  # OpenCode 等
)

install_to() {
  local dir="$1"
  mkdir -p "$dir"
  rm -rf "$dir/aipros-flowchart"
  cp -R "$SRC/aipros-flowchart" "$dir/aipros-flowchart"
  echo "✓ 已安装: $dir/aipros-flowchart"
}

if [ $# -gt 0 ]; then
  install_to "$1"
  exit 0
fi

found=0
for c in "${CANDIDATES[@]}"; do
  if [ -d "$c" ] || [ -d "$(dirname "$c")" ]; then
    install_to "$c"
    found=1
  fi
done
[ "$found" = 0 ] && echo "未探测到已安装的 Agent，手动指定: ./install.sh <目录>" && exit 1
echo "完成。对 Agent 说「画个泳道图」即可触发。"
