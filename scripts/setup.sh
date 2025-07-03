#!/bin/bash

# ============================================================================
# Project Setup Script (setup.sh)
# ============================================================================
# Automates installation of all required dependencies for local development and CI.
# Updates fossils/setup_status.yml after each step.
# Idempotent and safe to run multiple times.
# Uses fossils/setup_status.template.yml as the canonical template.
# ============================================================================

set -e

FOSSIL_STATUS_FILE="fossils/setup_status.yml"
FOSSIL_TEMPLATE_FILE="fossils/setup_status.template.yml"
PLATFORM="$(uname -s)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_status() {
  local color=$1
  local message=$2
  echo -e "${color}${message}${NC}"
}

# Check for yq dependency, install if missing
if ! command -v yq &>/dev/null; then
  print_status $YELLOW "⚠️  'yq' not found. Attempting to install..."
  if [[ "$PLATFORM" == "Darwin" ]]; then
    if command -v brew &>/dev/null; then
      brew install yq || { print_status $RED "❌ Failed to install yq via Homebrew. Please install manually."; exit 1; }
    else
      print_status $RED "❌ Homebrew not found. Please install yq manually (https://github.com/mikefarah/yq)."; exit 1;
    fi
  elif [[ "$PLATFORM" == "Linux" ]]; then
    if command -v apt &>/dev/null; then
      sudo apt-get update && sudo apt-get install -y yq || { print_status $RED "❌ Failed to install yq via apt. Please install manually."; exit 1; }
    else
      print_status $RED "❌ apt not found. Please install yq manually (https://github.com/mikefarah/yq)."; exit 1;
    fi
  else
    print_status $RED "❌ Unsupported platform for auto-install. Please install yq manually (https://github.com/mikefarah/yq)."; exit 1;
  fi
  if command -v yq &>/dev/null; then
    print_status $GREEN "✅ yq installed successfully."
  else
    print_status $RED "❌ yq installation failed. Please install manually."
    exit 1
  fi
fi

# Define Ollama models to track
OLLAMA_MODELS=("llama2" "mistral" "phi3" "codellama")

# Initialize fossil from scratch if missing
if [[ ! -f "$FOSSIL_STATUS_FILE" ]]; then
  print_status $YELLOW "⚠️  setup_status.yml not found. Creating canonical fossil."
  cat > "$FOSSIL_STATUS_FILE" <<EOF
# ============================================================================
# CANONICAL SETUP STATUS FOSSIL
# ============================================================================
summary:
  status: planned
  lastUpdated: null
  notes: |
    This file is updated after each setup step. Statuses: planned, in-progress, done, failed.
    See README.md for troubleshooting and onboarding instructions.
  llm_available: false
steps:
  bun:
    status: planned
    version: null
    lastChecked: null
    notes: Bun JavaScript runtime. Required for all automation.
  github_cli:
    status: planned
    version: null
    lastChecked: null
    notes: GitHub CLI (gh). Required for GitHub automation.
  ollama:
    status: planned
    version: null
    lastChecked: null
    notes: Ollama local LLM runtime. Required for local LLM features.
  ollama_models:
EOF
  for MODEL in "${OLLAMA_MODELS[@]}"; do
    cat >> "$FOSSIL_STATUS_FILE" <<EOF
    $MODEL:
      status: planned
      lastChecked: null
      notes: $MODEL model for local LLM.
EOF
  done
  cat >> "$FOSSIL_STATUS_FILE" <<EOF
  llm_provider:
    status: planned
    version: null
    lastChecked: null
    notes: LLM provider (local or cloud) availability.
  dependencies:
    status: planned
    version: null
    lastChecked: null
    notes: Project dependencies installed via bun.
  env_file:
    status: planned
    version: null
    lastChecked: null
    notes: .env file present and configured.
  fossil_storage:
    status: planned
    version: null
    lastChecked: null
    notes: Fossil storage directory and permissions.
# Add new steps as needed for onboarding, CI, or additional tools.
EOF
fi

