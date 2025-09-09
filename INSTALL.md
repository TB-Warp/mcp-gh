# GitHub MCP Server Installation Guide

## 🍺 Homebrew Installation (Anbefalet)

### 1. Installer via Homebrew

```bash
# Add custom tap
brew tap lpm/mcp

# Install GitHub MCP Server
brew install gh-mcp-server
```

### 2. Verificer installation

```bash
# Check installation
which gh-mcp-server
# Output: /usr/local/bin/gh-mcp-server

# Test server functionality
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | gh-mcp-server | jq
```

### 3. GitHub CLI setup (påkrævet)

```bash
# Install GitHub CLI if not already installed
brew install gh

# Login to GitHub
gh auth login

# Verify authentication
gh auth status
```

### 4. Warp AI Integration

Tilføj til din Warp MCP konfiguration:

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

## 🔧 Homebrew fordele

- ✅ **Automatisk dependency management** - Node.js installeres automatisk
- ✅ **System integration** - Korrekt placeret i /usr/local/bin
- ✅ **Nem opdatering**: `brew upgrade gh-mcp-server`
- ✅ **Clean uninstall**: `brew uninstall gh-mcp-server`
- ✅ **Built-in testing**: `brew test gh-mcp-server`

## 📦 Alternative installationsmetoder

### NPM Global

```bash
git clone https://github.com/TB-Warp/mcp-gh.git
cd mcp-gh
npm install
npm run build
npm install -g .
```

### Direkte fra kilde

```bash
git clone https://github.com/TB-Warp/mcp-gh.git
cd mcp-gh
npm install
npm run build
node build/index.js
```

## 🧪 Test installation

### Basic functionality test

```bash
# List alle tilgængelige tools
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | gh-mcp-server | jq '.result.tools[].name'

# Test repository listing
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "gh_repo_list", "arguments": {"limit": 3}}}' | gh-mcp-server | jq -r '.result.content[0].text'
```

### Expected output

```bash
# Tool names:
"gh_repo_list"
"gh_repo_info" 
"gh_repo_create"
"gh_issue_list"
"gh_issue_create"
"gh_pr_list"
"gh_pr_create"
"gh_workflow_list"
"gh_workflow_run"
```

## ❌ Troubleshooting

### GitHub CLI ikke installeret

```
Error: gh: command not found
```

**Løsning:**
```bash
brew install gh
gh auth login
```

### Node.js ikke tilgængelig

```
Error: node: command not found
```

**Løsning:** Homebrew skulle automatisk installere Node.js, men hvis ikke:
```bash
brew install node
```

### Symlink conflicts

```
Error: Could not symlink bin/gh-mcp-server
Target /usr/local/bin/gh-mcp-server already exists
```

**Løsning:**
```bash
npm uninstall -g gh-mcp-server  # Remove NPM version
brew link --overwrite gh-mcp-server
```

## 🎯 Verification checklist

- [ ] `which gh-mcp-server` returns `/usr/local/bin/gh-mcp-server`
- [ ] `gh auth status` shows authenticated GitHub account
- [ ] Tool listing returns 9 tools
- [ ] Repository listing works uden fejl
- [ ] Warp MCP configuration added

## 🚀 Ready for Warp!

Når alt er installeret og testet, kan du bruge naturligt sprog i Warp:

- *"List mine GitHub repositories"*
- *"Show me open issues in my project"*  
- *"Create a new issue titled 'Feature request'"*
- *"List pull requests in TB-Warp/mcp-gh"*
