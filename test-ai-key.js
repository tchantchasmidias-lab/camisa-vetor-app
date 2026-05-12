const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const key = 'AIzaSyBNSn4g5kSIfjl5WtOEesNStMNGq5IVkIM';
  const genAI = new GoogleGenerativeAI(key);
  
  const modelsToTest = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'models/gemini-1.5-flash'
  ];

  for (const modelName of modelsToTest) {
    console.log(`Testando modelo: ${modelName}...`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('oi');
      console.log(`✅ SUCESSO com ${modelName}:`, result.response.text());
      return; // Se um funcionar, paramos aqui
    } catch (e) {
      console.log(`❌ FALHA com ${modelName}:`, e.message);
    }
  }
}

test();