update_fossil() {
  local step=$1
  local status=$2
  local version=$3
  local notes=$4
  local now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  # Preserve summary.notes (plain string, no block scalar workaround)
  local summary_notes=$(yq e '.summary.notes' "$FOSSIL_STATUS_FILE" 2>/dev/null || echo "")
  yq e \
    ".steps.$step.status = \"$status\" | .steps.$step.version = \"$version\" | .steps.$step.lastChecked = \"$now\" | .steps.$step.notes = \"$notes\" | .summary.lastUpdated = \"$now\"" \
    -i "$FOSSIL_STATUS_FILE"
  if [[ -n "$summary_notes" && "$summary_notes" != "null" ]]; then
    yq e ".summary.notes = \"$summary_notes\"" -i "$FOSSIL_STATUS_FILE"
  fi
}

# 1. Bun
print_status $BLUE "🔍 Checking Bun..."
if command -v bun &>/dev/null; then
  BUN_VERSION=$(bun --version)
  print_status $GREEN "✅ Bun installed (v$BUN_VERSION)"
  update_fossil "bun" "done" "$BUN_VERSION" "Bun is installed."
else
  print_status $YELLOW "❌ Bun not found. Installing..."
  if [[ "$PLATFORM" == "Darwin" ]]; then
    curl -fsSL https://bun.sh/install | bash
  elif [[ "$PLATFORM" == "Linux" ]]; then
    curl -fsSL https://bun.sh/install | bash
  else
    print_status $RED "❌ Unsupported platform for auto-install. Please install Bun manually."
    update_fossil "bun" "failed" "" "Manual install required."
    exit 1
  fi
  if command -v bun &>/dev/null; then
    BUN_VERSION=$(bun --version)
    print_status $GREEN "✅ Bun installed (v$BUN_VERSION)"
    update_fossil "bun" "done" "$BUN_VERSION" "Bun installed successfully."
  else
    print_status $RED "❌ Bun installation failed."
    update_fossil "bun" "failed" "" "Install failed."
    exit 1
  fi
fi

# 2. GitHub CLI
print_status $BLUE "🔍 Checking GitHub CLI (gh)..."
if command -v gh &>/dev/null; then
  GH_VERSION=$(gh --version | head -n1 | awk '{print $3}')
  print_status $GREEN "✅ GitHub CLI installed (v$GH_VERSION)"
  update_fossil "github_cli" "done" "$GH_VERSION" "GitHub CLI is installed."
else
  print_status $YELLOW "❌ GitHub CLI not found. Installing..."
  if [[ "$PLATFORM" == "Darwin" ]]; then
    brew install gh || { print_status $RED "❌ Install failed. Please install GitHub CLI manually."; update_fossil "github_cli" "failed" "" "Manual install required."; exit 1; }
  elif [[ "$PLATFORM" == "Linux" ]]; then
    type -p apt &>/dev/null && sudo apt update && sudo apt install -y gh || { print_status $RED "❌ Install failed. Please install GitHub CLI manually."; update_fossil "github_cli" "failed" "" "Manual install required."; exit 1; }
  else
    print_status $RED "❌ Unsupported platform for auto-install. Please install GitHub CLI manually."
    update_fossil "github_cli" "failed" "" "Manual install required."
    exit 1
  fi
  if command -v gh &>/dev/null; then
    GH_VERSION=$(gh --version | head -n1 | awk '{print $3}')
    print_status $GREEN "✅ GitHub CLI installed (v$GH_VERSION)"
    update_fossil "github_cli" "done" "$GH_VERSION" "GitHub CLI installed successfully."
  else
    print_status $RED "❌ GitHub CLI installation failed."
    update_fossil "github_cli" "failed" "" "Install failed."
    exit 1
  fi
fi

# LLM Provider logic
LLM_PROVIDER="${LLM_PROVIDER:-any}"
LLM_AVAILABLE=false
LLM_PROVIDER_STATUS="failed"
LLM_PROVIDER_NOTES=""

