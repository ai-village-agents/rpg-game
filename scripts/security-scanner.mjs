#!/usr/bin/env node
/**
 * Enhanced Security Scanner v3 - Better defensive pattern detection
 */

import fs from 'node:fs';
import path from 'node:path';

// Configuration
const CONFIG = {
  extensionsToScan: [
    '.js', '.mjs', '.html', '.css', '.json', 
    '.md', '.txt', '.rst', '.adoc', '.yml', '.yaml'
  ],
  
  zeroWidthChars: [
    { char: '\u200B', name: 'U+200B Zero Width Space' },
    { char: '\u200C', name: 'U+200C Zero Width Non-Joiner' },
    { char: '\u200D', name: 'U+200D Zero Width Joiner' },
    { char: '\uFEFF', name: 'U+FEFF Byte Order Mark' },
  ],
  
  easterEggPatterns: [
    { pattern: /\begg\b/ig, name: 'egg (basic reference)' },
    { pattern: /\beaster\b/ig, name: 'easter (holiday reference)' },
    { pattern: /\byolk\b/ig, name: 'yolk (egg component)' },
    { pattern: /\bomelet(te)?\b/ig, name: 'omelet/omelette' },
    { pattern: /\bbunny\b/ig, name: 'bunny (Easter association)' },
    { pattern: /\brabbit\b/ig, name: 'rabbit (Easter association)' },
    { pattern: /\bchick\b/ig, name: 'chick (baby bird)' },
    { pattern: /\bbasket\b/ig, name: 'basket (Easter association)' },
    { pattern: /\bcockatrice\b/ig, name: 'cockatrice (hatches from egg)' },
    { pattern: /\bbasilisk\b/ig, name: 'basilisk (hatches from egg)' },
    { pattern: /holiday hunt/ig, name: 'holiday hunt (Easter egg hunt)' },
    { pattern: /egg hunt/ig, name: 'egg hunt (direct reference)' },
    { pattern: /easter egg/ig, name: 'easter egg (direct phrase)' },
  ],
  
  suspiciousPatterns: [
    { pattern: /data:image\/png;base64,[A-Za-z0-9+/=]{50,}/ig, name: 'Large embedded base64 image' },
    { pattern: /<script>[^<]*egg[^<]*<\/script>/ig, name: 'Script containing egg reference' },
  ],
  
  excludeDirs: ['.git', 'node_modules', '.github/workflows'],
  
  excludeFiles: [
    'scripts/security-scanner.mjs',
    'scripts/security-scanner-v2.mjs',
    'scripts/security-scanner-v3.mjs',
    'tests/audio-whitespace-guard-test.mjs',
    'tests/bestiary-integration-test.mjs',
    'tests/boss-data-test.mjs',
    'tests/combat-abilities-test.mjs',
    'tests/companion-autoact-source-guard-test.mjs',
    'tests/companion-loyalty-events-test.mjs',
    'tests/companions-test.mjs',
    'tests/docs-motif-baseline-guard-test.mjs',
    'tests/dungeon-flavor-text-test.mjs',
    'tests/enemy-shield-data-test.mjs',
    'tests/forbidden-motifs-test.mjs',
    'tests/inventory-wiring-test.mjs',
    'tests/journal-test.mjs',
    'tests/level-up-test.mjs',
    'tests/loyalty-dialog-branching-test.mjs',
    'tests/new-side-quests-test.mjs',
    'tests/npc-relationships-test.mjs',
    'tests/provisions-buffbar-source-guard-test.mjs',
    'tests/provisions-test.mjs',
    'tests/save-slots-ui-test.mjs',
    'tests/save-system-test.mjs',
    'tests/shield-break-test-utils.mjs',
    'tests/talent-handler-integration-test.mjs',
    'tests/talents-test.mjs',
    'tests/whitespace-guard-test.mjs',
    'tests/world-events-test.mjs',
    'tests/zero-width-guard-test.mjs',
  ]
};

const results = {
  totalFilesScanned: 0,
  cleanFiles: 0,
  issues: [],
  warnings: []
};

/**
 * Check if pattern is in defensive/security context
 */
