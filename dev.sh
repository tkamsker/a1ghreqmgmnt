#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project directories
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
INFRA_DIR="$PROJECT_ROOT/infra"

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
    cd "$INFRA_DIR" || exit 1

    if docker-compose ps | grep -q "Up"; then
        return 0
    fi
    return 1
}

# Function to start infrastructure services
start_infrastructure() {
    print_header "Starting Infrastructure Services"

    cd "$INFRA_DIR" || exit 1

    if check_infrastructure; then
        print_warning "Infrastructure services are already running"
        docker-compose ps
    else
        print_info "Starting PostgreSQL and MinIO..."
        docker-compose up -d

        # Wait for PostgreSQL to be ready
        print_info "Waiting for PostgreSQL to be ready..."
        sleep 5

        local count=0
        while ! docker-compose exec -T postgres pg_isready -U postgres &> /dev/null; do
            sleep 2
            count=$((count + 2))
            if [ $count -ge 30 ]; then
                print_error "PostgreSQL failed to start"
                exit 1
            fi
            echo -n "."
        done
        echo ""
        print_success "Infrastructure services started"
        docker-compose ps
    fi
}

# Function to stop infrastructure services
stop_infrastructure() {
    print_header "Stopping Infrastructure Services"

    cd "$INFRA_DIR" || exit 1
    docker-compose down
    print_success "Infrastructure services stopped"
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

    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed. Please install it with: npm install -g pnpm"
        exit 1
    fi

    print_info "Installing project dependencies..."
    pnpm install
    print_success "Dependencies installed"
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
    docker-compose logs -f
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

${YELLOW}Commands:${NC}
  ${GREEN}setup${NC}           - Complete initial setup (install, env files, docker, database)
  ${GREEN}start${NC}           - Start all services (infrastructure + dev servers)
  ${GREEN}stop${NC}            - Stop all services
  ${GREEN}restart${NC}         - Restart all services
  ${GREEN}status${NC}          - Show status of all services

  ${GREEN}docker${NC}          - Check and start Docker if needed
  ${GREEN}infra-start${NC}    - Start infrastructure services (PostgreSQL, MinIO)
  ${GREEN}infra-stop${NC}     - Stop infrastructure services
  ${GREEN}infra-logs${NC}     - Show infrastructure logs

  ${GREEN}install${NC}         - Install dependencies
  ${GREEN}db-setup${NC}       - Setup database (migrate + seed)
  ${GREEN}db-reset${NC}       - Reset database (WARNING: deletes all data)
  ${GREEN}test${NC}            - Run backend tests

  ${GREEN}dev${NC}             - Start development servers (backend + frontend)
  ${GREEN}logs${NC}            - Show infrastructure logs
  ${GREEN}help${NC}            - Show this help message

${YELLOW}Examples:${NC}
  ./dev.sh setup          # First time setup
  ./dev.sh start          # Start everything
  ./dev.sh status         # Check what's running
  ./dev.sh test           # Run tests
  ./dev.sh stop           # Stop everything

${YELLOW}URLs:${NC}
  Frontend:  http://localhost:3000
  Backend:   http://localhost:4000/graphql
  MinIO:     http://localhost:9001 (admin/admin123)

${YELLOW}Default Credentials:${NC}
  Email:     admin@example.com
  Password:  admin123

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
        ;;

    start)
        check_docker_installed
        start_docker
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
        stop_infrastructure
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

    install)
        install_dependencies
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

    dev)
        start_dev_servers
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
