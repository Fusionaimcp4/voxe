/**
 * System Message Section Parser and Dynamic Generator
 * Handles parsing templates into sections and generating dynamic messages
 */

export interface SystemMessageSection {
  id: string;
  type: 'PROTECTED' | 'EDITABLE';
  content: string;
  order: number;
}

export interface WorkflowFeatures {
  hasKnowledgeBase: boolean;
  hasCalendar: boolean;
}

export interface EditableContent {
  [sectionId: string]: string;
}

/**
 * Parse template into structured sections
 */
export function parseTemplateSections(template: string): SystemMessageSection[] {
  const sections: SystemMessageSection[] = [];
  const regex = /\[(PROTECTED|EDITABLE)_START:(\w+)\]([\s\S]*?)\[(PROTECTED|EDITABLE)_END:\2\]/g;
  
  let match;
  let order = 0;
  
  // Debug: Check if template has markers
  const hasMarkers = /\[(PROTECTED|EDITABLE)_START:/.test(template);
  if (!hasMarkers) {
    console.warn('⚠️ Template does not contain section markers. Template preview:', template.substring(0, 200));
    return [];
  }
  
  while ((match = regex.exec(template)) !== null) {
    sections.push({
      id: match[2],
      type: match[1] as 'PROTECTED' | 'EDITABLE',
      content: match[3].trim(),
      order: order++
    });
  }
  
  console.log(`✅ Parsed ${sections.length} sections from template:`, sections.map(s => `${s.type}:${s.id}`).join(', '));
  
  return sections;
}

/**
 * Combine sections back into final message
 */
export function combineSections(sections: SystemMessageSection[]): string {
  // Sort by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  
  // Combine with separators (matching the example format)
  return sortedSections.map(section => section.content).join('\n\n---\n\n');
}

/**
 * Generate dynamic system message based on features and editable content
 */
export function generateDynamicSystemMessage(
  template: string,
  features: WorkflowFeatures,
  editableContent: EditableContent = {},
  businessName: string = ''
): string {
  // Parse template into sections
  const sections = parseTemplateSections(template);
  
  if (sections.length === 0) {
    // Fallback: if no sections found, return template as-is (backward compatibility)
    console.warn('⚠️ No sections found in template, returning as-is');
    return template.replace(/\$\{businessName\}/g, businessName);
  }
  
  // Filter sections based on features
  const includedSections = sections.filter(section => {
    // Exclude KB section if no KB enabled
    if (section.id === 'kb_usage' && !features.hasKnowledgeBase) {
      return false;
    }
    // Exclude Calendar section if no Calendar enabled
    if (section.id === 'calendar_booking' && !features.hasCalendar) {
      return false;
    }
    return true; // Include all other sections
  });
  
  // Replace editable sections with user content
  const processedSections = includedSections.map(section => {
    if (section.type === 'EDITABLE' && editableContent[section.id]) {
      return {
        ...section,
        content: editableContent[section.id]
      };
    }
    return section;
  });
  
  // Replace ${businessName} placeholder and conditional text in all sections
  const finalSections = processedSections.map(section => {
    let content = section.content.replace(/\$\{businessName\}/g, businessName);
    
    // Handle conditional text in core_role section
    if (section.id === 'core_role') {
      // Replace {{KB_TOOL_TEXT}} with appropriate text based on KB feature
      // Business Knowledge is ALWAYS mentioned (it's always in the system message)
      // KB tool is only mentioned when KB/RAG is enabled
      if (features.hasKnowledgeBase) {
        content = content.replace(
          /\{\{KB_TOOL_TEXT\}\}/g,
          ' and, when appropriate, the "Retrieve Knowledge Base Context" tool'
        );
      } else {
        // When KB is disabled, don't mention the KB tool
        content = content.replace(/\{\{KB_TOOL_TEXT\}\}/g, '');
      }
    }
    
    return {
      ...section,
      content
    };
  });
  
  // Combine sections back into final message
  let finalMessage = combineSections(finalSections);
  
  // Add title at the beginning
  const title = `# ${businessName} – Chat Platform System Message\n\n`;
  finalMessage = title + finalMessage;
  
  return finalMessage;
}

/**
 * Extract editable content from a full message
 * Used when migrating old messages to new format
 */
export function extractEditableContent(
  template: string,
  fullMessage: string
): EditableContent {
  const sections = parseTemplateSections(template);
  const editableContent: EditableContent = {};
  
  sections.forEach(section => {
    if (section.type === 'EDITABLE') {
      // Try to find the section content in the full message
      // This is a simple extraction - may need refinement
      const sectionRegex = new RegExp(
        `\\[EDITABLE_START:${section.id}\\]([\\s\\S]*?)\\[EDITABLE_END:${section.id}\\]`,
        'g'
      );
      const match = sectionRegex.exec(fullMessage);
      if (match) {
        editableContent[section.id] = match[1].trim();
      } else {
        // Fallback: use default from template
        editableContent[section.id] = section.content;
      }
    }
  });
  
  return editableContent;
}

/**
 * Validate editable section content
 * Prevents users from adding protected content patterns
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateEditableSection(
  sectionId: string,
  content: string
): ValidationResult {
  // Check for forbidden patterns that might break functionality
  const forbiddenPatterns = [
    {
      pattern: /```json\s*\{[\s\S]*"output"[\s\S]*\}/,
      error: 'Cannot modify JSON output format rules'
    },
    {
      pattern: /calendar.*tool|book.*calendar|get.*slots/i,
      error: 'Cannot reference calendar tools in editable sections'
    },
    {
      pattern: /knowledge.*base.*tool|retrieve.*knowledge|rag.*tool/i,
      error: 'Cannot reference knowledge base tools in editable sections'
    },
    {
      pattern: /escalation.*rules|assign.*team/i,
      error: 'Cannot modify escalation rules in editable sections'
    },
    {
      pattern: /\[PROTECTED_START:|\[PROTECTED_END:|\[EDITABLE_START:|\[EDITABLE_END:/,
      error: 'Cannot include section markers in content'
    }
  ];
  
  for (const { pattern, error } of forbiddenPatterns) {
    if (pattern.test(content)) {
      return {
        valid: false,
        error
      };
    }
  }
  
  return { valid: true };
}

