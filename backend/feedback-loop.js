const { 
    waitForLatestConversation, 
    getConversationDetails, 
    getCurrentAgentInfo 
} = require('./elevenlabs-client');

// Simple version counter (in production, you'd use a database)
let versionCounter = 1;

/**
 * Generate improved system prompt based on conversation
 * HACKERS: CUSTOMIZE THIS FUNCTION FOR YOUR HACKATHON PROJECT
 * @param {string} currentPrompt - Current system prompt
 * @param {Array} transcript - Conversation transcript array
 * @param {Object} conversationData - Full conversation data from ElevenLabs
 * @returns {string} Improved system prompt
 */
function generateImprovedPrompt(currentPrompt, transcript, conversationData) {
    // HACKERS: This is where you implement your feedback logic!
    // 
    // You have access to:
    // - currentPrompt: The current system prompt
    // - transcript: Array of conversation messages [{role: 'user/agent', message: '...'}]
    // - conversationData: Full conversation data (duration, metadata, etc.)
    //
    // Examples of what you could build:
    // - Analyze conversation sentiment and adjust tone
    // - Add domain-specific knowledge based on topics discussed
    // - Modify questioning strategy based on user responses
    // - Integrate with external LLMs (OpenAI, Claude, etc.) for prompt improvement
    // - Add personality traits based on conversation patterns
    
    // Remove any existing version tracking
    let newPrompt = currentPrompt.replace(/\[Version \d+.*?\]/g, '').trim();
    
    // Simple example: Add version tracking and basic conversation insights
    const userMessages = transcript.filter(msg => msg.role === 'user');
    const agentMessages = transcript.filter(msg => msg.role === 'agent');
    const duration = conversationData.metadata?.call_duration_secs || 0;
    
    // Add version and basic analytics
    newPrompt += `\n\n[Version ${versionCounter + 1}] - Improved based on conversation analysis:
- Conversation duration: ${duration} seconds
- User messages: ${userMessages.length}
- Agent messages: ${agentMessages.length}
- Last conversation ID: ${conversationData.conversation_id}`;
    
    // You could add more sophisticated improvements here:
    // - Sentiment analysis
    // - Topic detection
    // - Response quality assessment
    // - User satisfaction indicators
    
    return newPrompt;
}

/**
 * Main feedback loop processing function
 * This is called when a conversation ends
 * @param {string|null} currentPrompt - The current prompt to improve (if any)
 * @returns {Promise<Object>} Result with new version info and full prompt
 */
async function processConversationFeedback(currentPrompt = null) {
    try {
        console.log('🔄 Starting feedback loop processing...');
        
        // Step 1: Wait for and get the latest conversation
        const conversation = await waitForLatestConversation();
        if (!conversation) {
            throw new Error('No conversation found to analyze');
        }
        
        console.log(`📞 Found conversation: ${conversation.conversation_id}`);
        
        // Step 2: Get detailed conversation data
        const conversationDetails = await getConversationDetails(conversation.conversation_id);
        
        // Step 3: Get current agent prompt if not provided
        if (!currentPrompt) {
            const currentAgent = await getCurrentAgentInfo();
            currentPrompt = currentAgent.conversation_config?.agent?.prompt?.prompt || "You are a helpful assistant.";
        }
        
        // Step 4: Extract conversation transcript
        const transcript = conversationDetails.transcript || [];
        const userMessages = transcript.filter(msg => msg.role === 'user');
        const agentMessages = transcript.filter(msg => msg.role === 'agent');
        
        console.log(`🔧 Conversation analyzed - ${transcript.length} messages, ${userMessages.length} user, ${agentMessages.length} agent`);
        
        // Step 5: Generate improved prompt (THIS IS WHERE HACKERS CUSTOMIZE)
        const improvedPrompt = generateImprovedPrompt(currentPrompt, transcript, conversationDetails);
        
        // Step 6: Increment version and return result
        versionCounter++;
        const result = {
            version: `${versionCounter}.0`,
            description: `Enhanced based on conversation analysis`,
            conversationAnalyzed: conversation.conversation_id,
            timestamp: new Date().toISOString(),
            fullPrompt: improvedPrompt  // Return the complete new prompt
        };
        
        console.log('✅ Feedback loop completed successfully');
        console.log(`📞 Analyzed conversation: ${conversation.conversation_id}`);
        console.log(`🔄 Generated new prompt version ${result.version}`);
        console.log(`📝 New prompt length: ${improvedPrompt.length} characters`);
        
        return result;
        
    } catch (error) {
        console.error('❌ Feedback loop failed:', error);
        throw error;
    }
}

module.exports = {
    processConversationFeedback,
    generateImprovedPrompt
};