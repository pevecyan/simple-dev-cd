const colors = require('colors');
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const bufferEq = require('buffer-equal-constant-time');
const fs = require('fs');
const {exec} = require('child_process');

let config = initConfig();
if(!config){return}

let app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())


//HEALTH
app.get('/health', (req,res)=>{
    res.status(200).end('OK');
})

app.post('/',(req,res)=>{
    let payload = req.body;
    let sign = req.headers['x-hub-signature'] || '';

    
    if(verifySignature(config.token, JSON.stringify(req.body), sign)){
        res.end();
        console.log('Webhook recevied'.green);
        exec('git pull', {cwd:config.dir}, (err,out,oute)=>{
            console.log(out.yellow);
            if(!err)
                exec(config.deploy, {cwd:config.dir}, (err,out,oute)=>{
                    console.log(out.yellow);
                })
        })
    }else{
        res.status(401).end();
    }
    
})

app.get('/',(req,res)=>{
    debugger;
})



app.listen(config.port, ()=>{
    console.log(`CD server started on port ${config.port}`.green)
})

function initConfig(){
    let config;
    try {
        config = fs.readFileSync('./config.json', {encoding:'utf8'});
    } catch (error) {
        config = JSON.stringify({
            port:12888,
            dir:'./',
            deploy:'echo deploy',
            token:crypto.randomBytes(64).toString('hex'),
        },null,'\t');
        fs.writeFileSync('./config.json',config, {encoding:'utf8'})
    }
    try{
        config = JSON.parse(config);
    }catch(error){
        console.log('Problem reading config.json file'.red);
        return undefined;
    } 
    return config;
}

function signData(secret, data) {
	return 'sha1=' + crypto.createHmac('sha1', secret).update(data).digest('hex');
}

function verifySignature(secret, data, signature) {
	return bufferEq(new Buffer(signature), new Buffer(signData(secret, data)));
}