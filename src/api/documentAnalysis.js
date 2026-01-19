// Mock document analysis API
// In a real application, this would connect to a backend service with NLP capabilities

const analyzeDocument = async (file) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get file content for basic analysis
  const fileName = file.name.toLowerCase();
  const fileSize = file.size;
  
  // Mock analysis based on filename patterns
  let insights = {
    documentType: '',
    reason: '',
    actions: [],
    deadline: '',
    urgency: 'medium',
    legalAdvice: '',
    lawyerNeeded: false,
    consequences: {
      severity: 'medium',
      items: []
    }
  };

  // Analyze based on filename patterns
  if (fileName.includes('invoice') || fileName.includes('bill')) {
    insights = {
      documentType: 'This appears to be an invoice or bill for services/products rendered.',
      reason: 'You received this document because you have outstanding payment obligations for goods or services that were provided to you.',
      actions: [
        'Review the invoice details for accuracy',
        'Verify the payment amount and due date',
        'Process payment through your preferred method',
        'Keep a copy for your records',
        'Contact the sender if you have questions or disputes'
      ],
      deadline: 'Payment typically due within 30 days of invoice date',
      urgency: fileSize > 1000000 ? 'high' : 'medium',
      legalAdvice: 'Legal assistance generally not required for standard invoices, but may be needed if you dispute the charges.',
      lawyerNeeded: false,
      consequences: {
        severity: 'medium',
        items: [
          'Late fees may be applied after due date',
          'Service may be suspended for continued non-payment',
          'Credit score could be negatively impacted',
          'Account may be sent to collections'
        ]
      }
    };
  } else if (fileName.includes('contract') || fileName.includes('agreement')) {
    insights = {
      documentType: 'This is a legal contract or agreement that defines terms and conditions between parties.',
      reason: 'You received this document to review, understand, and potentially sign a legally binding agreement.',
      actions: [
        'Read the entire document carefully',
        'Highlight any terms you don\'t understand',
        'Note all obligations and responsibilities',
        'Check for any time-sensitive clauses',
        'Consider seeking legal review before signing',
        'Make a copy for your records'
      ],
      deadline: 'Response typically required within 14-30 days',
      urgency: 'high',
      legalAdvice: 'Legal consultation strongly recommended before signing any contract.',
      lawyerNeeded: true,
      consequences: {
        severity: 'high',
        items: [
          'Missing deadline may result in lost opportunity',
          'Signing without understanding could bind you to unfavorable terms',
          'May be held liable for breach of contract',
          'Could result in financial or legal penalties'
        ]
      }
    };
  } else if (fileName.includes('notice') || fileName.includes('letter')) {
    insights = {
      documentType: 'This appears to be an official notice or formal letter.',
      reason: 'You received this document to inform you of important information that requires your attention.',
      actions: [
        'Read the notice thoroughly',
        'Identify the main purpose and required actions',
        'Note any deadlines mentioned',
        'Gather any requested documentation',
        'Respond as instructed by the sender',
        'Keep proof of your response'
      ],
      deadline: 'Response typically required within 7-21 days',
      urgency: 'medium',
      legalAdvice: 'Legal advice may be needed depending on the notice content and implications.',
      lawyerNeeded: false,
      consequences: {
        severity: 'medium',
        items: [
          'May miss important opportunities or information',
          'Could face penalties for non-compliance',
          'Rights may be affected by inaction',
          'May need to pay additional fees for late response'
        ]
      }
    };
  } else if (fileName.includes('tax') || fileName.includes('irs') || fileName.includes('revenue')) {
    insights = {
      documentType: 'This is a tax-related document from a tax authority.',
      reason: 'You received this document regarding your tax obligations, refunds, or required filings.',
      actions: [
        'Verify your identity and tax information',
        'Review all figures and calculations',
        'Check for any discrepancies with your records',
        'Respond by the specified deadline',
        'Keep all documentation for at least 7 years',
        'Consider consulting a tax professional'
      ],
      deadline: 'Strict deadlines apply - typically 30-90 days',
      urgency: 'high',
      legalAdvice: 'Tax professional or lawyer recommended for complex tax matters.',
      lawyerNeeded: true,
      consequences: {
        severity: 'high',
        items: [
          'Penalties and interest will accrue on unpaid taxes',
          'Tax liens may be placed on your property',
          'Wage garnishment or bank levies possible',
          'Criminal charges for tax evasion in severe cases'
        ]
      }
    };
  } else {
    // Default analysis for unknown document types
    insights = {
      documentType: 'This appears to be a general business or personal document.',
      reason: 'You received this document for informational or action purposes related to your personal or business affairs.',
      actions: [
        'Read the document carefully',
        'Identify the main purpose and any required actions',
        'Note any important dates or deadlines',
        'Determine if additional information is needed',
        'Respond appropriately if a response is requested',
        'File the document for future reference'
      ],
      deadline: 'Deadline depends on document content',
      urgency: 'medium',
      legalAdvice: 'Legal advice typically not needed unless document contains legal language or obligations.',
      lawyerNeeded: false,
      consequences: {
        severity: 'low',
        items: [
          'May miss important information',
          'Could miss opportunities or deadlines',
          'May need to follow up for clarification'
        ]
      }
    };
  }

  return insights;
};

export { analyzeDocument };
