const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");

const compiledFactory = require("../build/CampaignFactory.json");
require("dotenv").config();

const provider = new HDWalletProvider(
  process.env.MNMC,
  process.env.INFURA_ROBSTEN_URL
  // process.env.INFURA_GOERLY_URL
  // process.env.INFURA_RINKEBY_URL
);
const web3 = new Web3(provider);

let accounts, factory, campaignAddress, campaign;
const deploy = async () => {
  accounts = await web3.eth.getAccounts();

  console.log("Attempting to deploy from account", accounts[0]);

  try {
    factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
      .deploy({ data: compiledFactory.bytecode })
      .send({ gas: 1_000_000, from: accounts[0] });
  } catch (error) {
    console.log("err", error);
  }
  [campaignAddress] = await factory.methods.getDeployedCampaign().call();

  campaign = await new web3.eth.Contract(
    JSON.parse(compiledCampaign.interface),
    campaignAddress
  );
  console.log("factory deployed to", factory.options.address);
  console.log("campaign deployed to", campaign.options.address);
  provider.engine.stop();
};
deploy();
