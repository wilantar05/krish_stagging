const {MongoClient} = require('mongodb');

var qs = require('qs');
var axios = require('axios');
const res = require('express/lib/response');
var ObjectId = require('mongodb').ObjectId;

const url = 'mongodb+srv://BOG:Mongodb.com@cluster0.hdhwd.mongodb.net/test';
const client = new MongoClient(url);
const dbName = 'BOG';

const express = require('express');
const app = express();
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());

var db;
var tourCol;
var tourListCol;
var matchCol;
var lastLoginCol;
var counter;

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');

const serviceAccount = require('../serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const firebase = getFirestore();

async function main(){
    await client.connect();
    console.log('Connected succesfully to server');
    db = client.db(dbName);
    tourCol = db.collection('TourData');
    matchCol = db.collection('MatchData');
    tourListCol = db.collection('TourListData');
    lastLoginCol = db.collection('LastLogin');
    tourCounter = db.collection('CounterTour');
    matchCounter = db.collection('CounterMatch');
    //counters = db.collection('counters');

    return 'done.';
}

main()
    .then(console.log)
    .catch(console.error);

var cors = require('cors')
const InputDataDecoder = require('ethereum-input-data-decoder');
const appWeb3 = require('../contract');

async function IncreaseDatabase(req){
    var error;
    try{
        const intoFirebase = await firebase.collection('Players').doc(req.playerId).get();
        
        if(intoFirebase.exists){
            await firebase.collection('Players').doc(req.playerId).update({
                'tokenVirtual' : FieldValue.increment(req.amount),
                'tokenVirtualSecond' : FieldValue.increment(req.amountSecond),
            });
        }
    }catch(err){
        error = err;
    }

    return new Promise((resolve, reject) => {
        if(error) resolve(500);
        else resolve(200);
    })
}

async function RequestToken(req){
    var error;
    
    try{
        const intoFirebase = await firebase.collection('Players').doc(req.playerId).get();

        if(intoFirebase.exists && intoFirebase.data().tokenVirtual){
            if(intoFirebase.data().tokenVirtual >= req.amount && intoFirebase.data().tokenVirtualSecond >= req.amountSecond){
                var data = {
                    wallet : intoFirebase.data().walletAddress,
                    amount : req.amount
                }
                
                await sendToken(data);

                await firebase.collection('Players').doc(req.playerId).update({
                    'tokenVirtual' : FieldValue.increment(req.amount*-1)
                });
            }
        }
    }catch(err){
        error = err;

        console.log(error);
    }

    return new Promise((resolve, reject) => {
        if(error) resolve(500);
        else resolve(200);
    })
}

async function RequestTokenSecond(req){
    var error;
    
    try{
        const intoFirebase = await firebase.collection('Players').doc(req.playerId).get();

        if(intoFirebase.exists && intoFirebase.data().tokenVirtual){
            if(intoFirebase.data().tokenVirtualSecond >= req.amountSecond){
                var data = {
                    wallet : intoFirebase.data().walletAddress,
                    amountSecond : req.amountSecond
                }
                
                await sendToken(data);

                await firebase.collection('Players').doc(req.playerId).update({
                    'tokenVirtualSecond' : FieldValue.increment(req.amountSecond*-1),
                });
            }
        }
    }catch(err){
        error = err;

        console.log(error);
    }

    return new Promise((resolve, reject) => {
        if(error) resolve(500);
        else resolve(200);
    })
}

async function sendToken(req){
    
    var wallet = req.wallet;
    var amount = req.amount;

    var error;
    var result;
    try{
        if(req.amount>0){
            const decimals = await appWeb3.contractToken.methods.decimals().call();
            var a= Math.pow(10, decimals)* amount;
            result =  await appWeb3.contractToken.methods.transfer(wallet, String(a)).send({
                from: appWeb3.web3.eth.accounts.wallet[0].address,
                value: 0,
                gas: '1000000'})
        }
    }catch(err){
        error = err;
        console.log("sendToken", error);
    }
	
    return new Promise((resolve, reject) => {
        if(error) resolve(500);
        else resolve(result);
    })  
}

async function sendSecondToken(req){
    
    var error;
    var result;
    try{
        if(req.amountSecond>0){
            const decimals = await appWeb3.contractTokenSecond.methods.decimals().call();
            var a= Math.pow(10, decimals)* req.amountSecond;
            result = await appWeb3.contractTokenSecond.methods.transfer(req.wallet, String(a)).send({
                from: appWeb3.web3.eth.accounts.wallet[0].address,
                value: 0,
                gas: '1000000'}).then(console.log);
        }
    }catch(err){
        error = err;
        console.log("sendToken", error);
    }

    return new Promise((resolve, reject) => {
        if(error) resolve(500);
        else resolve(result);
    })  
}

async function getTransaction(hash){

var res = await appWeb3.web3.eth.getTransaction(hash);

    const abi = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[{"internalType":"uint256","name":"tourId","type":"uint256"},{"internalType":"string","name":"playerId","type":"string"},{"internalType":"uint256","name":"char","type":"uint256"},{"internalType":"address","name":"master","type":"address"},{"internalType":"uint256","name":"championshipPoint","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"},{"internalType":"uint256","name":"amount2","type":"uint256"}],"name":"joinRoom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}];
    const decoder = new InputDataDecoder(abi); 
    
    const result = decoder.decodeData(res.input);

    //console.log(res);

    var receipt = {
        'tourId' : JSON.parse(result.inputs[0]),
        'playerId' : result.inputs[1],
        'char' : JSON.parse(result.inputs[2]),
        'walletAddress' : res.from,
        'championshipPoint' : JSON.parse(result.inputs[4]),
        'token' : JSON.parse(result.inputs[5]),
        'secondToken' : JSON.parse(result.inputs[6]),
    };

    //console.log(receipt);
    return receipt;
}


async function checkJoinRoom(hash, res){
    var receipt = await getTransaction(hash);

    var data = qs.stringify({
        'tourId': receipt.tourId,
        'playerId': receipt.playerId,
        'char': receipt.char,
        'walletAddress': receipt.walletAddress,
        'championshipPoint': receipt.championshipPoint
    });

    console.log(data);

    var config = {
        method: 'post',
        url: 'https://bog-test.miracledev.net/JoinTournament.php',
        headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'
        },
        data : data
    };

    axios(config)
    .then(function (response) {
        if(response.data !== "SUCCESS") refund(res, response.data, receipt);
        else res.json(response.data);
        //console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
        //res.json(error);
        refund(res, error, receipt);
        //console.log(error);
    });
}
  
