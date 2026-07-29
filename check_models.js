const fs = require('fs');

async function check() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  let key = '';
  for (const line of envFile.split('\n')) {
    if (line.startsWith('GOOGLE_GENAI_API_KEY=')) {
      key = line.split('=')[1].trim().replace(/['"]/g, '');
    }
  }

  if (!key) {
    console.log("No GOOGLE_GENAI_API_KEY found in .env.local");
    return;
  }

  console.log("Key prefix:", key.substring(0, 10));

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    if (data.error) {
      console.log("API Error:", data.error.message);
    } else if (data.models) {
      console.log("Available models:");
      data.models.forEach((m) => {
        if (m.supportedGenerationMethods.includes('generateContent')) {
          console.log("-", m.name.replace('models/', ''));
        }
      });
    } else {
      console.log(data);
    }
  } catch (err) {
    console.log("Fetch error:", err);
  }
}

check();
