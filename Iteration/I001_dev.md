Summary of Improvements to dev.sh

I've successfully enhanced the dev.sh script with comprehensive improvements. Here's what changed:

Core Improvements

1. Modernized Docker Commands

- Updated all docker-compose commands to docker compose (v2 syntax)
- Better compatibility with modern Docker installations

2. Enhanced Error Handling

- Added set -o pipefail for better error detection
- Improved error messages with actionable suggestions
- Better validation before operations
- Added graceful shutdown handling with SIGINT/SIGTERM traps

3. Port Management

- New port availability checking before starting services
- ports command to see what's using each port
- Proactive port conflict detection with detailed output
- Shows which process is using conflicting ports

4. New Utility Commands

- health - Comprehensive health check of all services (Docker, infrastructure, backend, frontend, config)
- clean - Clean node_modules and reinstall dependencies with confirmation
- lint - Run project linters
- build - Build projects for production
- backend-logs - View backend application logs
- frontend-logs - View frontend application logs
- open - Open application URLs in browser (macOS and Linux support)
- ports - Check port usage and conflicts

5. Better User Experience

- Organized help menu with categorized commands (Core, Infrastructure, Development, Database, Utility)
- Added helpful tips section in help output
- More informative status messages
- Cyan color added for section headers
- Better feedback during long-running operations

6. Improved Functions

- check_pnpm() - Centralized pnpm validation with helpful install instructions
- check_all_ports() - Comprehensive port conflict checking
- cleanup() - Graceful shutdown handler
- Enhanced infrastructure functions with better error messages
- Improved database setup with better feedback

7. Configuration

- Added port constants at the top for easy configuration
- PID file tracking for better process management
- Better working directory handling

New Commands Available

./dev.sh health # Comprehensive health check
./dev.sh ports # Check port conflicts
./dev.sh clean # Clean install
./dev.sh lint# Run linters
./dev.sh build # Build projects
./dev.sh open# Open URLs in browser
./dev.sh backend-logs# View backend logs
./dev.sh frontend-logs # View frontend logs

Enhanced Existing Commands

- start - Now checks for port conflicts before starting
- stop - More thorough process cleanup including PID file
- setup - Adds suggestion to use open command after setup
- All infrastructure commands have better error handling

The script is now more robust, user-friendly, and provides better diagnostics when issues occur.
