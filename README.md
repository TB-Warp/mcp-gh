# GitHub MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)

En professionel MCP (Model Context Protocol) server der giver seamless adgang til GitHub operations gennem AI-assistenter som Warp Terminal, baseret på GitHub CLI.

## 🚀 Quick Start

### Forudsætninger

GitHub CLI skal være installeret og authenticeret:

```bash
# Install GitHub CLI (hvis ikke allerede installeret)
brew install gh

# Login til GitHub
gh auth login

# Verificer status
gh auth status
```

### 🍺 Homebrew Installation (Anbefalet)

```bash
# Add custom tap
brew tap lpm/mcp

# Install GitHub MCP Server
brew install gh-mcp-server

# Verificer installation
gh-mcp-server --help
```

### 📦 NPM Global Installation

```bash
# Klon repository
git clone https://github.com/TB-Warp/mcp-gh.git
cd mcp-gh

# Install og byg
npm install
npm run build

# Install globalt
npm install -g .

# Verificer installation
gh-mcp-server --help
```

### ✅ Test installation
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | gh-mcp-server
```

## ✨ Features

Denne MCP server leverer komplet GitHub management gennem GitHub CLI:

### Repository Operations
- 📋 **gh_repo_list** - List repositories (own, organization, eller user)
- 📊 **gh_repo_info** - Detaljeret repository information 
- 🆕 **gh_repo_create** - Opret nye repositories (public/private, personal/org)

### Issue Management  
- 🐛 **gh_issue_list** - List issues med filtrering (open/closed/all)
- ➕ **gh_issue_create** - Opret nye issues med labels og assignees

### Pull Request Operations
- 🔄 **gh_pr_list** - List pull requests (open/closed/merged)
- 📝 **gh_pr_create** - Opret pull requests (inkl. drafts)

### GitHub Actions Integration
- ⚙️ **gh_workflow_list** - List GitHub Actions workflows
- ▶️ **gh_workflow_run** - Trigger workflows på specific refs

### Advanced Features
- 🔐 **Secure Authentication** - Bruger GitHub CLI's sikre token management
- 🎯 **Multi-Organization** - Støtter både personal og organizational repos
- 📊 **Rich JSON Output** - Struktureret data til AI processing
- ⚡ **High Performance** - Direkte GitHub CLI integration
- 🛡️ **Type Safety** - Bygget med TypeScript og Zod validation

## 📬 Installation

### 🍺 Homebrew (Anbefalet)

```bash
# Add custom tap
brew tap lpm/mcp

# Install GitHub MCP Server
brew install gh-mcp-server

# Nu tilgængelig som: gh-mcp-server
```

**Homebrew fordele:**
- ✅ **Automatisk dependency management** - Node.js og TypeScript installeres automatisk
- ✅ **System integration** - Korrekt placeret i PATH
- ✅ **Nem opdatering** med `brew upgrade gh-mcp-server`
- ✅ **Clean uninstall** med `brew uninstall gh-mcp-server`
- ✅ **Automatisk GitHub CLI check** - Viser besked hvis ikke installeret

### 📦 NPM Global

```bash
# Klon og install
git clone https://github.com/TB-Warp/mcp-gh.git
cd mcp-gh
npm install
npm run build

# Install globalt
npm install -g .

# Nu tilgængelig som: gh-mcp-server
```

### 🚀 Direkte fra kilde

```bash
# Klon og byg
git clone https://github.com/TB-Warp/mcp-gh.git
cd mcp-gh
npm install
npm run build

# Kør direkte
node build/index.js
```

## 🔧 Warp AI Integration

### Quick Setup

1. **Åbn Warp Terminal**
2. **Gå til Settings** ➜ `Cmd+,` 
3. **Find "Agent Mode" eller "MCP Servers"**
4. **Add New MCP Server**:

```json
{
  "mcpServers": {
    "gh-mcp-server": {
      "command": "gh-mcp-server",
      "args": []
    }
  }
}
```

### 🎨 Warp AI Usage Examples

Når MCP serveren er konfigureret, kan du bruge naturligt sprog i Warp:

```
👤 User: "List mine GitHub repositories"
🤖 AI: Lists all your repositories med stars, privacy status og last updated

👤 User: "Show me open issues in my project warp-mcp" 
🤖 AI: Lists alle åbne issues med labels, assignees og creation dates

👤 User: "Create a new issue in lpm/gh-mcp titled 'Add documentation'"
🤖 AI: Opretter et issue med den angivne titel

👤 User: "List pull requests in TB-Warp/warp-mcp"
🤖 AI: Viser alle PRs med status, authors og branch information

