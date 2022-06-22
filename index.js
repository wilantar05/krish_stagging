require('dotenv').config()
const express = require('express')
const app = express()
let port = process.env.PORT || 3000
const bodyParser = require('body-parser')
const helmet = require("helmet");

const bogBridge = require("./functions/bogBridge");

const ticksToDate = require('ticks-to-date');

const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc=require("swagger-jsdoc");
const jwt = require('jsonwebtoken');

var cors = require('cors')
const crypto = require('crypto');

function encrypt (text, key) {
    try {
      const IV_LENGTH = 16 // For AES, this is always 16
      let iv = crypto.randomBytes(IV_LENGTH)
      let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv)
      let encrypted = cipher.update(text)
  
      encrypted = Buffer.concat([encrypted, cipher.final()])
  
      return iv.toString('hex') + ':' + encrypted.toString('hex')
    } catch (err) {
      throw err
    }
}
  
function decrypt (text, key) {
    try {
      let textParts = text.split(':')
      let iv = Buffer.from(textParts.shift(), 'hex')
      let encryptedText = Buffer.from(textParts.join(':'), 'hex')
      let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv)
      let decrypted = decipher.update(encryptedText)
  
      decrypted = Buffer.concat([decrypted, decipher.final()])
  
      return decrypted.toString()
    } catch (err) {
      throw err
    }
}
  
function CheckDate(tickDate){
    return new Promise ((resolve, reject) => {
        try{
            const date = ticksToDate(tickDate);
            const curDate = new Date(new Date().toISOString());

            const milSec = Math.floor((date-curDate)/60000);
            
            //console.log(date, curDate, milSec);

            if(milSec>0){
                resolve("allowed"); //console.log("allowed");
            }else{
                resolve("not allowed"); //console.log("not allowed");
            }
        } catch(err){
            console.log(err);
            reject(err);
        }
    })
}

function authenticateToken(req, res, next){
    //console.log(req.headers);

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(token === null) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
        if(err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

function generateAccessToken(user){
    return jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '24h' });
}
  // var password = "mynameispaulmowat"
  // var key = "YFpoGQ@$VrUMf64tZ9eg^RiaQSZ^Pw%*"
  
  // var encrypted = encrypt(password, key)
  // var decrypted = decrypt("EC30EFE238CF43D190B0A36819D86085:1950D036C49698CE6C24C644D16AFA2B", key)
  
  // console.log('Original: ' + password)
  // console.log('Encrypted: ' + encrypted)
  // console.log('Decrypted: ' + decrypted)


app.use(bodyParser.json());
app.use(helmet());

var whitelist = ['https://bog-test.miracledev.net/']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Battle of Guardian",
            version: "1.0.0",
            description: "A simple Express Library API",
        },
        servers: [
            {
                url: "http://localhost:3000",
            },
        ],
        components:{
            securitySchemes: {
                bearerAuth: {
                  type: "http",
                  scheme: "bearer",
                  bearerFormat: "JWT",
                },
            },
        },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
    apis: ["./index.js"],
};

const specs = swaggerJsDoc(options);

