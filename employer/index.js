const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const dotenv = require('dotenv');

dotenv.config({ path: './.env'})

const app = express();

app.use(express.urlencoded({extended: 'false'}))
app.use(express.json());

const port = 3000;

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'r2d2c3po',
    database: 'login-db'
});

db.connect((error)=>{
    if(error){
        console.log(error);
    }
    else{
        console.log('MySQL is Connected!')
    }
});

app.post('/auth/register', (req, res) => {
    const { name, email, password } = req.body;

    if (!email || !password || !name) {
        return res.status(400).send('Missing credentials');
    }

    if(!req.body){
        console.log(error)
        return res.status(401).send('Enter your data');
    }

    db.query('SELECT email FROM users WHERE email = ?', [email], async (error, result) => {
        if(error){
            console.log(error)
        }

        if( result.length > 0 ) {
            return res.status(400).send('User Already Registered');
        }

        // let hashedPassword = await bcrypt.hash(password, 8)
        // console.log(hashedPassword)
       
        db.query('INSERT INTO users SET?', {name: name, email: email, password: password}, (err, result) => {
            if(error) {
                console.log(error)
            } 
            else {                
                return res.status(200).send('Successfully Registered')
            }
        })        
    })
});

app.post('/auth/login', (req, res) => {
    const { name, email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Missing credentials');
    }

    db.query('SELECT * FROM users WHERE email = ?', [email], async (error, result) => {
        if(error){
            console.log(error)
            return res.status(500).send('Error during login');
        }

        if( result.length === 0 ) {
            return res.status(401).send('Authentication failed');
        }

        const user = result[0];
        const passwordMatch = password === user.password;
        
        if(!passwordMatch){
            return res.status(401).send('Authentication failed');
        }

        const token = jwt.sign({ userId: user.id, email: user.email }, 'your-secret-key', { expiresIn: '1h' });
        res.json({ token });
    })
});

app.listen(port, ()=>{
    console.log(`Example app listening on port ${port}`)
});