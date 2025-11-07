const { Configuration, OpenAIApi } = require('openai');

let client = null;
function getClient(){
  if (client) return client;
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    // return null to indicate no real client available; callers should fallback to mock responses
    return null;
  }
  const config = new Configuration({ apiKey: key });
  client = new OpenAIApi(config);
  return client;
}

async function chatCompletion(messages){
  const openai = getClient();
  if (!openai) {
    // mock response when no API key is provided (useful for local dev)
    const joined = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    return {
      choices: [
        { message: { role: 'assistant', content: `Mock reply based on provided messages. (No OPENAI_API_KEY set)\n\nReceived:\n${joined}` } }
      ]
    };
  }
  const resp = await openai.createChatCompletion({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages,
    max_tokens: 800
  });
  return resp.data;
}

module.exports = { chatCompletion };