/**
 * @swagger
 * components:
 *   schemas:
 *     Test:
 *       type: object
 *       required:
 *         - title
 *         - author
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the book
 *         title:
 *           type: string
 *           description: The book title
 *         author:
 *           type: string
 *           description: The book author
 *       example:
 *         id: d5fE_asz
 *         title: The New Turing Omnibus
 *         author: Alexander K. Dewdney

 *     Send Reward:
 *       type: object
 *       required:
 *         - recepientAddress
 *         - amount
 *       properties:
 *         recepientAddress:
 *           type: string
 *           description: the walletAddress of the player
 *         amount:
 *           type: string
 *           description: the amount of token that will be sent
 *       example:
 *         recepientAddress: "0xBCD69146f2111cDd4e4E586B29322b39963474e0"
 *         amount: "1"

 *     Check Join Room:
 *       type: object
 *       required:
 *         - tourId
 *         - playerId
 *         - char
 *         - walletAddress
 *         - championshipPoint

 *       properties:
 *         tourId:
 *           type: string
 *           description: ID of the tournament that will be joined
 *         playerId:
 *           type: string
 *           description: ID of the player that want to join
 *         char:
 *           type: string
 *           description: ID of the character that the player will use
 *         walletAddress:
 *           type: string
 *           description: Wallet Address of the player
 *         championshipPoint:
 *           type: string
 *           description: Championship Point that the player has
 *       example:
 *         tourId: "666"
 *         playerId: "Asmodeus"
 *         char: "6"
 *         walletAddress: "0xBCD69146f2111cDd4e4E586B29322b39963474e0"
 *         championshipPoint: "666"

 *     Last Login:
 *       type: object
 *       required:
 *         - username
 *         - localTimeStamp

 *       properties:
 *         username:
 *           type: string
 *           description: Username of the player
 *         localTimeStamp:
 *           type: string
 *           description: Timestamp sent by player

 *       example:
 *         username: "0xBCD69146f2111cDd4e4E586B29322b39963474e0"
 *         localTimeStamp: "Asmodeus"

 *     Last Login Checker:
 *       type: object
 *       required:
 *         - username

 *       properties:
 *         username:
 *           type: string
 *           description: Username of the player

 *       example:
 *         username: "0xBCD69146f2111cDd4e4E586B29322b39963474e0"

 *     Request Token:
 *       type: object
 *       required:
 *         - title
 *         - author
 *       properties:
 *         wallet:
 *           type: string
 *           description: The auto-generated id of the book
 *         date:
 *           type: string
 *           description: The book title
 *       example:
 *         wallet: "0x502cea2a7ce5f3b7e9ef8b8359cb69480d8d605e"
 *         date: "8804D499BECA28DAC558C9428F8A8EDD:3456F3C24C19F524C83077184D949C90F86446F237FEFACBDBEC1261B2B38B6C"

 *     Join Tournament:
 *       type: object
 *       required:
 *         - playerId
 *         - walletAddress
 *         - championshipPoint
 *         - _id
 *       properties:
 *         playerId:
 *           type: string
 *           description: ID of the player
 *         walletAddress:
 *           type: string
 *           description: Wallet Address of the player
 *         championshipPoint:
 *           type: int
 *           description: Championship Point of the player
 *         _id:
 *           type: string
 *           description: ID of the room
 *       example:
 *         playerId: "watermelon"
 *         walletAddress: "watermelon"
 *         championshipPoint: "6"
 *         _id: "6267ab494b71f2d443abb3c2"

 *     Start Tournament:
 *       type: object
 *       required:
 *         - _id
 *       properties:
 *         _id:
 *           type: string
 *           description: ID of the room
 *       example:
 *         _id: "6267ab494b71f2d443abb3c2"

 *     Get Tournament:
 *       type: object
 *       required:
 *         - _id
 *       properties:
 *         _id:
 *           type: string
 *           description: ID of the room
 *       example:
 *         _id: "6267ab494b71f2d443abb3c2"

 *     Receive Tournament List:
 *       type: object
 *       required:
 *         - startIndex
 *         - count
 *         - maxPlayer
 *       properties:
 *         startIndex:
 *           type: int
 *           description: Start index of the room list
 *         count:
 *           type: int
 *           description: How many room list to be shown
 *         maxPlayer:
 *           type: int
 *           description: Only show room that match the maxPlayer
 *       example:
 *         startIndex: "0"
 *         count: "5"
 *         maxPlayer: "4"

 *     Check Update Tournament:
 *       type: object
 *       required:
 *         - _id
 *       properties:
 *         _id:
 *           type: string
 *           description: ID of the room
 *       example:
 *         _id: "6267ab494b71f2d443abb3c2"

 *     Check Update Tournament V2:
 *       type: object
 *       required:
 *         - _id
 *       properties:
 *         _id:
 *           type: string
 *           description: list ID of the room
 *       example:
 *         _id: "6267a884ee905762f76b3a85,6267ab11eda1eb7e3ae629da,6267ab494b71f2d443abb3c2"

 *     Check Update Tournament List:
 *       type: object
 *       required:
 *       properties:
 *       example:

 *     Receive Match Result:
 *       type: object
 *       required:
 *         - data
 *       properties:
 *         data:
 *           type: string
 *           description: Data of the match
 *       example:
 *         data: "{\"playersId\":[\"Windmelon\",\"watermelon\"],\"walletAddress\":[\"windmelon\",\"watermelon\"],\"_id\":\"6267ba2dc3563530245020cb\",\"tourId\":\"6267ab494b71f2d443abb3c2\",\"tourDataId\":0,\"price\":0,\"roundWins\":[0,0],\"lastHp\":[1000,1000],\"characters\":[16,26],\"results\":[0,0],\"hasEnded\":false,\"lastUpdate\":1649065598}"

 *     Update Character:
 *       type: object
 *       required:
 *         - _id
 *         - p1Id
 *         - char1
 *         - p2Id
 *         - char2
 *       properties:
 *         _id:
 *           type: string
 *           description: ID of the room
 *         p1Id:
 *           type: string
 *           description: ID of the player 1
 *         char1:
 *           type: int
 *           description: ID of player1's character
 *         p2Id:
 *           type: string
 *           description: ID of the player 2
 *         char2:
 *           type: int
 *           description: ID of player2's character
 *       example:
 *         _id: "6267ab494b71f2d443abb3c2"
 *         p1Id: "watermelon"
 *         char1: "4"
 *         p2Id: "watermelon"
 *         char2: "4"

 *     Create Tournament:
 *       type: object
 *       required:
 *         - maxPlayers
 *         - arena
 *         - playerId
 *         - walletAddress
 *         - price
 *         - championshipPoint
 *         - rounds
 *         - time
 *         - victorySetting
 *         - charSelect
 *         - hwSetting
 *         - privateSlots
 *         - password
 *         - comment
 *       properties:
 *         maxPlayers:
 *           type: string
 *           description: how many players can join
 *         arena:
 *           type: int
 *           description: ID of the arena that will be used
 *         playerId:
 *           type: string
 *           description: ID of the room creator
 *         walletAddress:
 *           type: string
 *           description: Wallet Address of the creator
 *         price:
 *           type: string
 *           description: How much player should pay to join
 *         championshipPoint:
 *           type: int
 *           description: Championship Point of the creator
 *         rounds:
 *           type: int
 *           description: How many rounds each game
 *         time:
 *           type: int
 *           description: Time limit of each round
 *         victorySetting:
 *           type: int
 *           description: Victory setting
 *         charSelect:
 *           type: int
 *           description: Character selection mode
 *         hwSetting:
 *           type: int
 *           description: Hardware setting
 *         privateSlots:
 *           type: int
 *           description: how many slots are private
 *         password:
 *           type: string
 *           description: Comment of the room
 *         comment:
 *           type: string
 *           description: Comment of the room
 *       example:
 *         maxPlayers: "4"
 *         arena: "0"
 *         playerId: "6"
 *         walletAddress: "0xa21b27907f98650688d1cb3b597dcc3d529693af"
 *         championshipPoint: "6"
 *         rounds: "3"
 *         time: "99"
 *         victorySetting: "0"
 *         charSelect: "0"
 *         hwSetting: "0"
 *         privateSlots: "0"
 *         password: ""
 *         comment: ""


 */


 /**
  * @swagger
  * tags:
  *   name: Test
  *   description: Testing API
  */

