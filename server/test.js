const express = require('express');
const app = express();
const server = app.listen(3002, () => {
  console.log("TEST RUNNING");
});
console.log("Server is:", typeof server, server.constructor.name);
