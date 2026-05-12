const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listAvailableModels() {
  // Usando a sua chave nova que você acabou de criar
  const key = 'AIzaSyClZUDBMvqOTMIJQ4I4Wqhf5-5b2lBdPTY';
  const genAI = new GoogleGenerativeAI(key);
  
  try {
    console.log("Solicitando lista de modelos ao Google...");
    // Usando uma chamada direta para listar os modelos
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
    const data = await response.json();
    
    if (data.models) {
      console.log("✅ Modelos encontrados:");
      data.models.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
    } else {
      console.log("❌ Nenhum modelo retornado. Resposta do Google:", JSON.stringify(data));
    }
  } catch (e) {
    console.log("❌ Erro ao listar modelos:", e.message);
  }
}

listAvailableModels();
