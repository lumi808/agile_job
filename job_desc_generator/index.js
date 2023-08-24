const express = require('express');

const app = express();

app.use(express.json())

const port = 3001;

app.post('/generate-from-task', (req, res)=>{
    const { task } = req;
});

app.post('/generate-from-project', (req, res)=>{
    const { project } = req;
}); 

app.listen(port, ()=>{
    console.log(`Job Description Microservice is runnning on port ${port}`);
});