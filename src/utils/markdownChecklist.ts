// Utility to update checklists in Markdown
// Accepts a Markdown string and a map of checklist item text to checked/unchecked state
// Returns the updated Markdown with only the relevant checkmarks changed

export type ChecklistUpdate = Record<string, boolean>;

/**
 * Updates checklists in a Markdown string.
 * @param markdown The original Markdown body
 * @param updates An object mapping checklist item text to checked (true) or unchecked (false)
 * @returns The updated Markdown
 */
export function updateMarkdownChecklist(markdown: string, updates: ChecklistUpdate): string {
  // Regex to match checklist items: - [ ] Item or - [x] Item
  const checklistRegex = /^([ \t]*[-*] \[)( |x)(\] )(.*)$/gm;

  return markdown.replace(checklistRegex, (match, prefix, checked, suffix, itemText) => {
    const trimmedText = itemText.trim();
    if (Object.prototype.hasOwnProperty.call(updates, trimmedText)) {
      const newChecked = updates[trimmedText] ? 'x' : ' ';
      return `${prefix}${newChecked}${suffix}${itemText}`;
    }
    return match;
  });
}

/**
 * Extracts the first JSON code block from a markdown string.
 */
export function extractJsonBlock(markdown: string): any | undefined {
  const safeMarkdown = typeof markdown === 'string' ? markdown : '';
  const match = safeMarkdown.match(/```json\s*([\s\S]*?)\s*```/);
  if (match && typeof match[1] === 'string') {
    try {
      return JSON.parse(match[1]);
    } catch {}
  }
  return undefined;
}

/**
 * Renders markdown checklist from JSON array
 */
export function checklistToMarkdown(checklist: {task: string, checked: boolean}[] | undefined): string {
  if (!Array.isArray(checklist)) return '';
  return checklist.map(item => `- [${item.checked ? 'x' : ' '}] ${item.task}`).join('\n');
}

/**
 * Renders markdown metadata from JSON object
 */
export function metadataToMarkdown(metadata: Record<string, any> | undefined): string {
  if (!metadata || typeof metadata !== 'object') return '';
  return Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join('\n');
} 