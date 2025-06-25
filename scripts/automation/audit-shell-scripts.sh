#!/bin/bash

# Audit all shell scripts for missing .test.ts files
find scripts -type f -name '*.sh' | while read script; do
  test_file="tests/unit/${script%.sh}.test.ts"
  if [ ! -f "$test_file" ]; then
    echo "$script has no test file!"
  fi
done 