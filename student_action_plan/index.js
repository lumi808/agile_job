const express = require('express');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const cors = require('cors')
const pdf = require('pdf-parse');
const fileUpload = require('express-fileupload');

const app = express();
app.use(express.urlencoded({extended: 'false'}))
app.use(express.json());
app.use(fileUpload());

const port = 3003;

const allowedOrigins = ['http://localhost:3000'];

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

dotenv.config({ path: './.env'});

const openai = new OpenAI({apiKey: process.env.OPENAI_KEY});


app.post('/student-action-plan/generate-plan', cors(), async (req, res)=>{
    const { major, yearOfStudy, dreamJob, dreamProject, careerGoal } = req.body;
    const fields = [major, yearOfStudy, dreamJob, dreamProject, careerGoal]; 

    try{
        if (fields.some(field => field === null || field === '')){
            return res.status(400).json({ error: 'Missing Prompt' });
        }

        const pdfResult = await pdf(req.files.cv);
        const pdfText = pdfResult.text;

        const prompt = `I am ${yearOfStudy} Year ${major} student. I want to be a ${dreamJob}. My dream project I would like to work on is ${dreamProject}. My main career goal for now is ${careerGoal}. Here is also my CV: ${pdfText}. Could you give me an action plan please?`
        const messages = [
            { role: "user", content: prompt },
            {
                role: "system",
                content: `You are a job assistant, who helps students to build their careers. Your main function is to provide a student with a action plan for building career according to student's current profile, CV, dream job, dream project, career goal. Your answer shhould be detailed as possible and should be structured in steps.`
            }
        ];

        console.log(prompt);

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