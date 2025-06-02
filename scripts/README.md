# Scripts Directory

This directory contains all automation and utility scripts for the Harmonix project, organized by function.

## Directory Structure

```
scripts/
├── management/          # Server and process management
├── setup/              # Installation and configuration
│   ├── start-scripts/  # Various startup scripts
│   └── macos-specific/ # macOS-specific setup scripts
├── testing/            # Test execution and validation
├── utils/              # Development and maintenance utilities
└── admin/              # Admin-related scripts
```

## Script Categories

### Management Scripts (`management/`)
Scripts for managing the Harmonix application:
- `manage_harmonix.sh` - Main management script
- `start_harmonix.sh` - Standard startup script
- `start-on-port-3000.sh` - Port-specific startup
- `stop_harmonix.sh` - Graceful shutdown script
- `harmonix-start.sh` - Alternative startup script
- `start_harmonix_fixed.sh` - Fixed version startup

### Setup Scripts (`setup/`)
Scripts for initial setup and configuration:

#### Main Setup
- `setup.sh` - Main setup script
- `project_info.sh` - Project information display

#### Start Scripts (`start-scripts/`)
- `start_harmonix.sh` - Basic startup
- `start_local.sh` - Local development startup
- `fixed_start_local.sh` - Fixed local startup
- `start.sh` - Generic start script
- `start_harmonix_split_terminals.sh` - Multi-terminal startup

#### macOS Specific (`macos-specific/`)
- `start_harmonix_macos.sh` - macOS optimized startup
- `run_harmonix_mac.sh` - macOS runner script
- `start_harmonix_zsh.sh` - Zsh shell specific startup

### Testing Scripts (`testing/`)
Scripts for testing and validation:
- `run_integration_tests.sh` - Integration test runner
- `test_environment.sh` - Environment testing
- `test_fixes.sh` - Fix validation
- `chord_accuracy_analyzer.py` - Chord recognition testing
- `test_optimized_integration.py` - Optimized integration tests
- `test_realtime_system.py` - Real-time system testing
- `verify_enhanced_chords.sh` - Enhanced chord validation

### Utility Scripts (`utils/`)
Development and maintenance utilities:
- `organize_project.sh` - Project organization maintenance
- `network_diagnosis.sh` - Network connectivity diagnosis
- `optimize_performance.py` - Performance optimization
- `capo_enhancement_plan.py` - Capo functionality enhancement
- `project_structure.sh` - Project structure analysis

## Usage Examples

### Starting Harmonix
```bash
# Standard startup
./scripts/management/start_harmonix.sh

# macOS specific startup
./scripts/setup/macos-specific/start_harmonix_macos.sh

# Local development with split terminals
./scripts/setup/start-scripts/start_harmonix_split_terminals.sh
```

### Running Tests
```bash
# Run integration tests
./scripts/testing/run_integration_tests.sh

# Test environment setup
./scripts/testing/test_environment.sh

# Analyze chord accuracy
python scripts/testing/chord_accuracy_analyzer.py
```

### Project Maintenance
```bash
# Organize project structure
./scripts/utils/organize_project.sh

# Diagnose network issues
./scripts/utils/network_diagnosis.sh

# Optimize performance
python scripts/utils/optimize_performance.py
```

## Best Practices

1. **Make scripts executable**: `chmod +x script_name.sh`
2. **Use absolute paths** when possible
3. **Include error handling** in all scripts
4. **Document script parameters** in comments
5. **Test scripts** before committing
6. **Follow naming conventions**:
   - Use lowercase with underscores
   - Include file extension (.sh, .py)
   - Use descriptive names

## Adding New Scripts

When adding new scripts:

1. **Choose the right directory** based on function
2. **Follow naming conventions**
3. **Add proper documentation**
4. **Make executable** if shell script
5. **Test thoroughly**
6. **Update this README** if adding new categories

## Dependencies

Some scripts may require:
- Node.js (for npm scripts)
- Python 3.9+ (for Python utilities)
- Docker (for containerized operations)
- macOS specific tools (for macOS scripts)

## Troubleshooting

If scripts fail to execute:
1. Check file permissions: `ls -la script_name.sh`
2. Make executable: `chmod +x script_name.sh`
3. Check dependencies are installed
4. Verify paths in script are correct
5. Check logs in `/logs/` directory
