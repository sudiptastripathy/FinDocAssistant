// netlify/functions/claude-score.js
import Anthropic from '@anthropic-ai/sdk';

// Daily cost limit in dollars
const DAILY_COST_LIMIT = 1.0;

// In-memory cost tracking (shared across function invocations)
let dailyCostTracker = {
  date: new Date().toISOString().split('T')[0],
  totalCost: 0
};

function checkAndResetDailyLimit() {
  const today = new Date().toISOString().split('T')[0];
  if (dailyCostTracker.date !== today) {
    dailyCostTracker = {
      date: today,
      totalCost: 0
    };
  }
}

function calculateCost(inputTokens, outputTokens) {
  // Pricing for claude-haiku-3.5 (cheaper for scoring)
  // Input: $0.80 per million tokens
  // Output: $4.00 per million tokens
  const inputCostPer1M = 0.80;
  const outputCostPer1M = 4.00;
  
  const inputCost = (inputTokens / 1000000) * inputCostPer1M;
  const outputCost = (outputTokens / 1000000) * outputCostPer1M;
  
  return inputCost + outputCost;
}

export default async function handler(request, context) {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  checkAndResetDailyLimit();
  
  if (dailyCostTracker.totalCost >= DAILY_COST_LIMIT) {
    return new Response(
      JSON.stringify({
        error: 'Daily API cost limit reached',
        errorType: 'rate_limit_error',
        dailyLimit: DAILY_COST_LIMIT,
        currentUsage: dailyCostTracker.totalCost
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { extractedData, validationResults } = await request.json();

    if (!extractedData) {
      return new Response(
        JSON.stringify({ error: 'Missing extractedData in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `You are a confidence scoring assistant. Review the following extracted financial document data and provide confidence scores.

Extracted Data:
${JSON.stringify(extractedData, null, 2)}

Validation Results:
${JSON.stringify(validationResults, null, 2)}

For each field in the extracted data, provide:
1. A confidence score (0-100)
2. Brief reasoning (1-2 sentences max)

Return ONLY valid JSON with this structure:
{
  "field_scores": {
    "vendor_name": {
      "confidence": 95,
      "reasoning": "Clearly visible business name at the top of the document"
    },
    "reference_number": {
      "confidence": 90,
      "reasoning": "Invoice number is clearly labeled"
    },
    // ... other fields
  },
  "overall_confidence": 92
}`
        }
      ]
    });

    const inputTokens = message.usage.input_tokens;
    const outputTokens = message.usage.output_tokens;
    const cost = calculateCost(inputTokens, outputTokens);

    dailyCostTracker.totalCost += cost;

    const scoreText = message.content[0].text;
    const scoreData = JSON.parse(scoreText);

    return new Response(
      JSON.stringify({
        success: true,
        data: scoreData,
        usage: {
          inputTokens,
          outputTokens,
          cost,
          dailyTotal: dailyCostTracker.totalCost,
          dailyLimit: DAILY_COST_LIMIT,
          remainingBudget: Math.max(0, DAILY_COST_LIMIT - dailyCostTracker.totalCost)
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in claude-score function:', error);

    if (error.status === 401) {
      return new Response(
        JSON.stringify({
          error: 'API authentication failed',
          errorType: 'authentication_error'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (error.status === 429) {
      return new Response(
        JSON.stringify({
          error: 'API rate limit exceeded',
          errorType: 'rate_limit_error'
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        errorType: 'server_error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
