#!/bin/bash

# Audit all shell scripts for missing .test.ts files
missing=()
find scripts -type f -name '*.sh' | while read script; do
  test_file="tests/unit/${script%.sh}.test.ts"
  if [ ! -f "$test_file" ]; then
    echo "$script has no test file!"
    missing+=("$script")
  fi
done

if [ ${#missing[@]} -eq 0 ]; then
  echo "✅ All shell scripts have corresponding test files."
  exit 0
else
  exit 1
fi 