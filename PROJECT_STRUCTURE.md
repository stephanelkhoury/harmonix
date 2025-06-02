# Harmonix Project Structure

## Root Directory Structure

```
harmonix/
├── README.md                           # Project overview and main documentation
├── .gitignore                         # Git ignore patterns
├── .frontend.pid                      # Frontend process ID file
├── .python.pid                       # Python service process ID file
├── .server.pid                       # Server process ID file
├── admin/                            # Admin panel and authentication fixes
├── backend/                          # Node.js backend server
├── client/                           # Alternative client implementation
├── config/                           # Configuration files and templates
├── data/                             # Database and data storage
├── docs/                             # Documentation and guides
├── frontend/                         # React frontend application
├── logs/                             # Application logs
├── LyricsData/                       # Lyrics extraction results
├── notebooks/                        # Jupyter notebooks for analysis
├── python_service/                   # Python audio processing service
├── samples/                          # Sample files and demos
├── scripts/                          # Automation and utility scripts
├── server/                           # Express server implementation
├── SongChords/                       # Chord analysis results
├── tests/                            # Test files and test utilities
└── uploads/                          # User uploaded files
```

## Detailed Directory Descriptions

### `/admin/`
Contains admin panel fixes, authentication systems, and administrative tools:
- HTML admin interfaces
- JavaScript authentication fixes
- Shell scripts for admin access
- Admin API testing tools

### `/backend/`
Node.js backend server implementation:
- `server.js` - Main server file
- `package.json` - Node.js dependencies
- `uploads/` - Backend file uploads

### `/client/`
Alternative client implementation:
- Dockerfile for containerization
- React application source
- Public assets

### `/config/`
Configuration files and templates:
- `config.js` - Main configuration
- Environment templates (`.env.template` files)
- Docker Compose configuration
- Configuration utilities

### `/data/`
Data storage and database files:
- `db/` - Database files
- Persistent data storage

### `/docs/`
Comprehensive documentation:
- Technical guides and fixes
- Setup and deployment documentation
- Troubleshooting guides
- API documentation

### `/frontend/`
Main React frontend application:
- `src/` - React source code
- `public/` - Static assets
- `build/` - Production build files
- Dockerfile for containerization

### `/logs/`
Application log files:
- Backend service logs
- Frontend build logs
- Python service logs
- Debug information

### `/python_service/`
Python audio processing service:
- Machine learning models
- Audio analysis algorithms
- Chord recognition systems
- Dockerfile for containerization

### `/samples/`
Sample files and demonstrations:
- `demos/` - HTML demos and examples
- Audio sample files
- Test data

### `/scripts/`
Automation and utility scripts organized by function:

#### `/scripts/management/`
- Server start/stop scripts
- Process management utilities
- Service orchestration

#### `/scripts/setup/`
- Installation and setup scripts
- Platform-specific setup (macOS, Windows)
- Environment configuration

#### `/scripts/testing/`
- Test execution scripts
- Performance testing
- Integration test runners

#### `/scripts/utils/`
- Network diagnostics
- Performance optimization
- Development utilities

### `/tests/`
Test files organized by type:

#### `/tests/html/`
- HTML test pages
- Browser-based tests
- UI component tests

#### `/tests/js/`
- JavaScript unit tests
- WebSocket connection tests
- Frontend logic tests

#### `/tests/integration/`
- Full system integration tests
- End-to-end test scripts
- Environment testing

### `/uploads/`
User uploaded files:
- Audio files for analysis
- Temporary file storage
- Upload processing queue

## File Organization Principles

1. **Separation of Concerns**: Each directory has a specific purpose
2. **Environment Separation**: Different environments (dev, prod) have separate configs
3. **Language Separation**: Frontend (JS/React) and backend (Node.js/Python) are clearly separated
4. **Test Organization**: Tests are organized by type and functionality
5. **Documentation Centralization**: All docs are in `/docs/` with clear naming
6. **Script Categorization**: Scripts are organized by function (setup, management, testing, utils)

## Quick Navigation

- **Start here**: `README.md` and `docs/QUICK_START.md`
- **Setup**: `scripts/setup/` and `docs/LOCAL_SETUP.md`
- **Configuration**: `config/` directory
- **Development**: `frontend/src/` and `backend/`
- **Testing**: `tests/` directory
- **Documentation**: `docs/` directory
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`
