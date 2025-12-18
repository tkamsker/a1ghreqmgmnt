#!/bin/bash

# Exit on error, undefined variables, and pipe failures
set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project directories
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
INFRA_DIR="$PROJECT_ROOT/infra"

# Required ports
POSTGRES_PORT=5432
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
BACKEND_PORT=4000
FRONTEND_PORT=3000

# PID file for tracking processes
PID_FILE="$PROJECT_ROOT/.dev-pids"

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    fi
    return 1  # Port is free
}

# Function to show what's using a port
show_port_usage() {
    local port=$1
    lsof -i :$port | tail -n +2
}

# Function to check all required ports
check_all_ports() {
    local has_conflicts=0

    if check_port $POSTGRES_PORT; then
        print_warning "Port $POSTGRES_PORT (PostgreSQL) is already in use:"
        show_port_usage $POSTGRES_PORT
        has_conflicts=1
    fi

    if check_port $MINIO_PORT; then
        print_warning "Port $MINIO_PORT (MinIO) is already in use:"
        show_port_usage $MINIO_PORT
        has_conflicts=1
    fi

    if check_port $MINIO_CONSOLE_PORT; then
        print_warning "Port $MINIO_CONSOLE_PORT (MinIO Console) is already in use:"
        show_port_usage $MINIO_CONSOLE_PORT
        has_conflicts=1
    fi

    if check_port $BACKEND_PORT; then
        print_warning "Port $BACKEND_PORT (Backend) is already in use:"
        show_port_usage $BACKEND_PORT
        has_conflicts=1
    fi

    if check_port $FRONTEND_PORT; then
        print_warning "Port $FRONTEND_PORT (Frontend) is already in use:"
        show_port_usage $FRONTEND_PORT
        has_conflicts=1
    fi

    return $has_conflicts
}

# Graceful shutdown handler
cleanup() {
    print_warning "\nReceived interrupt signal. Cleaning up..."
    if [ -f "$PID_FILE" ]; then
        while read pid; do
            if ps -p $pid > /dev/null 2>&1; then
                kill $pid 2>/dev/null || true
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

# Function to check if Docker is installed
check_docker_installed() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    print_success "Docker is installed"
}

# Function to check if Docker daemon is running
check_docker_running() {
    if ! docker info &> /dev/null; then
        return 1
    fi
    return 0
}

# Function to start Docker (macOS specific)
start_docker() {
    print_info "Checking Docker status..."

    if check_docker_running; then
        print_success "Docker is already running"
        return 0
    fi

    print_warning "Docker is not running. Attempting to start..."

    # Try to start Docker Desktop on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open -a Docker
        print_info "Waiting for Docker to start (this may take 30-60 seconds)..."

        # Wait for Docker to start (max 60 seconds)
        local count=0
        while ! check_docker_running; do
            sleep 2
            count=$((count + 2))
            if [ $count -ge 60 ]; then
                print_error "Docker failed to start after 60 seconds. Please start Docker Desktop manually."
                exit 1
            fi
            echo -n "."
        done
        echo ""
        print_success "Docker started successfully"
    else
        print_error "Please start Docker manually and try again"
        exit 1
    fi
}

# Function to check if infrastructure is running
check_infrastructure() {
    # Check if containers are running by looking for our specific containers
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "a1ghreqmgmnt-postgres" && \
       docker ps --format '{{.Names}}' 2>/dev/null | grep -q "a1ghreqmgmnt-minio"; then
        return 0
    fi
    return 1
}

# Function to check pnpm is installed
check_pnpm() {
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed"
        print_info "Install it with: npm install -g pnpm"
        print_info "Or visit: https://pnpm.io/installation"
        exit 1
    fi
}

