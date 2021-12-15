const HDWalletProvider = require("@truffle/hdwallet-provider");
const Web3 = require("web3");
const { interface, bytecode } = require("./compile");
require("dotenv").config();

const provider = new HDWalletProvider(
  process.env.MNMC,
  // process.env.INFURA_ROBSTEN_URL
  // process.env.INFURA_GOERLY_URL
  process.env.INFURA_RINKEBY_URL
);
const web3 = new Web3(provider);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();

  console.log("Attempting to deploy from account", accounts[0]);

  const result = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ gas: 6500000, gasPrice: 100000000000, from: accounts[0] });

  console.log("Contract deployed to", result.options.address);
  console.log("abi", interface);
  provider.engine.stop();
};
deploy();
