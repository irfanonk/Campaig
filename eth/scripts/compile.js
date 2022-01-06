const path = require("path");
const fs = require("fs-extra");
const solc = require("solc");

const buildPath = path.resolve(__dirname, "../build");
fs.removeSync(buildPath);
// console.log("cmpl", buildPath);
const campaignPath = path.resolve(__dirname, "../contracts", "Campaign.sol");
console.log("c path", campaignPath);
const source = fs.readFileSync(campaignPath, "utf8");
const contracts = solc.compile(source, 1).contracts;

fs.ensureDirSync(buildPath);

for (let contract in contracts) {
  fs.outputJSONSync(
    path.resolve(buildPath, contract.replace(":", "") + ".json"),
    contracts[contract]
  );
}
