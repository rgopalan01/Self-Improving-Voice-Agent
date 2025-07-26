const { 
    waitForLatestConversation, 
    getConversationDetails, 
    getCurrentAgentInfo 
} = require('./elevenlabs-client');
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Simple version counter (in production, you'd use a database)
let versionCounter = 1;

/**
 * Generate improved system prompt based on conversation using OpenAI
 * Analyzes slang, tone, speaking style and creates an improved system prompt
 * @param {string} currentPrompt - Current system prompt
 * @param {Array} transcript - Conversation transcript array
 * @param {Object} conversationData - Full conversation data from ElevenLabs
 * @returns {Promise<string>} Improved system prompt
 */
async function generateImprovedPrompt(currentPrompt, transcript, conversationData) {
    console.log('🤖 Using OpenAI to analyze conversation style...');
    
    // Extract user messages for style analysis
    const userMessages = transcript.filter(msg => msg.role === 'user');
    const agentMessages = transcript.filter(msg => msg.role === 'agent');
    const duration = conversationData.metadata?.call_duration_secs || 0;
    
    // Prepare conversation text for analysis
    const conversationText = transcript.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Agent'}: ${msg.message}`
    ).join('\n');
    
    // Create the analysis prompt for OpenAI
    const analysisPrompt = `Your analysis prompt`;

    // Call OpenAI for analysis
    const completion = await openai.chat.completions.create({
        model: "your-model",
        messages: [
            {
                role: "system",
                content: "You are an expert conversation analyst and prompt engineer. Return only the improved system prompt, nothing else."
            },
            {
                role: "user",
                content: analysisPrompt
            }
        ],
        temperature: 0.7,
        max_tokens: 2000
    });

    const improvedPrompt = completion.choices[0].message.content.trim();
    
    // Add version tracking and metadata
    const finalPrompt = improvedPrompt + `\n\n[Version ${versionCounter + 1}] - Style-adapted based on conversation analysis:
    - Conversation duration: ${duration} seconds
    - User messages: ${userMessages.length}
    - Agent messages: ${agentMessages.length}
    - Last conversation ID: ${conversationData.conversation_id}`;
    
    console.log('✅ OpenAI analysis completed successfully');
    console.log(`🔄 Generated improved prompt (${finalPrompt.length} characters)`);
    
    return finalPrompt;
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
        const improvedPrompt = await generateImprovedPrompt(currentPrompt, transcript, conversationDetails);
        
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