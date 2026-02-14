const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "AIzaSyCBZVFNstM98uWvCxzI_GIWiyyuuRIPYhY");
  const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Dummy model to init

  // There isn't a direct "listModels" on the client instance easily in the node SDK sometimes, 
  // but we can try to fetch a known model.
  
  // Actually, let's just try a simple generate content call with "gemini-pro" to see if it works.
  try {
    const result = await model.generateContent("Hello");
    console.log("Success with gemini-pro:", result.response.text());
  } catch (e) {
    console.error("Failed with gemini-pro:", e.message);
  }
}

listModels();
