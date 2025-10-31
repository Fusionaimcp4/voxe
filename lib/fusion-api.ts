/**
 * Fusion API integration for model management and switching
 */

interface FusionModel {
  id: number;
  name: string;
  id_string: string;
  provider: string;
  input_cost_per_million_tokens: number;
  output_cost_per_million_tokens: number;
  context_length_tokens: number;
  supports_json_mode: boolean;
  supports_tool_use: boolean;
  supports_vision: boolean;
  description: string;
  release_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FusionModelsResponse {
  models: FusionModel[];
}

interface SwitchModelRequest {
  workflow_id: string;
  model: string;
}

interface SwitchModelResponse {
  success: boolean;
  message: string;
  workflow_id: string;
  model: string;
}

/**
 * Get Fusion API configuration
 */
export function getFusionConfig() {
  const baseUrl = process.env.FUSION_BASE_URL || 'https://fusion.mcp4.ai';
  const apiKey = process.env.FUSION_API_KEY;
  
  if (!apiKey) {
    throw new Error('FUSION_API_KEY environment variable is required');
  }
  
  return { baseUrl, apiKey };
}

/**
 * Make authenticated request to Fusion API
 */
async function fusionRequest(endpoint: string, options: RequestInit = {}) {
  const { baseUrl, apiKey } = getFusionConfig();
  
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Fusion API error: ${response.status} ${errorText}`);
  }
  
  return response.json();
}

/**
 * Retrieve available models from Fusion
 */
export async function getFusionModels(): Promise<FusionModel[]> {
  try {
    console.log('🔍 Fetching available models from Fusion...');
    const response = await fusionRequest('/api/models');
    
    // Handle different response structures
    const allModels = response.models || response.data || response;
    
    if (!Array.isArray(allModels)) {
      throw new Error('Invalid response format from Fusion API');
    }
    
    // Filter for only active models
    const activeModels = allModels.filter((model: FusionModel) => model.is_active === true);
    
    console.log(`✅ Retrieved ${allModels.length} total models, ${activeModels.length} active models from Fusion`);
    return activeModels;
  } catch (error) {
    console.error('❌ Failed to fetch Fusion models:', error);
    throw error;
  }
}

/**
 * Switch model for a specific workflow
 */
export async function switchFusionModel(workflowId: string, model: string): Promise<SwitchModelResponse> {
  try {
    console.log(`🔄 Switching model to ${model} for workflow ${workflowId}...`);
    
    const payload: SwitchModelRequest = {
      workflow_id: workflowId,
      model: model
    };
    
    // Try different possible endpoints for model switching
    const possibleEndpoints = [
      '/api/switch-model',
      '/switch-model',
      '/api/workflows/switch-model',
      '/api/workflows/switch',
      '/fusion/switch-model',
      '/api/v1/switch-model'
    ];
    
    let lastError: Error | null = null;
    
    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`Trying switch endpoint: ${endpoint}`);
        const response = await fusionRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        
        console.log(`✅ Model switched successfully for workflow ${workflowId} using ${endpoint}`);
        return response;
      } catch (error) {
        lastError = error as Error;
        console.log(`❌ Endpoint ${endpoint} failed:`, error instanceof Error ? error.message : 'Unknown error');
        continue;
      }
    }
    
    throw lastError || new Error('No valid endpoint found for Fusion model switching');
  } catch (error) {
    console.error(`❌ Failed to switch model for workflow ${workflowId}:`, error);
    throw error;
  }
}

/**
 * Validate that a model exists in Fusion
 */
export async function validateFusionModel(modelId: string): Promise<boolean> {
  try {
    const models = await getFusionModels();
    const modelExists = models.some(model => model.id_string === modelId);
    
    if (!modelExists) {
      console.warn(`⚠️ Model ${modelId} not found in Fusion`);
      return false;
    }
    
    console.log(`✅ Model ${modelId} validated in Fusion`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to validate model ${modelId}:`, error);
    return false;
  }
}

/**
 * Get model display name from model ID
 */
export async function getModelDisplayName(modelId: string): Promise<string> {
  try {
    const models = await getFusionModels();
    const model = models.find(m => m.id_string === modelId);
    
    if (!model) {
      return modelId; // Fallback to ID if not found
    }
    
    return model.name;
  } catch (error) {
    console.error(`❌ Failed to get display name for model ${modelId}:`, error);
    return modelId; // Fallback to ID
  }
}

/**
 * Convert Fusion model ID to n8n format
 */
export async function convertToN8nModelFormat(modelId: string): Promise<string> {
  try {
    const models = await getFusionModels();
    const model = models.find(m => m.id_string === modelId);
    
    if (!model) {
      return modelId; // Fallback to original ID if not found
    }
    
    // Convert to n8n format: "Provider:fusion_id"
    // Examples:
    // openai/gpt-4o -> "OpenAI:openai/gpt-4o"
    // anthropic/claude-3-haiku -> "Anthropic:anthropic/claude-3-haiku"
    
    const provider = model.provider;
    const fusionId = model.id_string;
    
    return `${provider}:${fusionId}`;
  } catch (error) {
    console.error(`❌ Failed to convert model ${modelId} to n8n format:`, error);
    return modelId; // Fallback to original ID
  }
}
