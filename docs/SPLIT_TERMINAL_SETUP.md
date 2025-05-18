# Split Terminal Development Setup for Harmonix

This document explains how to use the `start_harmonix_split_terminals.sh` script for efficient Harmonix development.

## Overview

The split terminal launcher creates separate terminal windows for each Harmonix component, making it easier to:

- Monitor real-time logs for each service
- Debug issues in specific components
- Restart individual services as needed
- Develop features more efficiently

## Terminal Windows Created

The script launches these named terminal windows:

1. **Python Service** - FastAPI server processing audio analysis (port 8000)
2. **Server** - Express.js server handling file uploads (port 4000)
3. **Backend** - Node.js backend services with MongoDB (port 5001)
4. **Frontend Port 3000** - React frontend on default port 
5. **Frontend Port 3001** - Secondary frontend instance (useful for testing)

## Usage Options

The script supports several command-line options:

```bash
# Basic usage - start all services in new terminal windows
./start_harmonix_split_terminals.sh

# Skip dependency installation (faster startup after first run)
./start_harmonix_split_terminals.sh --skip-install

# Don't automatically open browser
./start_harmonix_split_terminals.sh --no-browser

# Show help and available options
./start_harmonix_split_terminals.sh --help
```

## For zsh Users

If you're using zsh as your default shell, you can use the zsh-specific wrapper:

```bash
./start_harmonix_zsh.sh
```

This ensures full compatibility with zsh-specific features.

## Tips for Development

- Each terminal window is named according to the service it's running
- Service logs appear in real-time in each window
- To stop a specific service, close its terminal window
- To restart a service, close its window and run the script with `--skip-install` flag
- Each service has a `/health` endpoint for checking its status

## Troubleshooting

- If port conflicts occur, the script will warn you about already used ports
- If a service fails to start, check its terminal window for error messages
- MongoDB connection issues will be visible in the Backend terminal
- Python dependency issues will appear in the Python Service terminal

## Operating System Support

The script automatically detects your OS and uses appropriate terminal commands:

- **macOS**: 
  - Uses iTerm2 if available (recommended for best experience)
  - Falls back to Terminal.app with enhanced compatibility
  - Properly sets terminal title and appearance
- **Linux**: Uses gnome-terminal, x-terminal-emulator, or xterm
- **Windows**: Uses cmd.exe with custom batch files

### macOS Notes

For the best experience on macOS:
- iTerm2 is recommended and will be used automatically if installed
- Terminal.app support has been improved for better stability
- Terminal windows will be properly named to match the services they run
- You can also use the macOS-specific script: `./start_harmonix_macos.sh`

## Contributing

When adding new services or features to Harmonix:

1. Update the `start_harmonix_split_terminals.sh` script
2. Add appropriate health check endpoints
3. Test across multiple operating systems if possible
