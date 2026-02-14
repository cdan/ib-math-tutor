const https = require('https');

const API_KEY = "AIzaSyCBZVFNstM98uWvCxzI_GIWiyyuuRIPYhY";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.models) {
        console.log("Available Models:");
        json.models.forEach(m => {
          if (m.supportedGenerationMethods.includes("generateContent")) {
            console.log(`- ${m.name}`);
          }
        });
      } else {
        console.log("Error listing models:", json);
      }
    } catch (e) {
      console.error("Parse Error:", e);
    }
  });
}).on('error', (e) => {
  console.error("Request Error:", e);
});