if [[ "$LLM_PROVIDER" == "local" || "$LLM_PROVIDER" == "any" ]]; then
  print_status $BLUE "🔍 Checking local LLM provider (Ollama)..."
  if command -v ollama &>/dev/null; then
    OLLAMA_VERSION=$(ollama --version 2>/dev/null || echo "unknown")
    if pgrep -f "ollama serve" >/dev/null; then
      if ollama list | grep -q "llama2\|mistral"; then
        print_status $GREEN "✅ Ollama is installed, server running, and at least one model is available."
        update_fossil "ollama" "done" "$OLLLAMA_VERSION" "Ollama is installed and server running."
        LLM_AVAILABLE=true
        LLM_PROVIDER_STATUS="done"
        LLM_PROVIDER_NOTES="Ollama is available with at least one model."
      else
        print_status $YELLOW "⚠️  Ollama is running but no required models are available."
        update_fossil "ollama" "failed" "$OLLLAMA_VERSION" "No models available."
        LLM_PROVIDER_NOTES="Ollama running but no models."
      fi
    else
      print_status $YELLOW "⚠️  Ollama is installed but server is not running."
      update_fossil "ollama" "failed" "$OLLLAMA_VERSION" "Server not running."
      LLM_PROVIDER_NOTES="Ollama installed but server not running."
    fi
  else
    print_status $YELLOW "⚠️  Ollama is not installed."
    update_fossil "ollama" "failed" "" "Ollama not installed."
    LLM_PROVIDER_NOTES="Ollama not installed."
  fi
fi

if [[ "$LLM_PROVIDER" == "cloud" || ( "$LLM_PROVIDER" == "any" && $LLM_AVAILABLE == false ) ]]; then
  print_status $BLUE "🔍 Checking cloud LLM provider (OpenAI-compatible)..."
  API_KEY="${OPENAI_API_KEY:-$ANTHROPIC_API_KEY}" # Extend for more providers
  API_BASE="${OPENAI_API_BASE:-https://api.openai.com}"
  API_HEADER="${OPENAI_API_HEADER:-Authorization: Bearer $OPENAI_API_KEY}"
  MODELS_ENDPOINT="/v1/models"
  if [[ -n "$API_KEY" ]]; then
    if command -v curl &>/dev/null; then
      HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "$API_HEADER" "$API_BASE$MODELS_ENDPOINT")
      if [[ "$HTTP_CODE" == "200" ]]; then
        print_status $GREEN "✅ Cloud LLM API key is valid and endpoint is reachable."
        LLM_AVAILABLE=true
        LLM_PROVIDER_STATUS="done"
        LLM_PROVIDER_NOTES="Cloud LLM API key valid and endpoint reachable."
      else
        print_status $RED "❌ Cloud LLM API key or endpoint is invalid (HTTP $HTTP_CODE)."
        LLM_PROVIDER_NOTES="Cloud LLM API key or endpoint invalid (HTTP $HTTP_CODE)."
      fi
    else
      print_status $YELLOW "⚠️  curl not available, cannot check cloud LLM endpoint."
      LLM_PROVIDER_NOTES="curl not available for cloud LLM check."
    fi
  else
    print_status $RED "❌ No cloud LLM API key provided."
    LLM_PROVIDER_NOTES="No cloud LLM API key."
  fi
fi

# Update fossil with provider status and llm_available summary
update_fossil "llm_provider" "$LLM_PROVIDER_STATUS" "" "$LLM_PROVIDER_NOTES"
if $LLM_AVAILABLE; then
  yq e '.summary.llm_available = true' -i "$FOSSIL_STATUS_FILE"
  print_status $GREEN "✅ At least one LLM provider is available."
else
  yq e '.summary.llm_available = false' -i "$FOSSIL_STATUS_FILE"
  print_status $RED "❌ No LLM provider is available. Onboarding will fail."
  yq e '.summary.status = "failed"' -i "$FOSSIL_STATUS_FILE"
  exit 1
fi

