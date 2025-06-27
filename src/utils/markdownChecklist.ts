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