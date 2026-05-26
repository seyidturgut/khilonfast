#!/bin/bash
# KhilonFast otomatik git backup
# Her 30 dakikada bir: değişiklik varsa commit + push
# launchd tarafından tetiklenir → ~/Library/LaunchAgents/com.khilonfast.autobackup.plist

set -e
PROJECT_DIR="/Users/seyidturgut/Works/Khilon/khilonfast.com/web2026"
LOG_FILE="$HOME/Library/Logs/khilonfast-autobackup.log"

cd "$PROJECT_DIR"

# Timestamp
TS=$(date '+%Y-%m-%d %H:%M:%S')

# Değişiklik var mı?
if [ -z "$(git status --porcelain)" ]; then
    echo "[$TS] No changes — skipping" >> "$LOG_FILE"
    exit 0
fi

# main branch'te miyiz?
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
    echo "[$TS] Not on main (current: $BRANCH) — skipping auto-backup" >> "$LOG_FILE"
    exit 0
fi

# Commit + push
git add -A
git commit -m "wip: auto-backup $TS" >> "$LOG_FILE" 2>&1 || {
    echo "[$TS] Commit failed" >> "$LOG_FILE"
    exit 1
}

git push origin main >> "$LOG_FILE" 2>&1 && \
    echo "[$TS] ✓ Pushed to GitHub" >> "$LOG_FILE" || \
    echo "[$TS] ✗ Push failed (network/auth)" >> "$LOG_FILE"
