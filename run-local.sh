#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo "=========================================================="
echo "    TechStore Pentest Lab - Startup Runner               "
echo "=========================================================="

echo "[1/3] Menjalankan Database PostgreSQL (Docker Compose)..."
docker compose up -d

echo "[2/3] Memulai Backend API (Express.js on port 5000)..."
(cd backend && npm run dev) &
BACKEND_PID=$!

echo "[3/3] Memulai Frontend (Next.js on port 3000)..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo ">> Mematikan service backend dan frontend..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo ">> Selesai."
    exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo "=========================================================="
echo "  Semua service telah aktif:"
echo "  - Database : localhost:5433 (PostgreSQL)"
echo "  - Backend  : http://localhost:5000"
echo "  - Frontend : http://localhost:3000"
echo "  Tekan Ctrl+C untuk menghentikan server."
echo "=========================================================="

wait
