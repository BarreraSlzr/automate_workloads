#!/usr/bin/env bun

/**
 * Simplified pre-commit validation script focusing on core functionality.
 * - Type checks
 * - Basic tests (unit + integration, no complex monitoring)
 * - Fossil audit
 * - Schema validation
 * Exits on first failure.
 */

const { $ } = Bun;

async function main() {
  console.log('🚀 Starting simplified pre-commit validation...\n');

  // 1. Type checking
  try {
    console.log('🔎 Type checking...');
    await $`bun run tsc --noEmit`;
    console.log('✅ Type check passed\n');
  } catch {
    console.error('❌ Type check failed');
    process.exit(1);
  }

  // 2. Basic tests (unit + integration, skip complex monitoring)
  try {
    console.log('🧪 Running basic tests...');
    await $`bun test tests/unit/ tests/integration/ --timeout 60000`;
    console.log('✅ Basic tests passed\n');
  } catch {
    console.error('❌ Basic tests failed');
    process.exit(1);
  }

  // 3. Schema validation
  try {
    console.log('🔧 Validating schemas...');
    await $`bun run validate:types-schemas`;
    console.log('✅ Schema validation passed\n');
  } catch {
    console.error('❌ Schema validation failed');
    process.exit(1);
  }

  // 4. Fossil audit (quick check)
  try {
    console.log('🔍 Quick fossil audit...');
    await $`bun run fossil:audit --no-create-fossil`;
    console.log('✅ Fossil audit passed\n');
  } catch {
    console.error('❌ Fossil audit failed');
    process.exit(1);
  }

  console.log('🎉 Simplified pre-commit validation passed!');
  console.log('📝 Note: Complex monitoring tests are skipped for faster validation');
}

main().catch((err) => {
  console.error('❌ Pre-commit validation script error:', err);
  process.exit(1);
}); 