/**
 * @swagger
 * /:
 *   get:
 *     summary: test api
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: The test was successfully response "Test"
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Some server error
 */

app.get("/", (req,res) => {
    res.json("Test")
})

/**
 * @swagger
 * /sendReward:
 *   post:
 *     summary: send reward to winner
 *     tags: [Send Reward]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Send Reward'
 *     responses:
 *       200:
 *         description: The test was successfully response "request body"
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Some server error
 */

 app.post('/sendReward',authenticateToken, (req, res) =>{ 
  bogBridge.sendToken(req.body).then(result=>{
    if(result===500) res.sendStatus(500);
    else res.json(result);
  });//, res);
});

/**
 * @swagger
 * /checkJoinRoom:
 *   post:
 *     summary: Check if User can join championship room
 *     tags: [Check Join Room]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Check Join Room'
 *     responses:
 *       200:
 *         description: The test was successfully response "request body"
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Some server error
 */

app.post('/checkJoinRoom', authenticateToken, (req, res) =>{ 
  console.log(req.body);
  bogBridge.checkJoinRoom(req.body.transactionHash, res);
});

app.post('/test', (req,res)=>{
    //const username = req.body.username;
    //res.sendStatus(403);
    bogBridge.TestCode(req.body,res).then(result=>{
      if(result===500) res.sendStatus(result);
        else res.send(result);
     });
})