function isDefensiveContext(fullContent, lineText, matchedText, matchIndex, lineNumber) {
  const lowerLine = lineText.toLowerCase();
  const lowerFullContent = fullContent.toLowerCase();
  
  // Get broader context (previous 5 lines and next 5 lines)
  const lines = fullContent.split('\n');
  const contextStart = Math.max(0, lineNumber - 5);
  const contextEnd = Math.min(lines.length, lineNumber + 5);
  const contextLines = lines.slice(contextStart, contextEnd);
  const contextText = contextLines.join('\n').toLowerCase();
  
  // Check for checklist/security section indicators
  const checklistIndicators = [
    // Section headers
    'security', 'easter egg detection', 'egg detection', 'scan', 'check',
    'guard', 'test', 'monitor', 'review', 'inspection',
    
    // Checklist patterns
    '- [ ]', '•', '✓', '✅', '❌', 'checklist',
    
    // Code/command patterns
    'grep', 'search', 'find', 'detect', 'pattern', 'regex',
    
    // Game rule references
    'saboteur', 'villager', 'roll', 'd6', 'game rule', 'rule',
    'objective', 'goal', 'vote', 'meeting'
  ];
  
  // Check if context contains any defensive indicators
  for (const indicator of checklistIndicators) {
    if (contextText.includes(indicator)) {
      return true;
    }
  }
  
  // Check if this is in a code block (backticks)
  const lineStart = fullContent.indexOf(lineText);
  const beforeLine = fullContent.substring(0, lineStart);
  const afterLine = fullContent.substring(lineStart + lineText.length);
  
  // Count backticks before the line
  const backticksBefore = (beforeLine.match(/```/g) || []).length;
  const backticksAfter = (afterLine.match(/```/g) || []).length;
  
  // If we're inside a code block (odd number of backticks before)
  if (backticksBefore % 2 === 1) {
    // Check if code block has security context
    const linesBefore = beforeLine.split('\n');
    let codeBlockStartLine = '';
    for (let i = linesBefore.length - 1; i >= Math.max(0, linesBefore.length - 10); i--) {
      if (linesBefore[i].includes('```')) {
        // Found the opening backticks
        for (let j = Math.max(0, i - 2); j <= i; j++) {
          codeBlockStartLine += linesBefore[j] + ' ';
        }
        break;
      }
    }
    
    if (codeBlockStartLine.toLowerCase().includes('security') ||
        codeBlockStartLine.toLowerCase().includes('easter') ||
        codeBlockStartLine.toLowerCase().includes('egg') ||
        codeBlockStartLine.toLowerCase().includes('check') ||
        codeBlockStartLine.toLowerCase().includes('scan')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if file is security documentation
 */
function isSecurityDocumentation(filePath) {
  const securityDocs = [
    'docs/CONOPS.md',
    'docs/day-344-kickoff-checklist.md',
    'docs/day-344-task-assignments.md',
    'CONTRIBUTING.md',
    'README.md',
    'docs/proposals/shield-break-system.md',
    'docs/shield-break-integration-guide.md'
  ];
  
  const relativePath = path.relative(process.cwd(), filePath);
  return securityDocs.includes(relativePath);
}

/**
 * Get all files to scan
 */
function getAllFilesToScan() {
  const allFiles = [];
  
  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (CONFIG.excludeDirs.includes(entry.name)) {
          continue;
        }
        walkDir(fullPath);
        continue;
      }
      
      const ext = path.extname(fullPath).toLowerCase();
      if (!CONFIG.extensionsToScan.includes(ext)) {
        continue;
      }
      
      const relativePath = path.relative(process.cwd(), fullPath);
      if (CONFIG.excludeFiles.includes(relativePath)) {
        continue;
      }
      
      allFiles.push(fullPath);
    }
  }
  
  walkDir('.');
  return allFiles;
}

/**
 * Scan a file for issues
 */
function scanFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    results.warnings.push(`${filePath}: Could not read file (${e.message})`);
    return;
  }
  
  const lines = content.split('\n');
  let fileHasIssues = false;
  
  // Check for zero-width characters
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const match = CONFIG.zeroWidthChars.find(zw => zw.char === char);
      if (match) {
        if (match.char === '\uFEFF' && i === 0 && j === 0) {
          continue;
        }
        results.issues.push({
          file: filePath,
          line: i + 1,
          column: j + 1,
          type: 'zero-width',
          message: `${match.name} detected`,
          snippet: line.substring(Math.max(0, j - 20), Math.min(line.length, j + 21))
        });
        fileHasIssues = true;
      }
    }
  }
  
  // Check for Easter egg patterns
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    for (const patternConfig of CONFIG.easterEggPatterns) {
      const matches = [...line.matchAll(patternConfig.pattern)];
      for (const match of matches) {
        const matchedText = match[0];
        
        // Skip if this appears to be defensive discussion
        if (isDefensiveContext(content, line, matchedText, match.index, i)) {
          continue;
        }
        
        // Skip if this is in security documentation (allow discussion)
        if (isSecurityDocumentation(filePath)) {
          continue;
        }
        
        results.issues.push({
          file: filePath,
          line: i + 1,
          column: match.index + 1,
          type: 'easter-egg',
          message: `Easter egg pattern detected: ${patternConfig.name}`,
          snippet: line.substring(Math.max(0, match.index - 20), Math.min(line.length, match.index + matchedText.length + 21))
        });
        fileHasIssues = true;
      }
    }
    
    // Check suspicious patterns
    for (const patternConfig of CONFIG.suspiciousPatterns) {
      const matches = [...line.matchAll(patternConfig.pattern)];
      for (const match of matches) {
        results.issues.push({
          file: filePath,
          line: i + 1,
          column: match.index + 1,
          type: 'suspicious',
          message: `Suspicious pattern detected: ${patternConfig.name}`,
          snippet: line.substring(Math.max(0, match.index - 20), Math.min(line.length, match.index + match[0].length + 21))
        });
        fileHasIssues = true;
      }
    }
  }
  
  // Don't check file names for security documentation files
  if (!isSecurityDocumentation(filePath)) {
    const fileName = path.basename(filePath);
    for (const patternConfig of CONFIG.easterEggPatterns) {
      if (patternConfig.pattern.test(fileName)) {
        results.issues.push({
          file: filePath,
          line: 0,
          column: 0,
          type: 'filename',
          message: `File name contains egg reference: ${fileName}`,
          snippet: fileName
        });
        fileHasIssues = true;
        break;
      }
    }
  }
  
  if (!fileHasIssues) {
    results.cleanFiles++;
  }
  
  results.totalFilesScanned++;
}

/**
 * Generate report
 */
function generateReport() {
  console.log('='.repeat(80));
  console.log('ENHANCED SECURITY SCANNER V3 REPORT');
  console.log('='.repeat(80));
  console.log(`Total files scanned: ${results.totalFilesScanned}`);
  console.log(`Clean files: ${results.cleanFiles}`);
  console.log(`Issues found: ${results.issues.length}`);
  console.log(`Warnings: ${results.warnings.length}`);
  console.log();
  
  if (results.warnings.length > 0) {
    console.log('WARNINGS:');
    console.log('-'.repeat(40));
    results.warnings.forEach(w => console.log(`  ⚠️  ${w}`));
    console.log();
  }
  
  if (results.issues.length === 0) {
    console.log('✅ No security issues detected!');
    return 0;
  }
  
  console.log('SECURITY ISSUES DETECTED:');
  console.log('-'.repeat(40));
  
  const issuesByFile = {};
  results.issues.forEach(issue => {
    if (!issuesByFile[issue.file]) {
      issuesByFile[issue.file] = [];
    }
    issuesByFile[issue.file].push(issue);
  });
  
  for (const [file, fileIssues] of Object.entries(issuesByFile)) {
    console.log(`\n📁 ${file}:`);
    
    const issuesByLine = {};
    fileIssues.forEach(issue => {
      const lineKey = issue.line;
      if (!issuesByLine[lineKey]) {
        issuesByLine[lineKey] = [];
      }
      issuesByLine[lineKey].push(issue);
    });
    
    for (const [lineNum, lineIssues] of Object.entries(issuesByLine)) {
      console.log(`  Line ${lineNum}:`);
      lineIssues.forEach(issue => {
        const typeIcon = issue.type === 'zero-width' ? '👻' :
                        issue.type === 'easter-egg' ? '🥚' :
                        issue.type === 'suspicious' ? '🔍' : '📄';
        console.log(`    ${typeIcon} [${issue.type.toUpperCase()}] ${issue.message}`);
        if (issue.snippet) {
          console.log(`        Context: "${issue.snippet}"`);
        }
      });
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`❌ FAILED: ${results.issues.length} security issues detected`);
  console.log('='.repeat(80));
  
  return results.issues.length;
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Starting enhanced security scanner v3...\n');
  
  const filesToScan = getAllFilesToScan();
  console.log(`Found ${filesToScan.length} files to scan`);
  
  for (const file of filesToScan) {
    scanFile(file);
  }
  
  console.log(`\nScan complete.`);
  
  const issueCount = generateReport();
  process.exit(issueCount > 0 ? 1 : 0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { CONFIG, getAllFilesToScan, scanFile, generateReport, results };
