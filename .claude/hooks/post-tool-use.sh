#!/bin/bash

# PostToolUse Hook - Runs after Claude Code executes tools
# This hook automatically runs linting and type checking after code changes

# Parse the hook input JSON (simple parsing without jq)
input=$(cat)
tool_name=$(echo "$input" | grep -o '"tool_name":"[^"]*"' | cut -d'"' -f4)
file_path=$(echo "$input" | grep -o '"file_path":"[^"]*"' | cut -d'"' -f4)

# Only run checks for file modification tools
if [[ "$tool_name" == "Edit" || "$tool_name" == "MultiEdit" || "$tool_name" == "Write" ]]; then
    echo "🔍 Running post-edit checks..."
    
    # Run TypeScript type checking
    echo "📝 Running TypeScript type check..."
    if npm run typecheck --silent; then
        echo "✅ TypeScript check passed"
    else
        echo "❌ TypeScript check failed"
        exit 1
    fi
    
    # Run ESLint
    echo "🔧 Running ESLint..."
    if npm run lint --silent; then
        echo "✅ ESLint check passed"
    else
        echo "❌ ESLint check failed - consider running 'npm run lint --fix'"
        exit 1
    fi
    
    # Log the operation
    echo "$(date): Post-edit checks completed for $tool_name on $file_path" >> .claude/hooks/operations.log
    
    echo "🎉 All checks passed!"
fi

exit 0