/**
 * @swagger
 * /reqToken:
 *   post:
 *     summary: Check if User can join championship room
 *     tags: [Check Join Room]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Request Token'
 *     responses:
 *       200:
 *         description: The test was successfully response "request body"
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Some server error
 */

app.post('/reqToken',(req,res)=>{
    const username = req.body.wallet;
    const user = {username};

    //console.log(req.body.date, process.env.DECRYPT_KEY);

    const dateRequest = decrypt(req.body.date, process.env.DECRYPT_KEY);

    //console.log("date request",dateRequest);

    var accessToken = null;

    if(dateRequest !== null){
        CheckDate(parseInt(dateRequest)).then(result => {
            if(result !== null){ 
                accessToken = generateAccessToken(user);
                res.send(accessToken);
            }
        });
    }
})

/**
 * @swagger
 * /CreateTournament:
 *   post:
 *     summary: Create Tournament Room
 *     tags: [Create Tournament]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Create Tournament'
 *     responses:
 *       200:
 *         description: The test was successfully response "request body"
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Some server error
 */

app.post('/CreateTournament',authenticateToken,(req,res)=>{

 bogBridge.CreateTournament(req.body).then(result=>{
  if(result===500) res.sendStatus(result);
    else res.send(result);
 });

})

/**
 * @swagger
 * /JoinTournament:
 *   post:
 *     summary: Join Tournament Room
 *     tags: [Join Tournament]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Join Tournament'
 *     responses:
 *       200:
 *         description: The test was successfully response "request body"
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Some server error
 */

app.post('/JoinTournament',authenticateToken,(req,res)=>{
  bogBridge.JoinTournament(req.body).then(result=>{
   if(result===500) res.sendStatus(result);
    else res.send(result);
  });
})

/**
 * @swagger
 * /GetTournament:
 *   post:
 *     summary: Get Tournament Room Data
 *     tags: [Get Tournament]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Get Tournament'
 *     responses:
 *       200:
 *         description: The test was successfully response "request body"
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Some server error
 */

app.post('/GetTournament',authenticateToken,(req,res)=>{
  bogBridge.GetTournamentData(req.body).then(result=>{
    if(result===500) res.sendStatus(result);
    else res.send(result);
  });
})

/**
 * @swagger
 * /ReceiveTournamentList:
 *   post:
 *     summary: Show list of available tournament rooms
 *     tags: [Receive Tournament List]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Receive Tournament List'
 *     responses:
 *       200:
 *         description: The test was successfully response "request body"
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Some server error
 */

app.post('/ReceiveTournamentList',authenticateToken,(req,res)=>{
  bogBridge.ReceiveTournamentList(req.body).then(result=>{
    if(result===500) res.sendStatus(result);
    else res.send(result);
  });
})

/**
 * @swagger
 * /CheckUpdateTournamentList:
 *   post:
 *     summary: Show update of available tournament rooms
 *     tags: [Check Update Tournament List]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Check Update Tournament List'
 *     responses:
 *       200:
 *         description: The test was successfully response "request body"
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Some server error
 */

app.post('/CheckUpdateTournamentList',authenticateToken,(req,res)=>{
  bogBridge.CheckUpdateTournamentList().then(result=>{
    if(result===500) res.sendStatus(result);
    else res.send(result);
  });
})

/**
 * @swagger
 * /CheckUpdateTournament:
 *   post:
 *     summary: Show update of certain tournament room
 *     tags: [Check Update Tournament]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Check Update Tournament'
 *     responses:
 *       200:
 *         description: The test was successfully response "request body"
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Some server error
 */

app.post('/CheckUpdateTournament',authenticateToken,(req,res)=>{
  bogBridge.CheckUpdateTournament(req.body).then(result=>{
    if(result===500) res.sendStatus(result);
    else res.send(result);
  });
})

