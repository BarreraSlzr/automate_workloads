#!/bin/bash

# Audit all shell scripts for missing .test.ts files
set -e

missing=()

# Use process substitution to avoid subshell issues with arrays
while read -r script; do
  test_file="tests/unit/${script%.sh}.test.ts"
  if [ ! -f "$test_file" ]; then
    echo "$script has no test file!"
    missing+=("$script")
  fi
done < <(find scripts -type f -name '*.sh')

if [ ${#missing[@]} -eq 0 ]; then
  echo "✅ All shell scripts have corresponding test files."
  exit 0
else
  echo "❌ Found ${#missing[@]} shell scripts without test files:"
  printf '%s\n' "${missing[@]}"
  exit 1
fi 