async function refund(res, errorData, receipt){
    console.log("refund:", receipt);

    var req = {
        "wallet" : receipt.walletAddress,
        "amount" : receipt.amount,
        "amountSecond" : receipt.amountSecond
    };

    await sendToken(req);
    await sendSecondToken(req);

    res.json(errorData);
}


async function CreateTournament(req, res){
var sucess;
var error;

//console.log("CreateTournament");

try{


    const max = Number(req.maxPlayers);
 
    var matchData = {
        isStarted: 0,
        arena: Number(req.arena),
        maxPlayers: max,
        roundWins: new Array(max),
       
        playersId: new Array(max),
        walletAddress: new Array(max),
        matchId: new Array(max),
        characters: new Array(max),
        results: new Array(max)
    }

matchData['playersId'][0] = req.playerId;
matchData['walletAddress'][0] = req.walletAddress;


var newData={
    price: Number(req.price),
    priceSecond: Number(req.priceSecond),
    lastUpdate: Date.now(),
    championshipPoint: new Array(max),
    createdTime: Date.now(),
    havePay: new Array(max),
    rounds: Number(req.rounds),
    time: Number(req.time),
    victorySettings: Number(req.victorySetting),
    characterSelect: Number(req.charSelect),
    hardwareSetting: Number(req.hwSetting),
    privateSlots: Number(req.privateSlots),
    password: req.password,
    comment: req.comment,
    characters: new Array(max),
    arena: Number(req.arena),
    avatarId: new Array(max),
    mostUsedChar: new Array(max),
    countryId: new Array(max),
    data: [matchData]
}

newData['championshipPoint'][0] = Number(req.championshipPoint);
newData['havePay'][0] = 1;
newData['avatarId'][0]= Number(req.avatarId);
newData['mostUsedChar'][0] = Number(req.mostUsedChar);
newData['countryId'][0] = Number(req.countryId);



const insertResult = await tourCol.insertOne(newData, function(err){
    if (err) return;
    sucess = newData._id.toString();
});

//console.log(objectId);

var tourId = newData._id.toString();
var n = await tourCol.countDocuments();

tourListCol.updateOne({_id:1},{$set:{lastTourId:tourId,tourListCount:n}});
const intoFirebase = await firebase.collection('Players').doc(req.playerId).update({lastTournamentId:tourId});

}catch(err){
    console.log("Error CreateTournament: "+err);
    error = err;
}

return new Promise((resolve,reject)=>{
    if(error) resolve(500);
    else resolve(sucess);
})
//ContohData
//{"maxPlayers":"4","arena":"0","playerId":"Windmelon","walletAddress":"windmelon","price":"4","championshipPoint":"66","rounds":"3","time":"99","victorySetting":"0","charSelect":"0","hwSetting":"0","privateSlots":"0","password":"","comment":""}

}

