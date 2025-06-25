#!/bin/bash
# Comprehensive test suite for scripts/monitoring/check-issues.sh

set -e  # Exit on any error

echo "🧪 Running check-issues.sh test suite..."

# Test 1: Test mode
echo "Test 1: Test mode"
output=$(CHECK_ISSUES_TEST=1 ./scripts/monitoring/check-issues.sh)
if [[ "$output" == "[TEST MODE] check-issues.sh ran successfully." ]]; then
  echo "✅ Test mode PASSED"
else
  echo "❌ Test mode FAILED"
  echo "Expected: [TEST MODE] check-issues.sh ran successfully."
  echo "Got: $output"
  exit 1
fi

# Test 2: Test mode with label argument
echo "Test 2: Test mode with label argument"
output=$(CHECK_ISSUES_TEST=1 ./scripts/monitoring/check-issues.sh "bug")
if [[ "$output" == "[TEST MODE] check-issues.sh ran successfully." ]]; then
  echo "✅ Test mode with label PASSED"
else
  echo "❌ Test mode with label FAILED"
  echo "Expected: [TEST MODE] check-issues.sh ran successfully."
  echo "Got: $output"
  exit 1
fi

# Test 3: Test mode with milestone argument
echo "Test 3: Test mode with milestone argument"
output=$(CHECK_ISSUES_TEST=1 ./scripts/monitoring/check-issues.sh "" "Test Milestone")
if [[ "$output" == "[TEST MODE] check-issues.sh ran successfully." ]]; then
  echo "✅ Test mode with milestone PASSED"
else
  echo "❌ Test mode with milestone FAILED"
  echo "Expected: [TEST MODE] check-issues.sh ran successfully."
  echo "Got: $output"
  exit 1
fi

# Test 4: Script is executable
echo "Test 4: Script is executable"
if [[ -x "./scripts/monitoring/check-issues.sh" ]]; then
  echo "✅ Script is executable PASSED"
else
  echo "❌ Script is executable FAILED"
  exit 1
fi

echo "�� All tests PASSED!" 