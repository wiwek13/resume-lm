
export enum AIErrorType {
    RATE_LIMIT = 'RATE_LIMIT',
    PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
    MODEL_UNAVAILABLE = 'MODEL_UNAVAILABLE',
    INVALID_API_KEY = 'INVALID_API_KEY',
    CONTEXT_LENGTH_EXCEEDED = 'CONTEXT_LENGTH_EXCEEDED',
    UNKNOWN = 'UNKNOWN',
}

export class AIError extends Error {
    constructor(
        public type: AIErrorType,
        message: string,
        public originalError?: any
    ) {
        super(message);
        this.name = 'AIError';
    }
}

export function classifyAIError(error: any): AIError {
    const message = error?.message || '';
    const status = error?.status || error?.statusCode;
    const body = error?.body ? JSON.stringify(error.body) : '';
    const fullMessage = `${message} ${body}`.toLowerCase();

    // Rate Limiting (429)
    if (status === 429 || fullMessage.includes('rate limit') || fullMessage.includes('too many requests')) {
        return new AIError(
            AIErrorType.RATE_LIMIT,
            'AI service is currently rate limited. Please try again in a moment.',
            error
        );
    }

    // Payment limits / Quota (402, sometimes 403/400 depending on provider)
    if (
        status === 402 ||
        fullMessage.includes('insufficient info') ||
        fullMessage.includes('insufficient_quota') ||
        fullMessage.includes('credit') ||
        fullMessage.includes('billing') ||
        fullMessage.includes('payment required')
    ) {
        return new AIError(
            AIErrorType.PAYMENT_REQUIRED,
            'AI provider credits exhausted. Please check your billing or API key.',
            error
        );
    }

    // Invalid Key (401)
    if (status === 401 || fullMessage.includes('invalid api key') || fullMessage.includes('authentication failed')) {
        return new AIError(
            AIErrorType.INVALID_API_KEY,
            'Invalid API key provided. Please check your settings.',
            error
        );
    }

    // Context Length (400 often)
    if (fullMessage.includes('context_length_exceeded') || fullMessage.includes('maximum context length')) {
        return new AIError(
            AIErrorType.CONTEXT_LENGTH_EXCEEDED,
            'The content is too long for this AI model. Please reduce the input size.',
            error
        );
    }

    // Server Errors (5xx) or Overloaded
    if (status >= 500 || fullMessage.includes('overloaded') || fullMessage.includes('capacity')) {
        return new AIError(
            AIErrorType.MODEL_UNAVAILABLE,
            'AI model is currently overloaded or down. Please try again later.',
            error
        );
    }

    // Fallback
    return new AIError(AIErrorType.UNKNOWN, message || 'An unexpected AI error occurred.', error);
}

/**
 * Wraps an AI operation with error handling
 */
export async function withAIErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        console.error('AI Operation Failed:', error);
        throw classifyAIError(error);
    }
}

export function getUserFacingError(error: any): { title: string; description: string; variant: "destructive" | "default" } {
    const message = error?.message || 'An unexpected error occurred.';
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
        return {
            title: 'Rate Limit Exceeded',
            description: 'You are going too fast. Please wait a moment before trying again.',
            variant: 'destructive'
        };
    }

    if (lowerMessage.includes('credits exhausted') || lowerMessage.includes('payment required') || lowerMessage.includes('insufficient info') || lowerMessage.includes('billing')) {
        return {
            title: 'Credits Exhausted',
            description: 'We are out of AI credits. Please check your plan or try a free model.',
            variant: 'destructive'
        };
    }

    if (lowerMessage.includes('invalid api key') || lowerMessage.includes('authentication failed')) {
        return {
            title: 'Configuration Error',
            description: 'Invalid API key. Please check your settings.',
            variant: 'destructive'
        };
    }

    if (lowerMessage.includes('content is too long')) {
        return {
            title: 'Content Too Long',
            description: 'The input text is too long for the AI to process. Please try shortening it.',
            variant: 'destructive'
        };
    }

    if (lowerMessage.includes('overloaded') || lowerMessage.includes('capacity')) {
        return {
            title: 'Service Busy',
            description: 'The AI service is currently overloaded. Please try again in a few minutes.',
            variant: 'destructive' // or 'warning' if available, but staying safe
        };
    }

    return {
        title: 'AI Error',
        description: message,
        variant: 'destructive'
    };
}
