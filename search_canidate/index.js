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

const allowedOrigins = ['http://localhost:3000', 'https://agile-job-front.vercel.app'];

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

const port = process.env.PORT ||3002;

dotenv.config();

const openai = new OpenAI({apiKey: process.env.OPENAI_KEY});

const loader = new TextLoader("output.txt");
const docs = await loader.load();

const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize:1000,
    chunkOverlap:200,
});
const texts = textSplitter.splitDocuments(docs);

const embeddings = new OpenAIEmbeddings({openAIApiKey: process.env.OPENAI_KEY});

const client = new PineconeClient();
await client.init({
    environment: process.env.PINECONE_ENV,
    apiKey: process.env.PINECONE_API_KEY,
});

const pineconeIndex = client.Index(process.env.PINECONE_INDEX);

const vectorStore = await PineconeStore.fromExistingIndex(
    embeddings,
    { pineconeIndex },
);


const getData = async (query) => {
    const context = await vectorStore.similaritySearch(query, 1);
    const pageContent = context[0].pageContent

    const systemContent = `You are an assistant that helps people to find suitable job candidates for their companies according to job description. When you are asked to show candidates you show candidates with their name, descroption, skills, experience from this list: ${pageContent}. Your answer should look like this: 'Тут самые подходящие кандидаты для вышего проекта: *candidates*'.`;
    const userContent = `Show suitable candidates for this job: ${query}`;

    const messages = [
        { role: "system", content: systemContent },
        { role: "user", content: userContent}
    ];

    const payload = {
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 1024,
        temperature: 0.7,
        presence_penalty: 0,
        frequency_penalty: 0.1,
    };

    const response = await openai.chat.completions.create(payload);
    return response.choices[0].message.content;
};

app.post('/search', cors(), async (req, res)=>{
    const { jobDescription } = req.body;

    try{
        const response = await getData(jobDescription);
        
        if(response === '' || response === null){
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