# Function to start infrastructure services
start_infrastructure() {
    print_header "Starting Infrastructure Services"

    cd "$INFRA_DIR" || exit 1

    if check_infrastructure; then
        print_warning "Infrastructure services are already running"
        docker compose ps
    else
        print_info "Starting PostgreSQL and MinIO..."
        if ! docker compose up -d; then
            print_error "Failed to start infrastructure services"
            print_info "Try: ./dev.sh infra-logs to see what went wrong"
            exit 1
        fi

        # Wait for PostgreSQL to be ready
        print_info "Waiting for PostgreSQL to be ready..."
        sleep 5

        local count=0
        while ! docker compose exec -T postgres pg_isready -U postgres &> /dev/null; do
            sleep 2
            count=$((count + 2))
            if [ $count -ge 30 ]; then
                print_error "PostgreSQL failed to start after 30 seconds"
                print_info "Check logs with: ./dev.sh infra-logs"
                exit 1
            fi
            echo -n "."
        done
        echo ""
        print_success "Infrastructure services started"
        docker compose ps
    fi
}

# Function to stop infrastructure services
stop_infrastructure() {
    print_header "Stopping Infrastructure Services"

    cd "$INFRA_DIR" || exit 1
    if docker compose down; then
        print_success "Infrastructure services stopped"
    else
        print_error "Failed to stop infrastructure services"
        exit 1
    fi
}

# Function to check if .env files exist
check_env_files() {
    print_header "Checking Environment Files"

    local missing_files=0

    if [ ! -f "$BACKEND_DIR/.env" ]; then
        print_warning "Backend .env file not found. Copying from .env.example..."
        cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
        print_success "Created backend/.env"
    else
        print_success "Backend .env exists"
    fi

    if [ ! -f "$FRONTEND_DIR/.env" ]; then
        print_warning "Frontend .env file not found. Copying from .env.example..."
        cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
        print_success "Created frontend/.env"
    else
        print_success "Frontend .env exists"
    fi
}

