import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  try {
    console.log("Key starting with:", process.env.GOOGLE_GENAI_API_KEY?.substring(0, 10));
    // Unfortunately, the @google/generative-ai JS SDK doesn't natively expose ListModels directly 
    // in an easy way on the root object without making a direct fetch request, 
    // but let's make a direct fetch to the REST API to see the models.
    const key = process.env.GOOGLE_GENAI_API_KEY;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    console.log(JSON.stringify(data.models.map((m: any) => m.name), null, 2));
  } catch (error) {
    console.error(error);
  }
}

run();
