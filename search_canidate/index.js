import express from 'express';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PineconeClient } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import cors from 'cors';


const app = express();

app.use(express.json());

const allowedOrigins = ['http://localhost:3000','http://localhost:8080', 'https://agile-job-front.vercel.app', 'https://testapp.ediploma.kz', 'https://api.ediploma.kz', 'https://app.ediploma.kz'];

app.use(cors({
    origin: (origin, callback)=>{
        console.log(origin);
        if(!origin || allowedOrigins.indexOf(origin) !== -1){
            callback(null, true);
        }
        else{
            callback(new Error('Now Allowed by CORS'));
        }
    },
    credentials: true
}));

const port = process.env.PORT ||3002;

dotenv.config();

const openai = new OpenAI({apiKey: process.env.OPENAI_KEY});

const loader = new TextLoader("students.txt");

const docs = await loader.load();

const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize:1000,
    chunkOverlap:200,
});

const splittedDocs = await textSplitter.splitDocuments(docs);

const embeddings = new OpenAIEmbeddings({openAIApiKey: process.env.OPENAI_KEY});

const client = new PineconeClient();

await client.init({
    environment: "gcp-starter",
    apiKey: process.env.PINECONE_API_KEY,
});

const pineconeIndex = client.Index("jasaim");

const vectorStore = await PineconeStore.fromExistingIndex(
    embeddings,
    { pineconeIndex },
);

function getCandidates(candidates) {
    const ans = [];
    let i = 0;
    for(const canidate of candidates){
        const candidateInfo = {
            "id": i,
            "name": canidate.name,
            "description": canidate.description,
            "skills": canidate.skills,
            "experience": canidate.experience,
        };

        ans.push(candidateInfo);
        i = i + 1;
    }

    return ans;
}

const getData = async (query) => {
    const context = await vectorStore.similaritySearch(query, 4);
    console.log(context);
    const pageContentsArray = context.map((dict) => dict.pageContent).join(' ');

    const systemContent = `You are an assistant that helps people to find suitable job candidates for their companies according to job description. When you are asked to show candidates you show candidates with their name, descroption, skills, experience from this list: ${pageContentsArray}.`;
    const userContent = `Show suitable candidates for this job: ${query}`;

    const messages = [
        { role: "system", content: systemContent },
        { role: "user", content: userContent}
    ];

    const function_descriptions = [
        {
            "name": "getCandidates",
            "description": "Get candidates array with information about them, such as name, description, skills, experience",
            "parameters": {
                "type": "object",
                "properties": {
                    "candidates": {
                        "type": "object",
                        "description": "List of candidates with their names, description, skills, experience",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "candidate's names"
                            },
                            "description": {
                                "type": "string",
                                "description": "candidate's description"
                            },
                            "skills": {
                                "type": "string",
                                "description": "candidate's skills"
                            },
                            "experience": {
                                "type": "string",
                                "description": "candidate's experience"
                            },
                        }
                    },
                },
                "required": ["candidates"]
            },
        }
    ]

    const payload_function = {
        model: 'gpt-3.5-turbo-0613',
        messages: messages,
        functions: function_descriptions,
        function_call: "auto",
    };

    const response_function = await openai.chat.completions.create(payload_function);

    console.log(response_function.choices[0].message);

    const args = JSON.parse(response_function.choices[0].message.function_call.arguments);

    const candidates = args.candidates;

    const ans = getCandidates(candidates);
    const uniqueAns = ans.filter((candidate, index, self) => {
        return self.findIndex((c) => c.name === candidate.name) === index;
    });

    return uniqueAns;
};

app.get('/reset', cors(), (req, res)=>{
    console.log("Asked me to reset!");
    return res.status(200).json({ message: 'Data reset successfully on SearchCandidate' });
});

app.post('/search', cors(), async (req, res)=>{
    const { jobDescription } = req.body;

    try{
        const response = await getData(jobDescription);
        
        if(response === null){
            return res.status(500).json({ error: 'Error while loading candidates' });
        }

        res.status(200).json({ message: 'Data loaded successfully', data: response });
    } catch(error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, ()=>{
    console.log(`Search Candidates Microservice is runnning on port ${port}`);
});