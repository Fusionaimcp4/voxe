import { mergeKBIntoSkeleton, injectWebsiteLinksSection } from './merge';

/**
 * Validates that all critical section markers exist in a template
 */
export function validateTemplateStructure(template: string): {
  isValid: boolean;
  missingSections: string[];
  warnings: string[];
} {
  const criticalSections = [
    '## Business Knowledge',
    '# AI to Human Escalation Rules',
    '## Valid Teams (with responsibilities)',
    '## Knowledge Base Usage Guidelines',
    '## General Behavior',
    '## Output Format',
    '### Example Scenarios'
  ];

  const dynamicSections = [
    '## Website links (canonical)',
    '### Canonical URLs'
  ];

  const missingSections: string[] = [];
  const warnings: string[] = [];

  // Check for critical sections
  criticalSections.forEach(section => {
    if (!template.includes(section)) {
      missingSections.push(section);
    }
  });

  // Check for dynamic sections (these are added during processing)
  const missingDynamicSections: string[] = [];
  dynamicSections.forEach(section => {
    if (!template.includes(section)) {
      missingDynamicSections.push(section);
    }
  });

  // Add info about dynamic sections if they're missing
  if (missingDynamicSections.length > 0) {
    warnings.push(`Dynamic sections will be added during processing: ${missingDynamicSections.join(', ')}`);
  }

  // Check for variable placeholders
  if (!template.includes('${businessName}')) {
    warnings.push('Missing ${businessName} placeholder');
  }

  // Check for proper section hierarchy
  const businessKnowledgeMatch = template.match(/^##\s*Business Knowledge$/m);
  const usageGuidelinesMatch = template.match(/^##\s*Knowledge Base Usage Guidelines$/m);
  
  if (businessKnowledgeMatch && usageGuidelinesMatch) {
    if (usageGuidelinesMatch.index! > businessKnowledgeMatch.index!) {
      warnings.push('Knowledge Base Usage Guidelines should come before Business Knowledge section');
    }
  }

  return {
    isValid: missingSections.length === 0,
    missingSections,
    warnings
  };
}

/**
 * Tests template customization by simulating the merge process
 */
export function testTemplateCustomization(template: string): {
  success: boolean;
  errors: string[];
  testResults: {
    kbMerge: boolean;
    urlInjection: boolean;
    variableReplacement: boolean;
  };
} {
  const errors: string[] = [];
  const testResults = {
    kbMerge: false,
    urlInjection: false,
    variableReplacement: false
  };

  try {
    // Test Business Knowledge merge
    const testKB = '# Test Business Knowledge\n\nThis is test content.';
    const mergedKB = mergeKBIntoSkeleton(template, testKB);
    
    // Check if the merge actually happened by looking for the test content
    const hasTestContent = mergedKB.includes('Test Business Knowledge') && mergedKB.includes('This is test content');
    const hasBusinessKnowledgeSection = mergedKB.includes('## Business Knowledge');
    
    testResults.kbMerge = hasTestContent && hasBusinessKnowledgeSection;
    
    if (!testResults.kbMerge) {
      errors.push(`Business Knowledge merge failed. Has test content: ${hasTestContent}, Has section: ${hasBusinessKnowledgeSection}`);
    }
  } catch (error) {
    errors.push(`Business Knowledge merge error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    // Test URL injection
    const testUrl = 'https://example.com';
    const testCanonicalUrls = [
      { title: 'Home', url: 'https://example.com' },
      { title: 'About', url: 'https://example.com/about' }
    ];
    const injectedUrls = injectWebsiteLinksSection(template, testUrl, testCanonicalUrls);
    
    const hasWebsiteLinksSection = injectedUrls.includes('## Website links (canonical)');
    const hasPrimarySite = injectedUrls.includes('Primary site: https://example.com');
    const hasCanonicalUrls = injectedUrls.includes('### Canonical URLs');
    
    testResults.urlInjection = hasWebsiteLinksSection && hasPrimarySite && hasCanonicalUrls;
    
    if (!testResults.urlInjection) {
      errors.push(`URL injection failed. Has section: ${hasWebsiteLinksSection}, Has primary site: ${hasPrimarySite}, Has canonical URLs: ${hasCanonicalUrls}`);
    }
  } catch (error) {
    errors.push(`URL injection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    // Test variable replacement
    const testBusinessName = 'TestBusiness';
    const replacedTemplate = template.replace(/\$\{businessName\}/g, testBusinessName);
    testResults.variableReplacement = replacedTemplate.includes(testBusinessName) && 
                                     !replacedTemplate.includes('${businessName}') &&
                                     template.includes('${businessName}'); // Ensure original had placeholders
    
    if (!testResults.variableReplacement) {
      errors.push('Variable replacement failed');
    }
  } catch (error) {
    errors.push(`Variable replacement error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    success: errors.length === 0,
    errors,
    testResults
  };
}

/**
 * Extracts section content for admin editing
 */
export function extractSectionContent(template: string, sectionTitle: string): {
  found: boolean;
  content: string;
  startIndex: number;
  endIndex: number;
} {
  // Use more specific regex to match exact section titles
  const sectionRegex = new RegExp(`^##\\s*${sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=(\\n#|\\n##|\\n$))`, 'm');
  const match = template.match(sectionRegex);
  
  if (!match) {
    return {
      found: false,
      content: '',
      startIndex: -1,
      endIndex: -1
    };
  }

  return {
    found: true,
    content: match[0],
    startIndex: match.index!,
    endIndex: match.index! + match[0].length
  };
}

/**
 * Replaces section content in template
 */
export function replaceSectionContent(
  template: string, 
  sectionTitle: string, 
  newContent: string
): string {
  const sectionRegex = new RegExp(`^##\\s*${sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=(\\n#|\\n##|\\n$))`, 'm');
  
  if (!sectionRegex.test(template)) {
    throw new Error(`Section "${sectionTitle}" not found in template`);
  }

  return template.replace(sectionRegex, `## ${sectionTitle}\n\n${newContent}\n\n`);
}