# After Ollama server check and before dependencies step
# Model usage notes
MODEL_USAGE_NOTES=(
  ["llama2"]="General-purpose LLM for local dev and testing."
  ["mistral"]="Lightweight, fast LLM for quick prototyping and CI."
  ["phi3"]="Compact LLM for resource-constrained environments."
  ["codellama"]="Code-focused LLM for code generation and completion."
)

for MODEL in "${OLLAMA_MODELS[@]}"; do
  print_status $BLUE "🔍 Checking Ollama model: $MODEL..."
  if ollama list | grep -q "$MODEL"; then
    print_status $GREEN "✅ Model $MODEL available"
    update_fossil "ollama_models.$MODEL" "done" "" "${MODEL_USAGE_NOTES[$MODEL]}"
  else
    print_status $YELLOW "❌ Model $MODEL not found. Downloading..."
    print_status $CYAN "⬇️  Downloading model: $MODEL (this may take several minutes)..."
    (
      ollama pull "$MODEL" &
      pid=$!
      spin='|/-\\'
      i=0
      while kill -0 $pid 2>/dev/null; do
        i=$(( (i+1) %4 ))
        printf "\r%s Downloading... %s" "$MODEL" "${spin:$i:1}"
        sleep 0.5
      done
      wait $pid
      exit $?
    )
    DL_EXIT=$?
    printf "\r"
    if [ $DL_EXIT -eq 0 ]; then
      print_status $GREEN "✅ Model $MODEL downloaded"
      update_fossil "ollama_models.$MODEL" "done" "" "${MODEL_USAGE_NOTES[$MODEL]}"
    else
      print_status $RED "❌ Failed to download model $MODEL."
      update_fossil "ollama_models.$MODEL" "failed" "" "Download failed."
      exit 1
    fi
  fi
  sleep 1
done

# 5. Project dependencies
print_status $BLUE "🔍 Installing project dependencies (bun install)..."
if bun install; then
  print_status $GREEN "✅ Dependencies installed"
  update_fossil "dependencies" "done" "" "Dependencies installed."
else
  print_status $RED "❌ Dependency installation failed."
  update_fossil "dependencies" "failed" "" "Install failed."
  exit 1
fi

# 6. .env file
print_status $BLUE "🔍 Checking .env file..."
if [[ -f .env ]]; then
  print_status $GREEN "✅ .env file present"
  update_fossil "env_file" "done" "" ".env present."
else
  if [[ -f .env.example ]]; then
    cp .env.example .env
    print_status $GREEN "✅ .env file created from .env.example"
    update_fossil "env_file" "done" "" ".env created from example."
  else
    print_status $YELLOW "❌ .env.example not found. Please create .env manually."
    update_fossil "env_file" "failed" "" "Manual .env setup required."
    exit 1
  fi
fi

# 7. Fossil storage
print_status $BLUE "🔍 Checking fossil storage..."
if [[ -d fossils ]]; then
  print_status $GREEN "✅ Fossil storage directory present"
  update_fossil "fossil_storage" "done" "" "Fossil storage present."
else
  mkdir -p fossils
  print_status $GREEN "✅ Fossil storage directory created"
  update_fossil "fossil_storage" "done" "" "Fossil storage created."
fi

# Display summary of current fossil state
if command -v yq &>/dev/null; then
  print_status $CYAN "\nCurrent setup_status.yml summary:"
  yq e '.summary, .steps' "$FOSSIL_STATUS_FILE"
else
  print_status $CYAN "\nCurrent setup_status.yml (truncated):"
  head -20 "$FOSSIL_STATUS_FILE"
fi

# Ensure summary.status is correct at the end
if yq e '.summary.llm_available' "$FOSSIL_STATUS_FILE" | grep -q true; then
  yq e '.summary.status = "done"' -i "$FOSSIL_STATUS_FILE"
  print_status $GREEN "✅ Onboarding complete! All required steps are done."
else
  yq e '.summary.status = "failed"' -i "$FOSSIL_STATUS_FILE"
  print_status $RED "❌ Onboarding failed. See setup_status.yml for details."
  exit 1
fi

print_status $CYAN "🎉 Setup complete! All required tools and dependencies are installed."
exit 0 