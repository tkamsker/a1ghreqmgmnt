Now You Can Start Fresh

# Terminal 1 - Infrastructure (if not running)

./dev.sh infra

# Terminal 2 - Backend (will now handle port conflicts)

./dev.sh backend

# Terminal 3 - Frontend (will also handle port conflicts)

./dev.sh frontend

Other Useful Commands

# Check what's running on all ports

./dev.sh ports

# Health check everything

./dev.sh health

# Stop everything cleanly

./dev.sh stop

What Was Happening

- You had a backend process (PID 6201) already running on port 4000
- Trying to start another backend caused the EADDRINUSE error
- The old process was probably from running ./dev.sh start or pnpm dev earlier
- Now the script detects this and offers to stop the old process automatically

Try running ./dev.sh backend again - it should work perfectly now! 🚀
