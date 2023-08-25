const express = require('express');
const dotenv = require('dotenv');
const OpenAI = require("openai");
const app = express();

app.use(express.json())

const port = 3001;

dotenv.config({ path: './.env'});

const openai = new OpenAI({apiKey: process.env.OPENAI_KEY});

app.post('/generate-from-task', async (req, res)=>{
    const { task } = req.body;

    try{
        if(task === null || task === ''){
            return res.status(400).send('Missing prompt');
        }

        const messages = [
            { role: "user", content: task },
            {
                role: "system",
                content: `You are a job description writer assistant. You should write job description and requirements according to tasks that user will provide to you. Here is the example how job description should look like and formatted: 
                "Description: 
                *job description*
                Responsibilities:
                *responsibilities*
                Requirements:
                *requirements*
                "
                everything should be written with bullet points
                `
            }
        ];
    
        const payload = {
            model: 'gpt-3.5-turbo',
            messages: messages,
            temperature: 0,
            max_tokens: 1024,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            n: 1,
        };

        const response = await openai.chat.completions.create(payload);
        const jobDescription = response.choices[0].message.content;

        return res.status(200).send(jobDescription);
    } catch(error){
        console.error(error);
        res.status(500).send('Error while generating prompt');
    }
});

app.post('/generate-from-project', (req, res)=>{
    const { project } = req;
}); 

app.listen(port, ()=>{
    console.log(`Job Description Microservice is runnning on port ${port}`);
});