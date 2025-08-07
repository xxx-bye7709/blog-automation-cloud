const functions = require('firebase-functions');

exports.helloWorld = functions.https.onRequest((request, response) => {
  response.json({
    message: "Hello from Firebase Functions!",
    status: "success",
    timestamp: new Date().toISOString()
  });
});

console.log("Firebase Functions initialized successfully");
