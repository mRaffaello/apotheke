#!/usr/bin/env bash

set -u

status=0

run_check() {
    local label="$1"
    shift

    printf '\n== %s ==\n' "$label"

    if ! "$@"; then
        status=1
    fi
}

run_check "Dead Code" pnpm dlx fallow@2.76.0 dead-code --fail-on-issues
#run_check "Health (production only)" pnpm dlx fallow@2.76.0 health --production --fail-on-issues
#run_check "Duplication (production only)" pnpm dlx fallow@2.76.0 dupes --production --fail-on-issues

exit "$status"
