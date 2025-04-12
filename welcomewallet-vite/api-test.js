// API endpoint test script
import axios from 'axios';

const testGrokAPI = async () => {
  const apiKey = 'xai-qC9F3llia2ofvT7zrFX5jSe9MbZaCiadxp7R4RKErWc5ITmq4dBJbXodgvMjldVflRYF1bVxXf7A2Sra';
  const endpoint = 'https://api.x.ai/v1/chat/completions';
  
  try {
    const response = await axios.post(
      endpoint, 
      {
        model: 'grok-3-latest',
        messages: [
          {
            role: 'system',
            content: 'You are a test assistant.'
          },
          {
            role: 'user',
            content: 'Testing. Just say hi and hello world and nothing else.'
          }
        ],
        stream: false,
        temperature: 0
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    console.log('Grok API Response:', response.status);
    console.log('Response data:', response.data);
    return true;
  } catch (error) {
    console.error('Error testing Grok API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
};

const testBaseRPC = async () => {
  const rpcUrl = 'https://mainnet.base.org';
  
  try {
    const response = await axios.post(
      rpcUrl,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_blockNumber',
        params: []
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Base RPC Response:', response.status);
    console.log('Current block number:', parseInt(response.data.result, 16));
    return true;
  } catch (error) {
    console.error('Error testing Base RPC:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
};

// Run tests
(async () => {
  console.log('Starting API tests...');
  
  console.log('\nTesting Grok API...');
  const grokResult = await testGrokAPI();
  
  console.log('\nTesting Base RPC...');
  const baseResult = await testBaseRPC();
  
  console.log('\nTest Results:');
  console.log('- Grok API:', grokResult ? '✅ PASSED' : '❌ FAILED');
  console.log('- Base RPC:', baseResult ? '✅ PASSED' : '❌ FAILED');
})();