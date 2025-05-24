#!/bin/bash

load_env() {
    local env_file="$1"
    if [[ -f "$env_file" ]]; then
        echo "Loading env: $env_file"
        export $(grep -v '^#' "$env_file" | xargs)
    else
        echo "Warning: $env_file not found!"
        return 1
    fi
}

load_env "./backend/.env"
load_env "./llm_worker/.env"
load_env "./frontend/.env"

honcho start