# Function to install dependencies
install_dependencies() {
    print_header "Installing Dependencies"

    check_pnpm

    print_info "Installing project dependencies..."
    cd "$PROJECT_ROOT" || exit 1
    if pnpm install; then
        print_success "Dependencies installed"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Function to setup database
setup_database() {
    print_header "Setting Up Database"

    cd "$BACKEND_DIR" || exit 1

    # Check if migrations have been run
    print_info "Running Prisma migrations..."
    pnpm prisma migrate dev --name init

    print_info "Generating Prisma client..."
    pnpm prisma generate

    print_info "Seeding database..."
    pnpm prisma db seed

    print_success "Database setup complete"
    print_info "Default Super Admin credentials:"
    print_info "  Email: admin@example.com"
    print_info "  Password: admin123"
}

# Function to run tests
run_tests() {
    print_header "Running Backend Tests"

    cd "$BACKEND_DIR" || exit 1
    print_info "Running all tests..."
    pnpm test
}

# Function to run e2e tests
run_e2e_tests() {
    print_header "Running E2E Tests"

    check_pnpm

    # Check if all services are running
    if ! check_port $BACKEND_PORT; then
        print_error "Backend is not running on port $BACKEND_PORT"
        print_info "Please start backend with: ./dev.sh backend"
        exit 1
    fi

    if ! check_port $FRONTEND_PORT; then
        print_error "Frontend is not running on port $FRONTEND_PORT"
        print_info "Please start frontend with: ./dev.sh frontend"
        exit 1
    fi

    if ! check_infrastructure; then
        print_error "Infrastructure services are not running"
        print_info "Please start infrastructure with: ./dev.sh infra"
        exit 1
    fi

    print_success "All services are running"
    print_info "Running Playwright E2E tests..."
    print_info ""

    cd "$FRONTEND_DIR" || exit 1
    pnpm test:e2e
}

# Function to run e2e tests in UI mode
run_e2e_ui() {
    print_header "Running E2E Tests in UI Mode"

    check_pnpm

    print_info "Opening Playwright Test UI..."
    cd "$FRONTEND_DIR" || exit 1
    pnpm test:e2e:ui
}

# Function to start development servers
start_dev_servers() {
    print_header "Starting Development Servers"

    print_info "Starting backend and frontend in development mode..."
    print_info "Backend will be available at: http://localhost:4000/graphql"
    print_info "Frontend will be available at: http://localhost:3000"
    print_info ""
    print_warning "Press Ctrl+C to stop all servers"
    print_info ""

    cd "$PROJECT_ROOT" || exit 1
    pnpm dev
}

# Function to start only backend
start_backend() {
    print_header "Starting Backend Development Server"

    check_pnpm

    if ! check_infrastructure; then
        print_error "Infrastructure services are not running"
        print_info "Please run: ./dev.sh infra-start"
        exit 1
    fi

    # Check if port is already in use
    if check_port $BACKEND_PORT; then
        print_error "Port $BACKEND_PORT is already in use!"
        print_info ""
        print_info "Process using port $BACKEND_PORT:"
        show_port_usage $BACKEND_PORT
        print_info ""
        read -p "Kill the existing process and start? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Stopping existing backend process..."
            local pid=$(lsof -ti :$BACKEND_PORT)
            if [ ! -z "$pid" ]; then
                kill $pid 2>/dev/null || kill -9 $pid 2>/dev/null
                sleep 2
                print_success "Existing process stopped"
            fi
        else
            print_info "Backend startup cancelled"
            exit 0
        fi
    fi

    print_info "Starting backend in development mode..."
    print_info "Backend will be available at: http://localhost:${BACKEND_PORT}/graphql"
    print_info ""
    print_warning "Press Ctrl+C to stop the backend server"
    print_info ""

    cd "$BACKEND_DIR" || exit 1
    pnpm start:dev
}

# Function to start only frontend
start_frontend() {
    print_header "Starting Frontend Development Server"

    check_pnpm

    # Check if port is already in use
    if check_port $FRONTEND_PORT; then
        print_error "Port $FRONTEND_PORT is already in use!"
        print_info ""
        print_info "Process using port $FRONTEND_PORT:"
        show_port_usage $FRONTEND_PORT
        print_info ""
        read -p "Kill the existing process and start? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Stopping existing frontend process..."
            local pid=$(lsof -ti :$FRONTEND_PORT)
            if [ ! -z "$pid" ]; then
                kill $pid 2>/dev/null || kill -9 $pid 2>/dev/null
                sleep 2
                print_success "Existing process stopped"
            fi
        else
            print_info "Frontend startup cancelled"
            exit 0
        fi
    fi

    print_info "Starting frontend in development mode..."
    print_info "Frontend will be available at: http://localhost:${FRONTEND_PORT}"
    print_info "Make sure backend is running at: http://localhost:${BACKEND_PORT}/graphql"
    print_info ""
    print_warning "Press Ctrl+C to stop the frontend server"
    print_info ""

    cd "$FRONTEND_DIR" || exit 1
    pnpm dev
}

# Function to start only infrastructure
start_infra_only() {
    print_header "Starting Infrastructure Only"

    check_docker_installed
    start_docker
    start_infrastructure

    print_success "Infrastructure is ready!"
    print_info ""
    print_info "Next steps for development:"
    print_info "  Terminal 1: ./dev.sh backend"
    print_info "  Terminal 2: ./dev.sh frontend"
    print_info ""
    print_info "Or use: ./dev.sh dev (to start both together)"
}

# Function to show status
show_status() {
    print_header "System Status"

    # Docker status
    echo -e "${BLUE}Docker:${NC}"
    if check_docker_running; then
        print_success "Running"
    else
        print_error "Not running"
    fi

    # Infrastructure status
    echo -e "\n${BLUE}Infrastructure Services:${NC}"
    cd "$INFRA_DIR" || exit 1
    if check_infrastructure; then
        docker-compose ps
    else
        print_warning "Not running"
    fi

    # Environment files
    echo -e "\n${BLUE}Environment Files:${NC}"
    if [ -f "$BACKEND_DIR/.env" ]; then
        print_success "backend/.env exists"
    else
        print_error "backend/.env missing"
    fi

    if [ -f "$FRONTEND_DIR/.env" ]; then
        print_success "frontend/.env exists"
    else
        print_error "frontend/.env missing"
    fi

    # Node modules
    echo -e "\n${BLUE}Dependencies:${NC}"
    if [ -d "$PROJECT_ROOT/node_modules" ]; then
        print_success "Dependencies installed"
    else
        print_warning "Dependencies not installed (run: ./dev.sh install)"
    fi
}

# Function to show logs
show_logs() {
    print_header "Infrastructure Logs"
    cd "$INFRA_DIR" || exit 1
    docker compose logs -f
}

# Function to show backend logs
show_backend_logs() {
    print_header "Backend Logs"
    print_info "Showing backend logs (Ctrl+C to exit)..."
    cd "$BACKEND_DIR" || exit 1
    # If backend is running via pnpm, try to show its logs
    if pgrep -f "nest start" > /dev/null; then
        print_info "Backend is running. Logs will appear here..."
        tail -f "$BACKEND_DIR/logs/"*.log 2>/dev/null || print_warning "No log files found. Backend may be logging to console only."
    else
        print_warning "Backend is not running"
    fi
}

# Function to show frontend logs
show_frontend_logs() {
    print_header "Frontend Logs"
    print_info "Showing frontend logs (Ctrl+C to exit)..."
    cd "$FRONTEND_DIR" || exit 1
    # If frontend is running via pnpm, try to show its logs
    if pgrep -f "next dev" > /dev/null; then
        print_info "Frontend is running. Logs will appear here..."
        tail -f "$FRONTEND_DIR/logs/"*.log 2>/dev/null || print_warning "No log files found. Frontend may be logging to console only."
    else
        print_warning "Frontend is not running"
    fi
}

# Function to clean and reinstall
clean_install() {
    print_header "Cleaning and Reinstalling"

    read -p "This will remove all node_modules and reinstall. Continue? (y/N) " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Clean install cancelled"
        return
    fi

    check_pnpm

    print_info "Removing node_modules..."
    rm -rf "$PROJECT_ROOT/node_modules"
    rm -rf "$BACKEND_DIR/node_modules"
    rm -rf "$FRONTEND_DIR/node_modules"

    print_info "Removing lock files..."
    rm -f "$PROJECT_ROOT/pnpm-lock.yaml"

    print_success "Cleaned successfully"

    install_dependencies
}

# Function to run linting
run_lint() {
    print_header "Running Linters"

    check_pnpm

    cd "$PROJECT_ROOT" || exit 1

    if [ -f "package.json" ] && grep -q '"lint"' package.json; then
        print_info "Running lint command..."
        pnpm lint
        print_success "Linting complete"
    else
        print_warning "No lint script found in package.json"
    fi
}

# Function to build projects
build_projects() {
    print_header "Building Projects"

    check_pnpm

    cd "$PROJECT_ROOT" || exit 1

    if [ -f "package.json" ] && grep -q '"build"' package.json; then
        print_info "Running build command..."
        pnpm build
        print_success "Build complete"
    else
        print_warning "No build script found in package.json"
    fi
}

# Function to check health of services
check_health() {
    print_header "Health Check"

    local all_healthy=true

    # Check Docker
    echo -e "${CYAN}Docker Daemon:${NC}"
    if check_docker_running; then
        print_success "Running"
    else
        print_error "Not running"
        all_healthy=false
    fi

    # Check Infrastructure
    echo -e "\n${CYAN}Infrastructure Services:${NC}"
    if check_infrastructure; then
        print_success "Running"

        # Check PostgreSQL connectivity
        cd "$INFRA_DIR" || exit 1
        if docker compose exec -T postgres pg_isready -U postgres &> /dev/null; then
            print_success "PostgreSQL is ready"
        else
            print_error "PostgreSQL is not responding"
            all_healthy=false
        fi
    else
        print_error "Not running"
        all_healthy=false
    fi

    # Check Backend
    echo -e "\n${CYAN}Backend Service:${NC}"
    if check_port $BACKEND_PORT; then
        print_success "Running on port $BACKEND_PORT"
        # Try to reach the GraphQL endpoint
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$BACKEND_PORT/graphql" | grep -q "200\|400"; then
            print_success "GraphQL endpoint is responding"
        else
            print_warning "GraphQL endpoint may not be ready"
        fi
    else
        print_warning "Not running"
    fi

    # Check Frontend
    echo -e "\n${CYAN}Frontend Service:${NC}"
    if check_port $FRONTEND_PORT; then
        print_success "Running on port $FRONTEND_PORT"
    else
        print_warning "Not running"
    fi

    # Check Environment Files
    echo -e "\n${CYAN}Configuration:${NC}"
    local config_ok=true
    if [ -f "$BACKEND_DIR/.env" ]; then
        print_success "Backend .env exists"
    else
        print_error "Backend .env missing"
        config_ok=false
        all_healthy=false
    fi

    if [ -f "$FRONTEND_DIR/.env" ]; then
        print_success "Frontend .env exists"
    else
        print_error "Frontend .env missing"
        config_ok=false
        all_healthy=false
    fi

    # Summary
    echo -e "\n${CYAN}Overall Status:${NC}"
    if $all_healthy; then
        print_success "All systems operational"
        return 0
    else
        print_error "Some systems need attention"
        return 1
    fi
}

# Function to open URLs in browser
open_urls() {
    print_header "Opening Application URLs"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        print_info "Opening URLs in browser..."
        open "http://localhost:$FRONTEND_PORT" 2>/dev/null || print_warning "Could not open frontend URL"
        sleep 1
        open "http://localhost:$BACKEND_PORT/graphql" 2>/dev/null || print_warning "Could not open backend URL"
        sleep 1
        open "http://localhost:$MINIO_CONSOLE_PORT" 2>/dev/null || print_warning "Could not open MinIO URL"
        print_success "URLs opened"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_info "Opening URLs in browser..."
        xdg-open "http://localhost:$FRONTEND_PORT" 2>/dev/null || print_warning "Could not open frontend URL"
        sleep 1
        xdg-open "http://localhost:$BACKEND_PORT/graphql" 2>/dev/null || print_warning "Could not open backend URL"
        sleep 1
        xdg-open "http://localhost:$MINIO_CONSOLE_PORT" 2>/dev/null || print_warning "Could not open MinIO URL"
        print_success "URLs opened"
    else
        print_error "Unsupported operating system for auto-opening URLs"
        print_info "Please open these URLs manually:"
        print_info "  Frontend:  http://localhost:$FRONTEND_PORT"
        print_info "  Backend:   http://localhost:$BACKEND_PORT/graphql"
        print_info "  MinIO:     http://localhost:$MINIO_CONSOLE_PORT"
    fi
}

# Function to reset database
reset_database() {
    print_header "Resetting Database"

    print_warning "This will delete all data in the database!"
    read -p "Are you sure you want to continue? (y/N) " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Database reset cancelled"
        return
    fi

    cd "$BACKEND_DIR" || exit 1

    print_info "Resetting database..."
    pnpm prisma migrate reset --force

    print_info "Seeding database..."
    pnpm prisma db seed

    print_success "Database reset complete"
}

# Function to show help
show_help() {
    cat << EOF
${BLUE}Requirements Management System - Development Script${NC}

${YELLOW}Usage:${NC}
  ./dev.sh [command]

${YELLOW}Core Commands:${NC}
  ${GREEN}setup${NC}              - Complete initial setup (install, env files, docker, database)
  ${GREEN}start${NC}              - Start all services (infrastructure + dev servers)
  ${GREEN}stop${NC}               - Stop all services
  ${GREEN}restart${NC}            - Restart all services
  ${GREEN}status${NC}             - Show status of all services
  ${GREEN}health${NC}             - Run comprehensive health check on all services

${YELLOW}Infrastructure Commands:${NC}
  ${GREEN}docker${NC}             - Check and start Docker if needed
  ${GREEN}infra-start${NC}       - Start infrastructure services (PostgreSQL, MinIO)
  ${GREEN}infra-stop${NC}        - Stop infrastructure services
  ${GREEN}infra-logs${NC}        - Show infrastructure logs (alias: logs)

${YELLOW}Development Commands:${NC}
  ${GREEN}dev${NC}                - Start development servers (backend + frontend together)
  ${GREEN}backend${NC}            - Start ONLY backend server (requires infrastructure)
  ${GREEN}frontend${NC}           - Start ONLY frontend server
  ${GREEN}infra${NC}              - Start ONLY infrastructure (for separate terminal workflow)
  ${GREEN}install${NC}            - Install dependencies
  ${GREEN}clean${NC}              - Clean node_modules and reinstall dependencies
  ${GREEN}lint${NC}               - Run linters
  ${GREEN}build${NC}              - Build projects for production
  ${GREEN}test${NC}               - Run backend tests
  ${GREEN}test:e2e${NC}           - Run E2E tests with Playwright
  ${GREEN}test:e2e:ui${NC}        - Run E2E tests in interactive UI mode

${YELLOW}Database Commands:${NC}
  ${GREEN}db-setup${NC}          - Setup database (migrate + seed)
  ${GREEN}db-reset${NC}          - Reset database (WARNING: deletes all data)

${YELLOW}Utility Commands:${NC}
  ${GREEN}backend-logs${NC}      - Show backend application logs
  ${GREEN}frontend-logs${NC}     - Show frontend application logs
  ${GREEN}open${NC}               - Open application URLs in browser
  ${GREEN}ports${NC}              - Check which ports are in use
  ${GREEN}help${NC}               - Show this help message

${YELLOW}Examples:${NC}
  ./dev.sh setup             # First time setup
  ./dev.sh start             # Start everything (infra + dev servers together)

  ${CYAN}# Multi-terminal workflow (recommended for feature/dev branches):${NC}
  ./dev.sh infra             # Terminal 1: Start infrastructure
  ./dev.sh backend           # Terminal 2: Start backend
  ./dev.sh frontend          # Terminal 3: Start frontend

  ./dev.sh health            # Check all services are healthy
  ./dev.sh test              # Run tests
  ./dev.sh open              # Open URLs in browser
  ./dev.sh stop              # Stop everything

${YELLOW}URLs:${NC}
  Frontend:  http://localhost:${FRONTEND_PORT}
  Backend:   http://localhost:${BACKEND_PORT}/graphql
  MinIO:     http://localhost:${MINIO_CONSOLE_PORT} (admin/admin123)

${YELLOW}Default Credentials:${NC}
  Email:     admin@example.com
  Password:  admin123

${YELLOW}Tips:${NC}
  • Run './dev.sh health' to diagnose issues
  • Use './dev.sh ports' to check for port conflicts
  • Check logs with './dev.sh infra-logs' or './dev.sh backend-logs'

EOF
}

# Main script logic
case "${1:-help}" in
    setup)
        print_header "Complete Setup"
        check_docker_installed
        start_docker
        check_env_files
        install_dependencies
        start_infrastructure
        setup_database
        print_success "Setup complete! Run './dev.sh start' to start development servers"
        print_info "Or run './dev.sh open' to open the application URLs in your browser"
        ;;

    start)
        check_docker_installed
        start_docker
        check_all_ports || print_warning "Some ports are already in use. This may cause conflicts."
        start_infrastructure
        print_info ""
        print_info "Infrastructure is ready. Starting development servers..."
        sleep 2
        start_dev_servers
        ;;

    stop)
        print_info "Stopping development servers..."
        pkill -f "node.*next dev" 2>/dev/null || true
        pkill -f "node.*nest start" 2>/dev/null || true
        pkill -f "pnpm.*dev" 2>/dev/null || true
        stop_infrastructure
        rm -f "$PID_FILE" 2>/dev/null || true
        print_success "All services stopped"
        ;;

    restart)
        $0 stop
        sleep 2
        $0 start
        ;;

    status)
        show_status
        ;;

    health)
        check_health
        ;;

    docker)
        check_docker_installed
        start_docker
        ;;

    infra-start)
        check_docker_installed
        start_docker
        start_infrastructure
        ;;

    infra-stop)
        stop_infrastructure
        ;;

    infra-logs|logs)
        show_logs
        ;;

    backend-logs)
        show_backend_logs
        ;;

    frontend-logs)
        show_frontend_logs
        ;;

    install)
        install_dependencies
        ;;

    clean)
        clean_install
        ;;

    lint)
        run_lint
        ;;

    build)
        build_projects
        ;;

    db-setup)
        setup_database
        ;;

    db-reset)
        reset_database
        ;;

    test)
        run_tests
        ;;

    test:e2e)
        run_e2e_tests
        ;;

    test:e2e:ui)
        run_e2e_ui
        ;;

    dev)
        start_dev_servers
        ;;

    backend)
        start_backend
        ;;

    frontend)
        start_frontend
        ;;

    infra)
        start_infra_only
        ;;

    open)
        open_urls
        ;;

    ports)
        print_header "Port Status"
        check_all_ports
        if [ $? -eq 0 ]; then
            print_warning "No port conflicts detected, but some services may be running"
        else
            print_info "Port conflicts detected above"
        fi
        ;;

    help|--help|-h)
        show_help
        ;;

    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
