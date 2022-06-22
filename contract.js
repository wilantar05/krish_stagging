require('dotenv').config()
const fs = require('fs');

const Web3 = require('web3')
const web3 = new Web3 ('https://speedy-nodes-nyc.moralis.io/9fa4c68e1bc6c0e832bf5952/bsc/testnet');//('wss://speedy-nodes-nyc.moralis.io/0193ab1846cf990388be9469/bsc/testnet/ws');

web3.eth.accounts.wallet.add({
	privateKey: process.env.privateKey,
	address: process.env.address
});

let contractTokenData = JSON.parse(fs.readFileSync('contractToken.json'));
var contractToken = new web3.eth.Contract(contractTokenData.abiContract,contractTokenData.addressContract);

let contractTokenDataSecond = JSON.parse(fs.readFileSync('contractTokenSecond.json'));
var contractTokenSecond = new web3.eth.Contract(contractTokenDataSecond.abiContract,contractTokenDataSecond.addressContract);

module.exports = {
    "web3": web3,
    "contractToken": contractToken,
    "contractTokenSecond": contractTokenSecond
}