async function JoinTournament(req,res){

    var sucess;
    var error;

    try{
        const tourId = ObjectId(req._id);
        const playerId = req.playerId;
        const walletId = req.walletAddress;
        const championshipPoint = req.championshipPoint;
        const avatarId = Number(req.avatarId);
        const mostUsedChar = Number(req.mostUsedChar);
        const countryId = Number(req.countryId);

        var tourData = await tourCol.findOne({_id:tourId});

        var isExist = tourData.data[0].playersId.indexOf(playerId);

        if(isExist!=-1){
            tourData.lastUpdate = Date.now();
            await tourCol.replaceOne({_id:tourId},tourData, function(err,yes){
            if(err) throw err;
            firebase.collection('Players').doc(playerId).update({lastTournamentId:tourId.toString()});
            });
            sucess = "SUCCESS";
            
        }else{
            var getNull = tourData.data[0].playersId.indexOf(null);

            if(getNull!=-1){
                tourData.data[0].playersId[getNull] = playerId;
                tourData.data[0].walletAddress[getNull] = walletId;
                tourData.havePay[getNull] = 1;
                tourData.avatarId[getNull]= avatarId;
                tourData.mostUsedChar[getNull] = mostUsedChar;
                tourData.championshipPoint[getNull] = Number(championshipPoint);
                tourData.countryId[getNull] = countryId;
                tourData.lastUpdate = Date.now();

                await tourCol.replaceOne({_id:tourId},tourData, function(err,yes){
                    if(err) throw err;
                firebase.collection('Players').doc(playerId).update({lastTournamentId:tourId.toString()});
                });
                sucess = "SUCCESS";
            }else{
                sucess="PENUH";
            }
        }

        

    } catch(err){
        console.log("Error JoinTournament: "+err);
        error = err;
    }

    return new Promise((resolve,reject)=>{
        if (error) resolve(500);
        else resolve(sucess);
    })
    

//ContohData
//{"playerId":"watermelon","walletAddress":"watermelon","championshipPoint":"66","_id":"6267ab494b71f2d443abb3c2"}
}

async function GetTournamentData(req,res,data){

   
    

    var error;
    var success;

    try{
        
    var tourId;
    if(typeof data == 'undefined') tourId = ObjectId(req._id);
    else tourId = ObjectId(data.id);
        var tourData = await tourCol.findOne({_id:tourId});

        jsonResult = JSON.stringify(tourData);

        success = jsonResult;
        //console.log(jsonResult);
    }catch(err){
        console.log("Error GetTournamentData: "+err);

        error = err;
    }

    return new Promise((resolve,reject)=>{
        if(error) resolve(500);
        else resolve(success);
    });    

//{"_id":"6267abc6626309bef9ba254e"}
}


async function ReceiveTournamentList(req,res){

    return new Promise((resolve,reject)=>{
        var startIndex = Number(req.startIndex);
        var count = Number(req.count);
        var maxPlayer = Number(req.maxPlayer);
        var ids="";
        var query = {"data.maxPlayers":maxPlayer};
        tourCol.find(query).toArray(function(err,resp){
            if(err) throw err;
            
            var result = resp;

            for(let i = startIndex;i<result.length;i++){
             //console.log(result[i]._id+",");
                ids += result[i]._id.toString()+",";
                 
            }
            resolve(ids);
        });

        
    });
        

//ContohData
//{"startIndex":"0","count":"5","maxPlayer":"4"}
}

async function CheckUpdateTournamentList(){
    var sucess;
    var error;
try{
   var result =  await tourListCol.findOne({_id:1});
   
   sucess = result.tourListCount.toString();

}catch(err){
    error = err;
}
    return new Promise((resolve,reject)=>{
        if(error) resolve(500);
        else resolve(sucess);
    });
}

async function CheckUpdateTournament(req,res){

    var sucess;
    var error;

    try{
        var tourId = ObjectId(req._id);

        var tourData = await tourCol.findOne({_id:tourId});

           sucess = tourData.lastUpdate.toString();


        


    }catch(err){
        console.log("Error CheckUpdateTournament: "+err);
        sucess = "0";
        //error = err;
    }

    return new Promise((resolve,reject)=>{
        if(error) resolve(500);
        else resolve(sucess);
    })
    

//ContohData
//{"_id":"6267abc6626309bef9ba254e"}
}

async function CheckUpdateTournamentV2(req,res){
    var sucess;
    var error;

    try{
        var ids = req._id;
        var tourId = ids.split(",");
        var lastUpdates = "";
        for(let i =0;i<tourId.length;i++){
            var tourData = await tourCol.findOne({_id:ObjectId(tourId[i])});
            if(i+1==tourId.length){
                lastUpdates += tourData.lastUpdate;
            }else{
                lastUpdates += tourData.lastUpdate+",";
            }
        
        }

        sucess = lastUpdates;
    }catch (err){
        console.log("Error CheckUpdateTournamentV2: "+err);
        error = err;
    }
    
    return new Promise((resolve,reject)=>{
        if(error) resolve(500);
        else resolve(sucess);
    })
    //console.log(lastUpdates);

//ContohData
//{"_id":"6267a884ee905762f76b3a85,6267ab11eda1eb7e3ae629da,6267ab494b71f2d443abb3c2"}
}

