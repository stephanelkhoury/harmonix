#!/bin/bash

# Harmonix Project Organization Maintenance Script
# This script helps maintain the organized project structure

HARMONIX_ROOT="/Users/stephanelkhoury/Documents/GitHub/harmonix"

echo "🎵 Harmonix Project Organization Maintenance"
echo "============================================"

# Function to check and move files to appropriate directories
organize_files() {
    cd "$HARMONIX_ROOT"
    
    echo "📁 Checking for misplaced files..."
    
    # Check for loose script files in root
    for file in *.sh; do
        if [[ -f "$file" ]]; then
            echo "⚠️  Found script in root: $file"
            echo "   Consider moving to scripts/ directory"
        fi
    done
    
    # Check for loose test files in root
    for file in test_*.html test_*.js verify_*.js; do
        if [[ -f "$file" ]]; then
            echo "⚠️  Found test file in root: $file"
            echo "   Consider moving to tests/ directory"
        fi
    done
    
    # Check for loose config files in root
    for file in *.config.js config.js; do
        if [[ -f "$file" && "$file" != "PROJECT_STRUCTURE.md" ]]; then
            echo "⚠️  Found config file in root: $file"
            echo "   Consider moving to config/ directory"
        fi
    done
    
    echo "✅ Organization check complete"
}

# Function to create missing directories
ensure_directories() {
    echo "📂 Ensuring all required directories exist..."
    
    directories=(
        "scripts/management"
        "scripts/setup/start-scripts"
        "scripts/setup/macos-specific"
        "scripts/testing"
        "scripts/utils"
        "tests/html"
        "tests/js"
        "tests/integration"
        "samples/demos"
        "config/templates"
        "logs"
    )
    
    for dir in "${directories[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            echo "✅ Created directory: $dir"
        fi
    done
}

# Function to show project structure
show_structure() {
    echo "📋 Current Project Structure:"
    echo "============================"
    tree -d -L 2 "$HARMONIX_ROOT" 2>/dev/null || ls -la "$HARMONIX_ROOT"
}

# Function to validate organization
validate_organization() {
    echo "🔍 Validating project organization..."
    
    # Check if key directories exist
    key_dirs=("frontend" "backend" "python_service" "docs" "scripts" "tests" "config")
    
    for dir in "${key_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            echo "✅ $dir directory found"
        else
            echo "❌ Missing key directory: $dir"
        fi
    done
}

# Main menu
show_menu() {
    echo ""
    echo "Choose an option:"
    echo "1) Check for misplaced files"
    echo "2) Ensure all directories exist"
    echo "3) Show project structure"
    echo "4) Validate organization"
    echo "5) Run all checks"
    echo "6) Exit"
    echo ""
    read -p "Enter your choice (1-6): " choice
    
    case $choice in
        1) organize_files ;;
        2) ensure_directories ;;
        3) show_structure ;;
        4) validate_organization ;;
        5) 
            ensure_directories
            organize_files
            validate_organization
            show_structure
            ;;
        6) echo "👋 Goodbye!"; exit 0 ;;
        *) echo "❌ Invalid option" ;;
    esac
}

# Run main menu in loop
while true; do
    show_menu
    echo ""
    read -p "Press Enter to continue or Ctrl+C to exit..."
    clear
done
