#!/bin/bash

# PreToolUse Hook - Runs before Claude Code executes tools
# This hook blocks modifications to critical files and provides safety warnings

# Parse the hook input JSON (simple parsing without jq)
input=$(cat)
tool_name=$(echo "$input" | grep -o '"tool_name":"[^"]*"' | cut -d'"' -f4)
file_path=$(echo "$input" | grep -o '"file_path":"[^"]*"' | cut -d'"' -f4)

# Critical files and directories that should be protected
critical_paths=(
    "Data/*.sql"
    "Data/*.py"
    "package.json"
    "package-lock.json"
    "next.config.ts"
    "tailwind.config.ts"
    "tsconfig.json"
    "vitest.config.ts"
    ".env*"
    "src/middleware.ts"
    "src/lib/supabase/server.ts"
    "src/lib/supabase/client.ts"
)

# Check if the tool is trying to modify a critical file
if [[ "$tool_name" == "Edit" || "$tool_name" == "MultiEdit" || "$tool_name" == "Write" ]]; then
    for pattern in "${critical_paths[@]}"; do
        if [[ "$file_path" == $pattern ]]; then
            echo "🚨 BLOCKED: Attempted to modify critical file: $file_path"
            echo "📋 This file requires manual review before changes."
            echo "🔍 Reason: Critical configuration or database file"
            echo "💡 To proceed: Review the change carefully and make it manually if needed."
            
            # Log the blocked operation
            echo "$(date): BLOCKED $tool_name on critical file: $file_path" >> .claude/hooks/operations.log
            
            exit 1
        fi
    done
fi

# Special validation for component files - ensure responsive design compliance
if [[ "$tool_name" == "Edit" || "$tool_name" == "MultiEdit" || "$tool_name" == "Write" ]]; then
    if [[ "$file_path" == *"components"* && "$file_path" == *".tsx" ]]; then
        echo "📱 REMINDER: Ensure responsive design compliance"
        echo "📖 Reference: specs/responsive-design-guidelines.md"
        echo "🧪 Test on multiple screen sizes after changes"
        
        # Log the reminder
        echo "$(date): Responsive design reminder for: $file_path" >> .claude/hooks/operations.log
    fi
fi

# Log all operations for debugging
echo "$(date): Pre-tool check passed for $tool_name on $file_path" >> .claude/hooks/operations.log

exit 0