#!/bin/zsh
# Harmonix ZSH Launcher
# This is a simple wrapper for zsh users to ensure full compatibility

# Get script directory
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)

# Pass all arguments to the main script
exec "$SCRIPT_DIR/start_harmonix_split_terminals.sh" "$@"