async function StartTournament(req,res,data){
    //console.log("StartTournament Kepanggil");

    var sucess;
    var error;

    try{
        var tourId;
        var index;

        if(typeof data == 'undefined'){
            tourId = ObjectId(req._id);
            index = 0;
        }else{
            tourId = ObjectId(data._id);
            index = Number(data.newIndex);
            //console.log("Id : "+tourId+" | Index : "+index);
        }
    
        var tourData = await tourCol.findOne({_id:tourId});

        if(typeof tourData.havePay!=='undefined'){
            const payList = tourData.havePay;

            delete tourData.havePay;
            tourData = await AssignMatch(tourData, index);


        }else{
            tourData = await AssignMatch(tourData,index);
        }
            sucess = JSON.stringify(tourData);
            await tourCol.replaceOne({_id:tourData._id},tourData);
    }catch (err){
        console.log("Error StartTournament: "+err);
        error = err;
    }
    
    return new Promise((resolve,reject)=>{
        if(error) resolve(500);
        else resolve(sucess);
    })

    //ContohData
//{"_id":"6267ab494b71f2d443abb3c2"}
}

async function AssignMatch(tourData,index){
    //console.log("AssignMatch Kepanggil");
    var sucess;
    var error;
    try{

        var maxPlayers = Number(tourData.data[index].maxPlayers);
        var tourId = tourData._id.toString();

        var matchData = {
            tourId:tourId,
            isStarted:1,
            playersId: new Array(2),
            characters: new Array(2),
            walletAddress: new Array(2),
            results: new Array(2),
            arena: 0,
            roundWins: new Array(2)
        }



        for(var i=0;i<maxPlayers/2;i++){
            await matchCol.insertOne(matchData);
            matchId = matchData._id.toString();
        
        //console.log(matchData);

            for(var j = 0;j<2;j++){

                var getNull = tourData.data[index].matchId.indexOf(null);
            
                if(getNull!==-1){

                    tourData.data[index].matchId[getNull] = matchId;
                    matchData.playersId[j] = tourData.data[index].playersId[getNull];
                    matchData.walletAddress[j] = tourData.data[index].walletAddress[getNull];
                    matchData.characters[j] = tourData.characters[getNull];
                    tourData.data[index].results[getNull] = 0;
                    
                    matchData.tourDataId = index;
                    await matchCol.replaceOne({_id:matchData._id},matchData);
                }
            }
            delete matchData._id;
        }
        //await matchCol.insertOne(matchData);
        tourData.data[index].isStarted=1;
        tourData.lastUpdate = Date.now(); 
        sucess = tourData;
    }catch(err){
        console.log("Error AssignMatch: "+err);
        error = err;
    }
    console.log("Assign Match Selesai")
    if(error) return error;
    else return sucess;
    //await tourCol.replaceOne({_id:tourData._id},tourData);

}

