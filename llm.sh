#!/usr/bin/env bash

cd /Users/dev/code/leadgenie || exit 1

if [ $# -gt 0 ]; then
  #  claude --print "$*" --model sonnet --allowedTools "rails-mcp"
  #  cat | agent --model composer-1
  exit
else
    echo "do you have access to rails-mcp?" | claude --print --dangerously-skip-permissions --model sonnet --mcp-config ~/.claude/mcp.json
fi
