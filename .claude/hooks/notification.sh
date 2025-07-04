#!/bin/bash

# Notification Hook - Runs during Claude Code notifications
# This hook provides custom alerts for test/build issues

# Parse the hook input JSON (simple parsing without jq)
input=$(cat)
message=$(echo "$input" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
type=$(echo "$input" | grep -o '"type":"[^"]*"' | cut -d'"' -f4)

# Check for test or build related notifications
if [[ "$message" == *"test"* || "$message" == *"build"* || "$message" == *"lint"* || "$message" == *"error"* ]]; then
    echo "🔔 NOTIFICATION: $message"
    
    # Provide helpful context based on the type of issue
    if [[ "$message" == *"test"* ]]; then
        echo "🧪 Test Issue Detected"
        echo "💡 Quick actions:"
        echo "  - Run 'npm run test' to see detailed test output"
        echo "  - Check test files in src/**/__tests__/"
        echo "  - Review test coverage with 'npm run test:coverage'"
    fi
    
    if [[ "$message" == *"build"* ]]; then
        echo "🏗️ Build Issue Detected"
        echo "💡 Quick actions:"
        echo "  - Run 'npm run typecheck' to check TypeScript errors"
        echo "  - Run 'npm run lint' to check linting issues"
        echo "  - Check Next.js build logs for detailed errors"
    fi
    
    if [[ "$message" == *"lint"* ]]; then
        echo "🔧 Linting Issue Detected"
        echo "💡 Quick actions:"
        echo "  - Run 'npm run lint --fix' to auto-fix issues"
        echo "  - Check ESLint configuration in .eslintrc.json"
        echo "  - Review coding standards in ai-docs/STYLE_GUIDE.md"
    fi
    
    # Log the notification
    echo "$(date): Notification processed: $message" >> .claude/hooks/operations.log
fi

# Always allow the notification to proceed
exit 0