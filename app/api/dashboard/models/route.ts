import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFusionModels } from '@/lib/fusion-api';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const models = await getFusionModels();
    
    // Format models for dropdown (already filtered for active models)
    const formattedModels = models.map(model => ({
      id: model.id_string,
      name: model.name,
      provider: model.provider,
      description: model.description,
      isActive: model.is_active, // Should always be true now
      supportsJsonMode: model.supports_json_mode,
      supportsToolUse: model.supports_tool_use,
      supportsVision: model.supports_vision,
      contextLength: model.context_length_tokens,
      inputCost: model.input_cost_per_million_tokens,
      outputCost: model.output_cost_per_million_tokens
    }));

    return NextResponse.json({
      success: true,
      models: formattedModels
    });

  } catch (error) {
    console.error('Failed to fetch Fusion models:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch available models' },
      { status: 500 }
    );
  }
}
