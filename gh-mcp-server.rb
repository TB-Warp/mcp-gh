class GhMcpServer < Formula
  desc "GitHub MCP Server - Complete GitHub management via GitHub CLI for Warp AI"
  homepage "https://github.com/TB-Warp/mcp-gh"
  url "https://github.com/TB-Warp/mcp-gh/archive/refs/heads/main.zip"
  version "1.0.0"
  sha256 "" # Will be calculated automatically by brew

  depends_on "node"
  depends_on "gh" => :recommended

  def install
    # Install Node.js dependencies
    system "npm", "install", "--production"
    
    # Build TypeScript
    system "npm", "run", "build"
    
    # Install to libexec to avoid conflicts
    libexec.install Dir["*"]
    
    # Create wrapper script
    (bin/"gh-mcp-server").write_env_script("#{Formula["node"].opt_bin}/node", 
                                           "#{libexec}/build/index.js")
  end

  def caveats
    <<~EOS
      GitHub MCP Server requires GitHub CLI to be installed and authenticated:
        
        brew install gh
        gh auth login
        
      To use with Warp AI, add to your MCP configuration:
      {
        "mcpServers": {
          "gh-mcp-server": {
            "command": "gh-mcp-server",
            "args": []
          }
        }
      }
    EOS
  end

  test do
    # Test that the server can start and list tools
    output = shell_output("echo '{\"jsonrpc\": \"2.0\", \"id\": 1, \"method\": \"tools/list\", \"params\": {}}' | #{bin}/gh-mcp-server 2>/dev/null", 0)
    assert_match "gh_repo_list", output
    assert_match "gh_issue_create", output
  end
end
