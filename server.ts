// ExpressJS
const express = require('express');
const bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth')
import * as path from 'path';

import { Car } from './car';
import { Network } from './network';
import { TransactionsType } from './transactionsType';

// config
const PORT = 8080;
const HOST = 'localhost';
const ccpPath = path.resolve(__dirname, '..', '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
const userIdentityName = 'appUser';
const walletPath = path.join(process.cwd(), 'wallet');
const contractName = 'fabcar';
const channelName = 'mychannel';
const grpcURL = 'grpc://localhost:7051';

// Server
const app = express();
// middleware
app.use(bodyParser.json());
app.use(basicAuth({
  users: { 'admin': 'asdasd' }
}))
// ep RPC
app.get('/query', async function (req, res) {
  // /query?q=queryAllCars
  // /query?q=queryCar&key=CAR0
  const { q, key }: { q:string, key:string } = req.query;
  try {
    // load the network configuration
    const network = new Network(userIdentityName);
    await network.settupNetwork(channelName, grpcURL, ccpPath, walletPath);
    const contract = network.getContract(contractName);

    // Evaluate the specified transaction.
    // queryCar transaction - requires 1 argument, ex: ('queryCar', 'CAR4')
    // queryAllCars transaction - requires no arguments, ex: ('queryAllCars')
    let result;
    if (q == TransactionsType.QUERY_CAR && key) {
      result = await contract.evaluateTransaction(q, key);
    } else if (q == TransactionsType.QUERY_ALL_CARS) {
      result = await contract.evaluateTransaction(q);
    } else {
      throw "Unknown transaction type";
    }
    console.log('Transaction has been evaluated');

    // Disconnect from the gateway.
    await network.disconnect();
    res.status(200).json(JSON.parse(result.toString()));
  } catch (error) {
    const err = `Failed to evaluate transaction: ${error}`;
    console.error(err);
    res.status(500).json({ error: err })
  }
});

app.post('/invoke', async function (req, res) {
  // /invoke?q=createCar - with body params
  // /invoke?q=changeCarOwner&key=CAR0 - with body params
  const { q, key } = req.query;
  const { car }: {car:Car} = req.body;
  try {
    // load the network configuration
    const network = new Network(userIdentityName);
    await network.settupNetwork(channelName, grpcURL, ccpPath, walletPath);
    const contract = network.getContract(contractName);

    // Submit the specified transaction.
    // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
    // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR12', 'Dave')
    if (q == TransactionsType.CREATE_CAR) {
      await contract.submitTransaction(q, key, car.make, car.model, car.color, car.owner);
    } else if (q == TransactionsType.CHANGE_CAR_OWNER) {
      await contract.submitTransaction(q, key, car.owner);
    } else {
      throw "Unknown transaction type";
    }

    const result = 'Transaction has been submitted';
    console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

    // Disconnect from the gateway.
    await network.disconnect();
    res.status(200).json({ code: 200, message: result });;
  } catch (error) {
    const err = `Failed to evaluate transaction: ${error}`;
    console.error(err);
    res.status(500).json({ error: err })
  }
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);