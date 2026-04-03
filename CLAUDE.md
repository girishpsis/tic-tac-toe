# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repo contains two standalone browser games with no build step or dependencies:

- **Tic Tac Toe** (`index.html`) — a self-contained single-file game with inline CSS/JS. Supports 2-player and vs AI modes with score tracking. The AI uses a heuristic strategy (win → block → center → corner → any).
- **Quick Draw!** (`quickdraw.html`) — a drawing game that uses the Anthropic Claude API for image recognition. Requires a local proxy server to avoid exposing the API key in the browser.

## Running

### Tic Tac Toe
Open `index.html` directly in a browser. No server needed.

### Quick Draw!
Requires the proxy server for Claude API access:
```
# Set API key via .env file (ANTHROPIC_API_KEY=sk-ant-...) or environment variable
node server.js
# Opens at http://localhost:3001
```

## Architecture

- **No build system, no package manager, no framework.** All games are plain HTML/CSS/JS.
- `server.js` is a zero-dependency Node.js HTTP server that:
  - Serves `quickdraw.html` at `/`
  - Proxies POST requests from the browser to `api.anthropic.com/v1/messages` at `/claude`
  - Loads API key from `.env` file or environment variable
  - Has a health check at `/ping`
- Each HTML file is fully self-contained (markup, styles, and logic in one file).

