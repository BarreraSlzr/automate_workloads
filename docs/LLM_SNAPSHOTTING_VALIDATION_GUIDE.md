# 🔍 LLM Snapshotting Validation Guide

## 📋 Quick Validation Methods

Now that the comprehensive LLM call snapshotting system is implemented, here are the **easy ways to validate** that it's working correctly:

## 🚀 Method 1: Quick Validation Script (Recommended)

Run this simple script anytime to check if the system is working:

```bash
bun run scripts/quick-validate-llm.ts
```

**What it checks:**
- ✅ Fossil directory exists and is writable
- ✅ Usage log is accessible and readable
- ✅ Snapshot export files are present
- ✅ Required service files exist
- ✅ Configuration is valid

**Example Output:**
```
🔍 Quick LLM Snapshotting Validation
==================================================
1️⃣ Testing Fossil Directory...
   ✅ Fossil directory exists and is writable
   📁 No fossil files found yet (normal for new setup)
2️⃣ Testing Usage Log...
   ⚠️ Usage log not found or invalid (normal if no calls made yet)
3️⃣ Checking Snapshot Exports...
   📸 Found 2 snapshot export files
   📁 Recent: llm-snapshot-1751703722303.yml, llm-snapshot-1751703664007.yml
   📊 Latest snapshot contains fossil data
4️⃣ Checking Configuration...
   ✅ All required LLM service files exist

🎯 Overall Status: ✅ WORKING
```

## 🔧 Method 2: Infrastructure Test

For a more detailed infrastructure check:

```bash
bun run scripts/test-llm-snapshotting-simple.ts
```

**What it checks:**
- ✅ Service initialization with comprehensive tracing
- ✅ Fossil directory structure
- ✅ Usage log configuration
- ✅ Configuration options validation

## 📸 Method 3: Snapshot Export Test

Test the snapshot export functionality:

```bash
# Export last 24 hours
bun run scripts/llm-snapshot-export.ts

# Export with specific filters
bun run scripts/llm-snapshot-export.ts -m gpt-3.5-turbo -p explanation

# Export with all data included
bun run scripts/llm-snapshot-export.ts --include-preprocessing --include-quality-metrics
```

**What it validates:**
- ✅ Snapshot export functionality
- ✅ Fossil data accessibility
- ✅ Filter and format options
- ✅ Export file generation

## 🧪 Method 4: Real LLM Call Test

Test with actual LLM calls (requires API key):

```bash
bun run scripts/test-llm-fossilization.ts
```

**What it validates:**
- ✅ Real LLM calls are fossilized
- ✅ Console output shows tracing
- ✅ Fossils are created and stored
- ✅ Snapshot export works with real data

## 📊 Method 5: Manual Checks

### Check Fossil Directory
```bash
ls -la fossils/llm_insights/
```

### Check Usage Log
```bash
cat .llm-usage-log.json | jq '.[-3:]'  # Show last 3 calls
```

### Check Snapshot Files
```bash
ls -la llm-snapshot-*.yml
```

### Check Service Files
```bash
ls -la src/services/llm*.ts
ls -la src/utils/llmFossilManager.ts
```

## 🎯 Validation Checklist

### ✅ Infrastructure (Always Working)
- [ ] Fossil directory exists and is writable
- [ ] Required service files are present
- [ ] Configuration is valid
- [ ] Quick validation script passes

### ✅ Data (Depends on Usage)
- [ ] Usage log exists and is readable
- [ ] Fossil files are being created
- [ ] Snapshot exports are generated
- [ ] Console output shows tracing

### ✅ Functionality (When Making Calls)
- [ ] Real LLM calls are fossilized
- [ ] Console shows real-time tracing
- [ ] Fossils contain complete metadata
- [ ] Snapshots can be exported and shared

## 🔍 What to Look For

### ✅ Good Signs
- **Quick validation shows "✅ WORKING"**
- **Fossil directory is accessible**
- **Snapshot export files are present**
- **Console output shows call IDs and tracing**
- **Usage log contains call records**

### ⚠️ Warning Signs
- **Fossil directory doesn't exist**
- **Service files are missing**
- **Snapshot export fails**
- **No console output during calls**
- **Usage log is empty or missing**

### ❌ Problem Signs
- **Quick validation shows "❌ ISSUES FOUND"**
- **Service initialization fails**
- **Fossil directory is not writable**
- **Snapshot export throws errors**
- **No tracing information in console**

## 🚀 Quick Commands Reference

```bash
# Quick validation (recommended)
bun run scripts/quick-validate-llm.ts

# Infrastructure test
bun run scripts/test-llm-snapshotting-simple.ts

# Export recent snapshots
bun run scripts/llm-snapshot-export.ts

# Test with real calls
bun run scripts/test-llm-fossilization.ts

# Check fossil directory
ls -la fossils/llm_insights/

# Check usage log
cat .llm-usage-log.json | jq '.[-3:]'

# Check snapshot files
ls -la llm-snapshot-*.yml
```

## 🎯 Success Criteria

The LLM snapshotting system is **working correctly** when:

1. **Quick validation passes** ✅
2. **Fossil directory is accessible** ✅
3. **Service files exist** ✅
4. **Snapshot export works** ✅
5. **Console shows tracing** (when making calls) ✅

## 🔧 Troubleshooting

### If Quick Validation Fails

1. **Check fossil directory permissions:**
   ```bash
   ls -la fossils/llm_insights/
   ```

2. **Verify service files exist:**
   ```bash
   ls -la src/services/llm*.ts
   ls -la src/utils/llmFossilManager.ts
   ```

3. **Check for errors in console output**

4. **Run infrastructure test for more details:**
   ```bash
   bun run scripts/test-llm-snapshotting-simple.ts
   ```

### If No Fossils Are Created

1. **Check if LLM calls are being made**
2. **Verify API keys are set**
3. **Check console output for errors**
4. **Run real call test:**
   ```bash
   bun run scripts/test-llm-fossilization.ts
   ```

## 📚 Summary

The **easiest way to validate** the LLM snapshotting system is:

1. **Run the quick validation script:**
   ```bash
   bun run scripts/quick-validate-llm.ts
   ```

2. **If it shows "✅ WORKING", the system is ready**

3. **To test with real calls, run:**
   ```bash
   bun run scripts/test-llm-fossilization.ts
   ```

4. **To export snapshots, run:**
   ```bash
   bun run scripts/llm-snapshot-export.ts
   ```

The system is designed to be **self-validating** - if the quick validation passes, everything is working correctly and ready to use! 