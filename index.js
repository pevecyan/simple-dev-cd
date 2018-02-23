let colors = require('colors');
let express = require('express');
let bodyParser = require('body-parser');
let crypto = require('crypto');
let fs = require('fs');
let {exec} = require('child_process');

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
    let {token, payload} = req.body;
    payload = JSON.parse(payload);
    
    if(token == config.token){
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