async function ReceiveMatchResult(req, res, internalLastMatchTime){
    var sucess;
    var error;

    try {
        //console.log("raw: "+req.State);
        //var isRecheckingLastMatch = internalLastMatchTime != null;
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        console.log("[ReceiveMatchResult 0] RawDataReceived", JSON.stringify(req));
        var mr = JSON.parse(req.State.DebugInfo.DEBUG_PROPERTIES_18.MR);
        console.log("MathResult: "+mr);
        
        if (mr._id !== '' && mr._id !== null) {
            var matchResult = mr;
            matchResult._id = ObjectId(matchResult._id);
            var matchData = await matchCol.findOne({ _id: matchResult._id });
            //var matchDataB = await matchCol.findOne({ _id: req._id });
            console.log("[ReceiveMatchResult 0 test A] matchResult ", matchResult);
            //console.log("[ReceiveMatchResult 0 test A] matchData ", matchData);
            //console.log("[ReceiveMatchResult 0 test A+] matchDataB ", matchDataB);
            var matchId = matchResult._id;
        } else {
            var matchResult = mr;
            delete matchResult._id;
            var matchId = -1; ///agar ada aja variablenya
            console.log("[ReceiveMatchResult 0 test B] matchResult ", matchResult);
        }

        var curTime = Date.now();
        matchResult.lastUpdate = curTime;
        var timeStamp = curTime;

        if (matchData != null) {
            await matchCol.replaceOne({ _id: matchId }, matchResult);
            //console.log("[ReceiveMatchResult 0 test C] matchResult ", matchResult);
        } else {
            await matchCol.insertOne(matchResult);
            //console.log("[ReceiveMatchResult 0 test D] matchResult", matchResult);
            var matchId = matchResult._id;

            sucess = matchId.toString();

            //res.send(sucess);

            // return new Promise((resolve,reject)=>{
            //     if(error) resolve(500);
            //     else resolve(sucess);
            // });
        }

        //matchResult = await matchCol.findOne({_id:matchResult._id});
        matchResult = await matchCol.findOne({ _id: matchId});

    
        if(matchResult.hasEnded==false){
            //console.log("[ReceiveMatchResult 1a] Nunggu");
            await delay(6000);
            //await new Promise(resolve=>setTimeout(resolve,6000));
        }else{
            //console.log("[ReceiveMatchResult 1b] Disini");
                EndMatch(matchResult);
        }

        //console.log("[ReceiveMatchResult 2] lastUpdate: "+matchResult.lastUpdate+ " TimeStamp: "+timeStamp);
        //console.log("[ReceiveMatchResult 3] Same ? "+matchResult==timeStamp);
        matchResult = await matchCol.findOne({_id: matchId});

        if(matchResult.hasEnded==true) {
            //console.log("[ReceiveMatchResult 4 END] MatchDahSlese");
            return;
        }else{
            if(matchResult.lastUpdate!=timeStamp){
                //console.log("[ReceiveMatchResult 4] Masih ada Update");
                return;
            }
            else{
                 //console.log("Harusnya dihapus");
                 //if(matchResult.roundWins[0]==0 && matchResult.roundWins[0]==0 && matchResult.lastHp[0]==1000 && matchResult.lastHp[1]==1000){
                 //    matchCol.deleteOne({_id:ObjectId(matchResult._id)});
                 //}else{
                var thisTime = Date.now();
                //if (!isRecheckingLastMatch) internalLastMatchTime = matchResult.lastUpdate; ///Kalau Null berarti dari client. internalLastMatchTime adalah matchResult.lastUpdate yg akan di recheck
                console.log("[ReceiveMatchResult END] Time Diffs(" + (thisTime - internalLastMatchTime) + ")");
                if ((thisTime - internalLastMatchTime) < 30000) { ///Jika kurang dari 15 detik, wait 8 detik > check lagi
                    await delay(8000);
                    ReceiveMatchResult(req, res, internalLastMatchTime);
                } else {
                    matchResult.hasEnded = true;
                    await matchCol.replaceOne({ _id: matchId }, matchResult);
                    EndMatch(matchResult);
                }
                 //}
                //console.log("[ReceiveMatchResult END] EndMatch FORCED");
             }
        }
    
        //console.log(sucess);
    } catch(err){
        console.log("Error ReceiveMatchResult: "+err);
        error = err;
    }
    

//ContohData
//{"data":"{\"playersId\":[\"Windmelon\",\"watermelon\"],\"walletAddress\":[\"windmelon\",\"watermelon\"],\"_id\":\"6267ba2dc3563530245020cb\",\"tourId\":\"6267ab494b71f2d443abb3c2\",\"tourDataId\":0,\"price\":0,\"roundWins\":[0,0],\"lastHp\":[1000,1000],\"characters\":[16,26],\"results\":[0,0],\"hasEnded\":false,\"lastUpdate\":1649065598}"}
}

