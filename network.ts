import { Gateway, Wallets } from 'fabric-network';
import * as fs from 'fs';

// Hyperledger Bridge
import * as Fabric_Client from 'fabric-client';

export class Network {
  private user:string;
  private wallet;
  private identity;
  private gateway;
  private network;

  constructor(user: string) {
    this.user = user;
  }

  async settupNetwork(channelName: string, peerURL: string, ccpPath: string, walletPath:string) {
    // Client
    const fabric_client = new Fabric_Client();

    // setup the fabric network
    const channel = fabric_client.newChannel(channelName);
    const peer = fabric_client.newPeer(peerURL);
    channel.addPeer(peer, null);

    // load the network configuration
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new file system based wallet for managing identities.
    this.wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    this.identity = await this.wallet.get(this.user);
    if (!this.identity) {
      console.log('An identity for the user "appUser" does not exist in the wallet');
      console.log('Run the registerUser.js application before retrying');
      return;
    }

    // Create a new gateway for connecting to our peer node.
    this.gateway = new Gateway();
    await this.gateway.connect(ccp, { wallet: this.wallet, identity: this.user, discovery: { enabled: true, asLocalhost: true } });

    // Get the network (channel) our contract is deployed to.
    this.network = await this.gateway.getNetwork('mychannel');
  }

  // Get the contract from the network.
  getContract(name:string) {
    return this.network.getContract(name);
  }

  async disconnect() {
    await this.gateway.disconnect();
  }
}