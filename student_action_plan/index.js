const express = require('express');
const dotenv = require('dotenv');
const OpenAI = require('openai');

const app = express();
app.use(express.urlencoded({extended: 'false'}))
app.use(express.json());

const port = 3003;

dotenv.config({ path: './.env'});

const openai = new OpenAI({apiKey: process.env.OPENAI_KEY});

app.post('/student-action-plan/generate-plan', async (req, res)=>{
    const {prompt} = req.body;
    try{
        if (prompt === null || prompt === ''){
            return res.status(400).json({ error: 'Missing Prompt' });
        }

        const messages = [
            { role: "user", content: prompt },
            {
                role: "system",
                content: `You are a job assistant, who helps students to build their careers. Your main function is to provide a student with a action plan for building career according to student's current profile, CV, dream job, dream project, career goal.`
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
        }

        const response = await openai.chat.completions.create(payload);
        const actionPlan = response.choices[0].message.content;

        return res.status(200).json({ messages: 'Data generated successfully', data: actionPlan });
    }catch(error){
        console.error(error);
        res.status(500).json({error: 'Error while generating prompt'});
    }
});

app.listen(port, ()=>{
    console.log(`Student Action Plan Microservice in running on the port ${port}`);
});