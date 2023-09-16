const express = require('express');
const dotenv = require('dotenv');
const OpenAI = require("openai");
const app = express();
const cors = require('cors');

app.use(express.json())

const allowedOrigins = ['http://localhost:3000', 'https://agile-job-front.vercel.app/recruiter'];

app.use(cors({
    origin: (origin, callback)=>{
        if(allowedOrigins.includes(origin)){
            callback(null, true);
        }
        else{
            callback(new Error('Now Allowed by CORS'));
        }
    }
}));

const port = process.env.PORT || 3001;

dotenv.config({ path: './.env'});

const openai = new OpenAI({apiKey: process.env.OPENAI_KEY});

app.post('/generate-from-task', cors(), async (req, res)=>{
    const { prompt } = req.body;

    try{
        if(prompt === null || prompt === ''){
            return res.status(400).json({ error: 'Missing Prompt' });
        }

        const messages = [
            { role: "user", content: prompt },
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

        return res.status(200).json({ message: 'Data generated successfully', data: jobDescription });
    } catch(error){
        console.error(error);
        res.status(500).json({ error: 'Error while generating prompt' });
    }
});

app.post('/generate-from-project', cors(), async (req, res)=>{
    const { prompt } = req.body;

    try{
        if(prompt === null || prompt === ''){
            return res.status(400).json({ error: 'Missing Prompt' });
        }

        const messages = [
            { role: "user", content: prompt },
            {
                role: "system",
                content: `You are a job description writer assistant. You should write job description and requirements according to project description and role that user will provide to you. Here is the example how job description should look like and formatted: 
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

        return res.status(200).json({ message: 'Data generated successfully', data: jobDescription });
    } catch(error){
        console.error(error);
        res.status(500).json({ error: 'Error while generating prompt' });
    }
}); 

app.listen(port, ()=>{
    console.log(`Job Description Microservice is runnning on port ${port}`);
});