👤 User: "Trigger the CI workflow in my repo"
🤖 AI: Kører GitHub Actions workflows på din repository
```

## 📚 API Reference

### 📋 gh_repo_list - List Repositories

List repositories for authenticated user eller specified owner.

**Parameters:**
```typescript
{
  owner?: string,      // Repository owner (default: authenticated user)
  limit?: number,      // Number of repos to list (default: 30)
  type?: "all" | "owner" | "member"  // Repository type filter (default: "all")
}
```

**Eksempel:**
```json
{
  "name": "gh_repo_list",
  "arguments": {
    "owner": "lpm",
    "limit": 10,
    "type": "owner"
  }
}
```

**Response:** JSON array med repository details (navn, beskrivelse, stars, privacy, etc.)

### 📊 gh_repo_info - Repository Information

Få detaljeret information om en specifik repository.

**Parameters:**
```typescript
{
  owner: string,       // Repository owner (påkrævet)
  repo: string         // Repository name (påkrævet)
}
```

**Eksempel:**
```json
{
  "name": "gh_repo_info",
  "arguments": {
    "owner": "TB-Warp",
    "repo": "warp-mcp"
  }
}
```

**Response:** Komplet repository information inkl. language, topics, fork count, etc.

### 🆕 gh_repo_create - Create Repository

Opret en ny repository.

**Parameters:**
```typescript
{
  name: string,        // Repository name (påkrævet)
  description?: string, // Repository description
  private?: boolean,   // Create as private (default: false)
  org?: string         // Organization to create in (optional)
}
```

### 🐛 gh_issue_list - List Issues

List issues med filtrering.

**Parameters:**
```typescript
{
  owner?: string,      // Repository owner
  repo?: string,       // Repository name
  state?: "open" | "closed" | "all",  // Issue state (default: "open")
  limit?: number       // Number of issues (default: 30)
}
```

### ➕ gh_issue_create - Create Issue

Opret et nyt issue.

**Parameters:**
```typescript
{
  owner: string,       // Repository owner (påkrævet)
  repo: string,        // Repository name (påkrævet)
  title: string,       // Issue title (påkrævet)
  body?: string,       // Issue description
  labels?: string[],   // Labels to add
  assignees?: string[] // Users to assign
}
```

### 🔄 gh_pr_list - List Pull Requests

List pull requests med filtrering.

**Parameters:**
```typescript
{
  owner?: string,      // Repository owner
  repo?: string,       // Repository name  
  state?: "open" | "closed" | "merged" | "all", // PR state (default: "open")
  limit?: number       // Number of PRs (default: 30)
}
```

### 📝 gh_pr_create - Create Pull Request

Opret en ny pull request.

**Parameters:**
```typescript
{
  owner: string,       // Repository owner (påkrævet)
  repo: string,        // Repository name (påkrævet)
  title: string,       // PR title (påkrævet)
  head: string,        // Branch to merge from (påkrævet)
  base: string,        // Branch to merge into (påkrævet)
  body?: string,       // PR description
  draft?: boolean      // Create as draft (default: false)
}
```

### ⚙️ gh_workflow_list - List Workflows

List GitHub Actions workflows.

**Parameters:**
```typescript
{
  owner: string,       // Repository owner (påkrævet)
  repo: string         // Repository name (påkrævet)
}
```

### ▶️ gh_workflow_run - Trigger Workflow

Trigger en GitHub Actions workflow.

**Parameters:**
```typescript
{
  owner: string,       // Repository owner (påkrævet)
  repo: string,        // Repository name (påkrævet)
  workflow: string,    // Workflow ID or filename (påkrævet)
  ref?: string         // Git reference (default: "main")
}
```

## 🛡️ Sikkerhed

**Fordele ved GitHub CLI approach:**

- ✅ **Sikker Authentication** - Bruger GitHub's official OAuth flow
- ✅ **Token Management** - GitHub CLI håndterer token refresh automatisk  
- ✅ **Rate Limiting** - Built-in respekt for GitHub API limits
- ✅ **Permissions** - Bruger kun de permissions du har givet GitHub CLI
- ✅ **Audit Trail** - Alle actions logges af GitHub som din user

**Vs. Token-baseret løsning:**
- ❌ Token kan expire og skal manuelt fornyes
- ❌ Tokens skal lagres sikkert og roteres
- ❌ Geen built-in rate limiting håndtering
- ❌ Mere kompleks permission management

## 🧪 Testing

Test at GitHub MCP serveren fungerer:

```bash
# Test tool listing
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | gh-mcp-server | jq

# Test repository listing  
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "gh_repo_list", "arguments": {"limit": 3}}}' | gh-mcp-server | jq

# Test repository info
echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "gh_repo_info", "arguments": {"owner": "lpm", "repo": "gh-mcp"}}}' | gh-mcp-server | jq
```

## 📋 Forudsætninger

- Node.js 18+
- GitHub CLI installeret og authenticeret
- TypeScript (udvikling)

## 🎯 Use Cases

Perfekt til:

- **Repository Management** - Opret, list og administrer repos
- **Issue Tracking** - Administrer issues og labels
- **Code Review** - Håndter pull requests
- **CI/CD Integration** - Trigger og monitor workflows  
- **Team Collaboration** - Assign tasks og administrer projekter
- **Multi-Org Operations** - Håndter repositories på tværs af organisationer

## 🤝 Sammenligning med andre GitHub MCP løsninger

| Feature | GitHub MCP (GH CLI) | Token-baseret MCP |
|---------|-------------------|-------------------|
| Authentication | ✅ Secure OAuth | ⚠️ Manual token management |
| Rate Limiting | ✅ Built-in | ❌ Manual implementation |
| Permission Management | ✅ GitHub managed | ⚠️ Token scope management |
| Token Expiry | ✅ Auto-handled | ❌ Manual renewal |
| Audit Trail | ✅ GitHub logged | ✅ GitHub logged |
| Setup Complexity | ✅ Simple | ⚠️ Complex |
| Maintenance | ✅ Low | ⚠️ High |

## 📄 Licens

MIT

---

**GitHub MCP Server - Bygget med GitHub CLI for maksimal sikkerhed og funktionalitet!** 🚀
