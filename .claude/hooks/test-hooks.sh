#!/bin/bash

# Simple test script to verify hooks are working correctly

echo "🧪 Testing Claude Code Hooks Setup"
echo "=================================="

# Test 1: Check if hooks are executable
echo "📋 Test 1: Hook executability"
if [[ -x ".claude/hooks/pre-tool-use.sh" ]]; then
    echo "✅ pre-tool-use.sh is executable"
else
    echo "❌ pre-tool-use.sh is not executable"
    exit 1
fi

if [[ -x ".claude/hooks/post-tool-use.sh" ]]; then
    echo "✅ post-tool-use.sh is executable"
else
    echo "❌ post-tool-use.sh is not executable"
    exit 1
fi

if [[ -x ".claude/hooks/notification.sh" ]]; then
    echo "✅ notification.sh is executable"
else
    echo "❌ notification.sh is not executable"
    exit 1
fi

# Test 2: Check if basic shell commands are available
echo "📋 Test 2: Required commands availability"
if command -v grep &> /dev/null && command -v cut &> /dev/null; then
    echo "✅ grep and cut are available"
else
    echo "❌ Required shell commands not available"
    exit 1
fi

# Test 3: Check settings.json configuration
echo "📋 Test 3: Configuration file"
if [[ -f ".claude/settings.json" ]]; then
    echo "✅ settings.json exists"
    if grep -q '"hooks"' .claude/settings.json; then
        echo "✅ hooks configuration found"
    else
        echo "❌ hooks configuration not found"
        exit 1
    fi
else
    echo "❌ settings.json not found"
    exit 1
fi

# Test 4: Test hook with dummy data
echo "📋 Test 4: Hook functionality"
test_input='{"tool_name": "Edit", "file_path": "test.txt"}'

echo "Testing pre-tool-use hook..."
if echo "$test_input" | .claude/hooks/pre-tool-use.sh > /dev/null 2>&1; then
    echo "✅ pre-tool-use hook executed successfully"
else
    echo "❌ pre-tool-use hook failed"
    exit 1
fi

echo "Testing post-tool-use hook..."
if echo "$test_input" | .claude/hooks/post-tool-use.sh > /dev/null 2>&1; then
    echo "✅ post-tool-use hook executed successfully"
else
    echo "❌ post-tool-use hook failed"
    exit 1
fi

echo ""
echo "🎉 All tests passed! Claude Code hooks are configured correctly."
echo "📝 Hook logs will be written to .claude/hooks/operations.log"
echo "🔧 To customize hooks, edit the scripts in .claude/hooks/"

exit 0