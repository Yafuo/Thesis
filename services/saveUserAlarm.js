const express = require('express');
const app = express();

app.get('/user-alarm', (req, res) => {
    var userAlarm = req.body.userAlarm;
    console.log(`Received: ${userAlarm}`);
});