async function EndMatch(data){
    console.log("EndMatch Kepanggil");
    var sucess;
    var error;

    try{
        var matchData = data;
        var reward = matchData.price * 2;
        if(matchData.hasEnded==true){
        if(matchData.roundWins[0]>matchData.roundWins[1]||matchData.lastHp[0]>matchData.lastHp[1]){
            console.log("EndMatch 1.1 - If");
            var winnerId = matchData.playersId[0];
            var loserId = matchData.playersId[1];

            var winnerWallet = matchData.walletAddress[0];
            var loserWallet = matchData.walletAddress[1];
            
            matchData.results[0] = 1;
            matchData.results[1] = 2;
        }else{
            if((matchData.roundWins[0]==0 && matchData.roundWins[1]==0) && ( matchData.lastHp[0]==1000 && matchData.lastHp[1]==1000)){
                if(matchData.tourId=="") await matchCol.deleteOne({_id:ObjectId(matchData._id)});
                console.log("EndMatch 1.2.1 - Return");
                return;
            }
            console.log("EndMatch 1.2 - Else");
            var winnerId = matchData.playersId[1];
            var loserId = matchData.playersId[0];
            
            var winnerWallet = matchData.walletAddress[1];
            var loserWallet = matchData.walletAddress[0];
            
            matchData.results[1] = 1;
            matchData.results[0] = 2;
        }
    }else{
        console.log("EndMatch 2 - Else");
        if(matchData.roundWins[0]==matchData.roundWins[1]==0&&matchData.lastHp[0]==matchData.lastHp[1]==1000){
            if(matchData.tourId=="") await matchCol.deleteOne({_id:ObjectId(matchData._id)});
            return;
        }
    }

    if(matchData.tourId!==""){
        //Championship

        var value = 0;

        switch(matchData.tourDataId){
            case 0:
                value = 3;
            break;
            case 1:
                value = 9;            
            break;
            case 2:
                value = 18;
            break;
            case 3:
                value = 30;
            break;
            case 4:
                value = 45;                
            break;
            
        }

        await firebase.collection('Players').doc(winnerId).update({
            'tournament.point' : FieldValue.increment(value),
            'tournament.wins' : FieldValue.increment(1),
            'tournament.games' : FieldValue.increment(1),
            'global.point' : FieldValue.increment(1),
            'global.wins' : FieldValue.increment(1),
            'global.games' : FieldValue.increment(1)
        })

        await firebase.collection('Players').doc(loserId).update({

            'tournament.games' : FieldValue.increment(1),

            'global.games' : FieldValue.increment(1),

            lastTournamentId : ""
        })

        await matchCol.replaceOne({_id:matchData._id},matchData);
        
        var checkData = {
            tourId:matchData.tourId,
            index:matchData.tourDataId,
            winner: winnerId
        }
        //ManggilCheckTournament
        await CheckTournament(checkData,matchData);
        matchData._id = matchData._id.toString(); 
        await firebase.collection('MatchHistory').doc(matchData._id).set(matchData);

        await matchCol.deleteOne({_id:ObjectId(matchData._id)});
    }else{
        //PVP

        await firebase.collection('Players').doc(winnerId).update({
            'pvp.point' : FieldValue.increment(1),
            'pvp.wins' : FieldValue.increment(1),
            'pvp.games' : FieldValue.increment(1),
            'global.point' : FieldValue.increment(1),
            'global.wins' : FieldValue.increment(1),
            'global.games' : FieldValue.increment(1)
        })

        await firebase.collection('Players').doc(loserId).update({

            'pvp.games' : FieldValue.increment(1),

            'global.games' : FieldValue.increment(1),


        })

        await matchCol.replaceOne({_id:matchData._id},matchData);
        var index = matchData.tourDataId;
        var matchId = matchData._id;
        matchData._id = matchData._id.toString(); 
        await firebase.collection('MatchHistory').doc(matchData._id).set(matchData);

        await matchCol.deleteOne({_id:ObjectId(matchData._id)});

        console.log(winnerId, loserId, winnerWallet, loserWallet);

        var req = {
            "wallet" : winnerWallet, //receipt.winnerWallet,
            "amount" : 0,
            "amountSecond" : 20 
        };

        //await sendToken(req);
        IncreaseDatabase(req);

        req = {
            "wallet" : loserWallet, //receipt.winnerWallet,
            "amount" : 0,
            "amountSecond" : 10 
        };

        //await sendToken(req);
        IncreaseDatabase(req);
    }
    }catch (err){
        console.log("Error EndMatch: "+err);
        error = err;
    }
    
}

async function CheckTournament(data, matchData){
    console.log("CheckTournament Kepanggil");
    try{
    var tourId = ObjectId(data.tourId);
    var index = data.index;
    var tourData = await tourCol.findOne({_id:tourId});

    if(index!==0){
        if(tourData.data[index].playersId.indexOf(null)!==-1){
        index = index-1;
        }
    }

    var playersId = tourData.data[index].playersId;
    var getIndex = playersId.indexOf(data.winner);

    if(getIndex!==-1){
        if(getIndex%2==0){
            var playerIndex= [getIndex, getIndex+1];
            var pIndex = getIndex/2;

        }else{
            var playerIndex = [getIndex-1, getIndex];
            var pIndex = (getIndex-1)/2;
        } 


        tourData.data[index].results[playerIndex[0]] = matchData.results[0];
        tourData.data[index].results[playerIndex[1]] = matchData.results[1];
        tourData.data[index].roundWins[playerIndex[0]] = matchData.roundWins[0];
        tourData.data[index].roundWins[playerIndex[1]] = matchData.roundWins[1]; 

        if(typeof tourData.data[index+1] !== 'undefined'){
            console.log("Di If Atas");
            var nullIndex = tourData.data[index+1].playersId.indexOf(null);
            console.log(nullIndex);
            if(nullIndex!==-1){
                tourData.data[index+1].playersId[nullIndex] = data.winner;
                tourData.data[index+1].characters[nullIndex] = tourData.characters[getIndex];
                tourData.data[index+1].walletAddress[nullIndex] = tourData.data[index].walletAddress[getIndex];

                if(tourData.data[index+1].playersId.indexOf(null)===-1){
                    
                    var newData = {
                        _id:tourData._id,
                        newIndex:index+1
                    }
                    
    
                    await tourCol.replaceOne({_id:tourData._id},tourData);
                    startData = await StartTournament(null,null, newData);
                    tourData = JSON.parse(startData);
                    tourData._id = ObjectId(tourData._id);
                }
            }
        }else{
            console.log("Di Else");
            if(tourData.data[index].playersId.length>2){
                tourData = await NewTourData(tourData,index,pIndex,data.winner);
            }else{
                var obj = {
                    playersId:new Array(1).fill(data.winner)
                    };

                tourData.data.push(obj);
                //tourData.data[index+1].playersId[0] = data.winner;
                var playerIndex = new Array();
                var isEnd = true;
                console.log("End");
            }
        }
        tourData.lastUpdate = Date.now();
        await tourCol.replaceOne({_id:tourData._id},tourData);
        //console.log(JSON.stringify(tourData));
        if(isEnd){
            await EndTournament(tourData._id);
        }
    }else{
        console.log("Kosong");
    }
    
    }catch(err){
        console.log("Error CheckTournament: "+err);
    }
   
}