/**
 * @swagger
 * /CheckUpdateTournamentV2:
 *   post:
 *     summary: Show update of some tournament rooms
 *     tags: [Check Update Tournament V2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Check Update Tournament V2'
 *     responses:
 *       200:
 *         description: The test was successfully response "request body"
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Some server error
 */

app.post('/CheckUpdateTournamentV2',authenticateToken,(req,res)=>{
  bogBridge.CheckUpdateTournamentV2(req.body).then(result=>{
    if(result===500) res.sendStatus(result);
    else res.send(result);
  });
})

/**
 * @swagger
 * /StartTournament:
 *   post:
 *     summary: Start the tournament
 *     tags: [Start Tournament]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Start Tournament'
 *     responses:
 *       200:
 *         description: The test was successfully response "request body"
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Some server error
 */

app.post('/StartTournament',authenticateToken,(req,res)=>{
  bogBridge.StartTournament(req.body).then(result=>{
    if(result===500) res.sendStatus(result);
    else res.send(result);
  });
})

/**
 * @swagger
 * /ReceiveMatchResult:
 *   put:
 *     summary: Receive data of the match
 *     tags: [Receive Match Result]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Receive Match Result'
 *     responses:
 *       200:
 *         description: The test was successfully response "request body"
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Some server error
 */

app.post('/ReceiveMatchResult',(req,res)=>{
  bogBridge.ReceiveMatchResult(req.body,res).then(result=>{
    if(result===500) res.sendStatus(result);
    else res.send(result);
  });
})

/**
 * @swagger
 * /UpdateCharacter:
 *   post:
 *     summary: Update the character data in tournament room
 *     tags: [Update Character]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Update Character'
 *     responses:
 *       200:
 *         description: The test was successfully response "request body"
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Some server error
 */

app.post('/UpdateCharacter',authenticateToken,(req,res)=>{
  bogBridge.UpdateCharacter(req.body).then(result=>{
    if(result===500) res.sendStatus(result);
    else res.send(result);
  })
})

/**
 * @swagger
 * /LastLogin:
 *   post:
 *     summary: Input last login of the player into database
 *     tags: [Last Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Last Login'
 *     responses:
 *       200:
 *         description: The test was successfully response "request body"
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Some server error
 */

app.post('/LastLogin',authenticateToken,(req,res)=>{
  bogBridge.LastLogin(req.body).then(result=>{
    if(result===500) res.sendStatus(result);
    else res.send(result);
  });
})

app.post('/UnStart',(req,res)=>{
  bogBridge.UnStartTournament(req.body).then(result=>{
    if(result===500) res.sendStatus(result);
    else res.send(result);
  });
  
})

/**
 * @swagger
 * /LastLoginChecker:
 *   post:
 *     summary: Check player's last login time
 *     tags: [Last Login Checker]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Last Login Checker'
 *     responses:
 *       200:
 *         description: The test was successfully response "request body"
 *         content:
 *           application/json:
 *             schema:
 *       500:
 *         description: Some server error
 */

app.post('/LastLoginChecker',authenticateToken,(req,res)=>{
  bogBridge.LastLoginChecker(req.body).then(result=>{
    if(result===500) res.sendStatus(result);
    else res.send(result);
  });
})

app.post('/RemoveTourId',authenticateToken,(req,res)=>{
  bogBridge.RemoveTourId(req.body).then(result=>{
    if(result===500) res.sendStatus(result);
    else res.send(result);
  });
})

app.post('/IncreaseDatabase',authenticateToken,(req,res)=>{
  bogBridge.IncreaseDatabase(req.body).then(result=>{
    if(result===500) res.sendStatus(result);
    else res.send(result);
  });
})

app.post('/RequestToken',(req,res)=>{
  bogBridge.RequestToken(req.body).then(result=>{
    if(result===500) res.sendStatus(result);
    else res.send(result);
  });
})

app.post('/RequestTokenSecond',(req,res)=>{
  bogBridge.RequestTokenSecond(req.body).then(result=>{
    if(result===500) res.sendStatus(result);
    else res.send(result);
  });
})

var whitelist = ['http://localhost']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

app.listen(port, () => {
    console.log("server start")
})