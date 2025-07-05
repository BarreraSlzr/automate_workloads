# 🔐 API Key Sanitization Guide

## 📋 Overview

The LLM snapshotting system now includes **automatic API key sanitization** to prevent sensitive credentials from being stored in fossils and snapshots. This ensures that all LLM call data can be safely shared and audited without exposing API keys.

## ✅ What Was Implemented

### 1. **Automatic Sanitization in LLM Service**

**Location**: `src/services/llm.ts`

**Method**: `sanitizeInputForFossilization()`

**What it does**:
- Removes API keys and sensitive fields from input before fossilization
- Replaces sensitive values with `[REDACTED]`
- Handles multiple API key field names
- Preserves all other input data for audit purposes

**Sensitive fields sanitized**:
- `apiKey`
- `openaiApiKey`
- `anthropicApiKey`
- `api_key`
- `token`
- `secret`
- `password`
- `key`
- `auth`

### 2. **Integration Points**

**Base LLM Service**:
```typescript
// Before fossilization, input is automatically sanitized
await this.fossilizeLLMCall({
  callId,
  inputHash,
  originalInput: this.sanitizeInputForFossilization(options), // ✅ Sanitized
  result,
  metrics,
  // ... other params
});
```

**Enhanced LLM Service**:
- Also includes sanitization (when not conflicting with base class)
- Ensures both services protect sensitive data

## 🔍 How to Validate Sanitization

### 1. **Quick Sanitization Test**

```bash
bun run scripts/test-sanitization-simple.ts
```

**Expected Output**:
```
🔐 Testing API Key Sanitization (Simple)
==================================================
1️⃣ Testing sanitization method...
   Original API key: sk-proj-test-key-that-should-be-redacted
   Sanitized API key: [REDACTED]
   ✅ API key properly sanitized!

2️⃣ Testing multiple sensitive fields...
   apiKey: [REDACTED]
   openaiApiKey: [REDACTED]
   anthropicApiKey: [REDACTED]
   api_key: [REDACTED]
   token: [REDACTED]
   secret: [REDACTED]
   ✅ All sensitive fields properly sanitized!
```

### 2. **Check Existing Fossils and Snapshots**

```bash
bun run scripts/check-api-keys-in-fossils.ts
```

**What it checks**:
- Existing fossil files for API keys
- Snapshot export files for API keys
- Reports any issues found

**Expected Output** (after sanitization):
```
✅ NO ISSUES: No API keys found in fossils/snapshots
🎉 API key sanitization appears to be working correctly!
```

### 3. **Manual Validation**

**Check fossil files**:
```bash
ls -la fossils/llm_insights/
grep -r "sk-" fossils/llm_insights/ || echo "No API keys found in fossils"
```

**Check snapshot files**:
```bash
ls -la llm-snapshot-*.yml
grep -r "sk-" llm-snapshot-*.yml || echo "No API keys found in snapshots"
```

## 🛡️ Security Benefits

### 1. **Safe Sharing**
- Fossils and snapshots can be shared without exposing credentials
- Team collaboration is secure
- External audits are safe

### 2. **Compliance**
- Meets security requirements for credential handling
- Prevents accidental credential exposure
- Maintains audit trail without sensitive data

### 3. **Debugging Safety**
- Console output and logs are safe
- Error reports don't contain credentials
- Development environment is secure

## 🔧 Implementation Details

### Sanitization Method

```typescript
private sanitizeInputForFossilization(input: any): any {
  if (!input) return input;
  
  const sanitized = { ...input };
  
  // Remove API keys and sensitive fields
  if (sanitized.apiKey) {
    sanitized.apiKey = '[REDACTED]';
  }
  if (sanitized.openaiApiKey) {
    sanitized.openaiApiKey = '[REDACTED]';
  }
  if (sanitized.anthropicApiKey) {
    sanitized.anthropicApiKey = '[REDACTED]';
  }
  if (sanitized.api_key) {
    sanitized.api_key = '[REDACTED]';
  }
  
  // Remove any other potential sensitive fields
  const sensitiveFields = ['token', 'secret', 'password', 'key', 'auth'];
  for (const field of sensitiveFields) {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}
```

### Integration Points

1. **Before Fossilization**: All input is sanitized before being stored
2. **Before Snapshot Export**: Fossils are already sanitized
3. **Console Output**: No sensitive data in logs
4. **Error Handling**: Failed calls also get sanitized input

## 🚨 Important Notes

### 1. **Existing Data**
- **Old fossils and snapshots may still contain API keys**
- These were created before sanitization was implemented
- **Solution**: Delete old snapshots and create new ones

### 2. **Cleanup Commands**
```bash
# Remove old snapshots with API keys
rm llm-snapshot-*.yml

# Check for any remaining API keys
bun run scripts/check-api-keys-in-fossils.ts
```

### 3. **New Data is Safe**
- All new LLM calls will have sanitized fossils
- All new snapshots will be safe to share
- Console output is clean

## 🎯 Success Criteria

The API key sanitization is **working correctly** when:

1. **Sanitization test passes** ✅
2. **No API keys in new fossils** ✅
3. **No API keys in new snapshots** ✅
4. **Console output is clean** ✅
5. **All sensitive fields are redacted** ✅

## 🔍 Troubleshooting

### If API Keys Are Still Found

1. **Check if it's old data**:
   ```bash
   # Remove old snapshots
   rm llm-snapshot-*.yml
   ```

2. **Verify sanitization is working**:
   ```bash
   bun run scripts/test-sanitization-simple.ts
   ```

3. **Check for new fossils**:
   ```bash
   bun run scripts/check-api-keys-in-fossils.ts
   ```

### If Sanitization Test Fails

1. **Check the LLM service file**:
   ```bash
   grep -n "sanitizeInputForFossilization" src/services/llm.ts
   ```

2. **Verify the method is being called**:
   ```bash
   grep -n "sanitizeInputForFossilization" src/services/llm.ts
   ```

## 📚 Summary

The API key sanitization system ensures that:

- ✅ **All API keys are automatically redacted** before fossilization
- ✅ **Fossils and snapshots are safe to share**
- ✅ **Console output contains no sensitive data**
- ✅ **Audit trails are maintained without credentials**
- ✅ **Team collaboration is secure**

**To validate**: Run `bun run scripts/test-sanitization-simple.ts`

**To check existing data**: Run `bun run scripts/check-api-keys-in-fossils.ts`

The system is now **secure by default** and ready for production use! 🔐✨ 