async function NewTourData(tourData, index, pIndex, winnerId){
    console.log("NewTourData Kepanggil");
    try{
        var newMaxPlayers = Number(tourData.data[index].maxPlayers)/2;
        var newData={
        isStarted:0,
        arena:Number(0),
        maxPlayers:newMaxPlayers,
        playersId: new Array(newMaxPlayers),
        walletAddress: new Array(newMaxPlayers),
        matchId: new Array(newMaxPlayers),
        characters: new Array(newMaxPlayers),
        results: new Array(newMaxPlayers),
        roundWins: new Array(newMaxPlayers)
    };

    var oldIndex = tourData.data[index].playersId.indexOf(winnerId);
    newData.playersId[pIndex] = winnerId;
    newData.walletAddress[pIndex] = tourData.data[index].walletAddress[oldIndex];
    newData.characters[pIndex] = tourData.data[index].characters[oldIndex];


    tourData.data.push(newData);
    

    return tourData;
}catch(err){
    console.log("Error NewTourData: "+err);
}
    
    
}

async function EndTournament(tourId){
    console.log("EndTournament Kepanggil");
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    try{
        var tourData = await tourCol.findOne({_id:ObjectId(tourId)});
    await tourListCol.updateOne({_id:1},{$inc:{tourListCount:-1}});

    var playerList = tourData.data[0].playersId;
    //console.log("PlayerList: "+JSON.stringify(playerList));

    for(var i=0;i<playerList.length;i++){
       firebase.collection('Players').doc(playerList[i]).update({
            TournamentHistory:FieldValue.arrayUnion(tourData._id.toString()),
            lastTournamentId:""
            });
    }
    var index = Number(tourData.data.length)-2;
    const pos1 = tourData.data[index].results.indexOf(1);
    const pos2 = tourData.data[index].results.indexOf(2);
    const pos3 = new Array();

    for(var n=0;n<tourData.data[index-1].results.length;n++){
        if(tourData.data[index-1].results[n]==2){
            pos3.push(n);
        }
    }

    var winnerList = new Array();

    winnerList[0] = playerList.indexOf(tourData.data[index].playersId[pos1]);
    winnerList[1] = playerList.indexOf(tourData.data[index].playersId[pos2]);
    winnerList[2] = playerList.indexOf(tourData.data[index-1].playersId[pos3[0]]);
    winnerList[3] = playerList.indexOf(tourData.data[index-1].playersId[pos3[1]]);

    var winnerAdd = [];
    winnerAdd.push(playerList.indexOf(tourData.data[index].walletAddress[pos1]));
    winnerAdd.push(playerList.indexOf(tourData.data[index].walletAddress[pos2]));
    winnerAdd.push(playerList.indexOf(tourData.data[index-1].walletAddress[pos3[0]]));
    winnerAdd.push(playerList.indexOf(tourData.data[index-1].walletAddress[pos3[1]]));

    var obj={
        reward : new Array(tourData.data[0].maxPlayers).fill(0)
    }


    tourData.reward = new Array(tourData.data[0].maxPlayers).fill(0);

    var rewardList = new Array();
    const pool = tourData.price * tourData.data[0].maxPlayers;
    rewardList[0] = pool*0.5;
    rewardList[1] = pool*0.25;
    rewardList[2] = pool*0.075;
    rewardList[3] = pool*0.075;

    for(var i =0; i<rewardList.length; i++){
        var req = {
            "wallet" : winnerAdd[i], //receipt.winnerWallet,
            "amount" : rewardList[i],
            "amountSecond" : rewardList[i]
        };

        //await sendToken(req);
        IncreaseDatabase(req);
    }

    for(let r = 0;r<winnerList.length;r++){
        tourData.reward[winnerList[r]] = rewardList[r];
    }
    await tourCol.replaceOne({_id:tourData._id},tourData);
    //duplicate tourData > remove lastUpdate > upload ke Firestore
    var tourDataDup = tourData;
    delete tourDataDup.lastUpdate;
    tourDataDup._id = tourData._id.toString();
    await firebase.collection('TournamentHistory').doc(tourData._id).set(tourDataDup);

    //wait 20 sec > deleta data asli
    await delay(10000)
    await tourCol.deleteOne({_id:ObjectId(tourData._id)});
}catch(err){
    console.log("Error EndTournament: "+err);
}

}

