#!/bin/bash

echo "Testing Stock Market MCP Server..."
echo ""

# Test list tools command
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | npx tsx src/index.ts 2>/dev/null | jq '.result.tools | length' | (
    read count
    if [ "$count" -gt 0 ]; then
        echo "✅ Server loaded $count tools successfully"
    else
        echo "❌ Failed to load tools"
    fi
)

echo ""
echo "Server is ready to use!"
echo ""
echo "To use with Claude Desktop, add this to your config:"
echo "~/Library/Application Support/Claude/claude_desktop_config.json"
echo ""
echo '{'
echo '  "mcpServers": {'
echo '    "stock-market": {'
echo '      "command": "node",'
echo '      "args": ["'$(pwd)'/dist/index.js"]'
echo '    }'
echo '  }'
echo '}'