async function UpdateCharacter(req,res){
    try{
        console.log(req);
    const tourId = ObjectId(req._id);
    var p1 = req.p1Id;
    var p2 = req.p2Id;
    var char1 = Number(req.char1);
    var char2 = Number(req.char2);

    var tourData = await tourCol.findOne({_id:tourId});

    var p1Index = tourData.data[0].playersId.indexOf(p1);
    var p2Index = tourData.data[0].playersId.indexOf(p2);

    tourData.characters[p1Index] = char1;
    tourData.characters[p2Index] = char2;
    tourData.data[0].characters[p1Index] = char1;
    tourData.data[0].characters[p2Index] = char2;
    tourData = await tourCol.replaceOne({_id:tourId},tourData);
}catch(err){
    console.log("Error UpdateCharacter: "+err);
}
    
}

async function LastLoginChecker(req,res){
    var sucess;
    var error;
    try{
        var loginData = await lastLoginCol.findOne({id:req.username});
        sucess = loginData.lastLogin;
    }catch(err){
        error = err;
        console.log("Error LastLogin: "+err);
    }

   return new Promise((resolve,reject)=>{
        if(error) resolve(500);
        else resolve(sucess);
    })
}

async function LastLogin(req,res){
    var sucess;
    var error;

    try{
        var username = req.username;
        var timeStamp = req.localTimeStamp;
       
        var loginData = await lastLoginCol.findOne({id:username});

        if(loginData==null){
            
            var newData={
                id:username,
                lastLogin:timeStamp
            };

            await lastLoginCol.insertOne(newData);
        }else{
            
            await lastLoginCol.updateOne({id:username},{$set:{lastLogin:timeStamp}});
        }
    }catch(err){
        console.log("Error lastLogin: "+err);
    }


}

async function RemoveTourId(req,res){
    try{
        await firebase.collection('Players').doc(req.playerId).update({lastTournamentId:""});
    }catch(err){
        console.log("Error RemoveTourId: "+err);
    }
}

async function TestCode(req,res){
    
var success;
var error;
    //  const array = new Array();
    //  const items = [1,2,1,2];

    //  for(let i=0;i<items.length;i++){
    //     if(items[i]==2){
    //         array.push(i);
    //     }
    //  }

    // console.log(array);

    try{
        var data={
            ResultCode: 0,
            Message: "OK"
        };

        console.log(JSON.stringify(data));
        success = JSON.stringify(data);
    }catch(err){
        console.log("Error: "+err);
        error = err;
    }

    return new Promise((resolve,reject)=>{
        if(error) resolve(500);
        else resolve(success);
    })
    // console.log("Testing");
    // var error = false;
    // return new Promise((resolve,reject)=>{
    //     if(error) resolve(500);
    //     else resolve("Sucess");
    // })
}

async function UnStartTournament(req,res){
    var success;
    var error;
    try{
        var tourId = req._id;
        var tourData = await tourCol.findOne({_id:ObjectId(tourId)});
    
        
        for(let i=0;i<tourData.data[0].maxPlayers;i+=2){
            await matchCol.deleteOne({_id:ObjectId(tourData.data[0].matchId[i])});
            tourData.data[0].matchId[i] = null;
            tourData.data[0].matchId[i+1] = null;
            console.log("i = "+i);
        }
        console.log("tourId = "+tourData._id);
        tourData.data[0].isStarted = 0;
        await tourCol.replaceOne({_id:ObjectId(tourData._id)},tourData);
        success="Success";
    }catch(err){
        console.log(err);
        success = err;
    }
    return new Promise((resolve,reject)=>{
        if(error) resolve(500);
        else resolve(success);
    })
}

async function CleanCollection(){
    var success;
    var error;

    try{
        //var matchData = await matchCol.findOne({_id:ObjectId(req._id)});
        var minus = Date.now()- 43200000 ;
        // var dateTime = Number(minus) - Number(matchData.lastUpdate);
        // var days = (dateTime)/(1000*60*60*12);
        var days = new Date(minus).toString();
        console.log("Hari: "+days);
        success = "Hore";

        await matchCol.deleteMany({$or: [{lastUpdate:{$lt: minus}},{hasEnded: true}]});
    }catch(err){
        error = err;
        console.log("Error: "+error);
    }

    return new Promise((resolve,reject)=>{
        if(error) resolve(500);
        else resolve(success);
    })
}


module.exports = { 
    sendToken,
    sendSecondToken,
    checkJoinRoom,
    refund,
    getTransaction,
    CreateTournament,
    GetTournamentData,
    JoinTournament,
    ReceiveTournamentList,
    CheckUpdateTournamentList,
    CheckUpdateTournament,
    CheckUpdateTournamentV2,
    StartTournament,
    ReceiveMatchResult,
    UpdateCharacter,
    LastLoginChecker,
    LastLogin,
    RemoveTourId,
    TestCode,
    UnStartTournament,
    IncreaseDatabase,
    RequestToken,
    RequestTokenSecond,
    CleanCollection
};
