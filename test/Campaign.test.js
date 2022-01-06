const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const web3 = new Web3(ganache.provider());

const compiledFactory = require("../eth/build/CampaignFactory.json");
const compiledCampaign = require("../eth/build/Campaign.json");

let accounts, factory, campaignAddress, campaign;
const eth = (s) => web3.utils.toWei(s.toString(), "ether");

beforeEach(async () => {
  // Get a list of all accounts
  accounts = await web3.eth.getAccounts();
  factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
    .deploy({ data: compiledFactory.bytecode })
    .send({ gas: 1_000_000, from: accounts[0] });
  // console.log("lott", factory.options.address);
  await factory.methods
    .createCampaign(100)
    .send({ gas: 1_000_000, from: accounts[0] });
  [campaignAddress] = await factory.methods.getDeployedCampaign().call();

  campaign = await new web3.eth.Contract(
    JSON.parse(compiledCampaign.interface),
    campaignAddress
  );
  // console.log("address", campaignAddress);
  // console.log("address", campaign.options.address);
  // const balanceNew = await web3.eth.getBalance(accounts[5]);
  // console.log("balance", balanceNew);
});
describe("Campaign", function () {
  it("can deploy", () => {
    assert.ok(factory.options.address);
    assert.ok(campaign.options.address);
  });
  it("marks deployer as manager", async () => {
    const manager = await campaign.methods.manager().call();
    assert.equal(accounts[0], manager);
  });
  it("allows contributors ", async () => {
    const approversCountOld = await campaign.methods.approversCount().call();
    await campaign.methods
      .contribute()
      .send({ from: accounts[1], value: "200" });
    await campaign.methods
      .contribute()
      .send({ from: accounts[2], value: "200" });

    const approversCountNew = await campaign.methods.approversCount().call();

    assert(approversCountOld < approversCountNew);
    assert.equal(2, approversCountNew);
  });
  it("requires min contribution fee", async () => {
    let evaluated;
    try {
      await campaign.methods
        .contribute()
        .send({ from: accounts[3], value: "50" });
      evaluated = "success";
    } catch (error) {
      evaluated = "failure";
    }
    const appr3 = await campaign.methods.approvers(accounts[3]).call();

    assert.equal("failure", evaluated);
    assert.equal(false, appr3);
  });
  it("create a request", async () => {
    const tx = await campaign.methods
      .createRequest("a", eth("4"), accounts[5])
      .send({
        from: accounts[0],
        gas: 1_000_000,
      });
    const request = await campaign.methods.requests(0).call();
    let { logs } = tx;
    const requestEvents = campaign.RequestEvents();
    console.log("logs", logs);
    // console.log("request", request);
    // console.log(
    //   await campaign.methods
    //     .createRequest("Buy batteries", "100", accounts[1])
    //     .estimateGas()
    // );
    assert.equal("a", request.description);
  });

  it("prevent from creating request except manager", async () => {
    let evaluated;
    try {
      await campaign.methods.createRequest("aduket", 300, accounts[5]).send({
        from: accounts[1],
        gas: 1_000_000,
      });
      evaluated = "success";
    } catch (error) {
      evaluated = "failure";
    }
    assert.equal("failure", evaluated);
  });
  it("can approve request", async () => {
    await campaign.methods
      .contribute()
      .send({ from: accounts[1], value: "200" });
    await campaign.methods
      .contribute()
      .send({ from: accounts[2], value: "200" });
    await campaign.methods.createRequest("aduket", 300, accounts[5]).send({
      from: accounts[0],
      gas: 1_000_000,
    });
    await campaign.methods.approveRequest(0).send({
      from: accounts[1],
      gas: 1_000_000,
    });
    await campaign.methods.approveRequest(0).send({
      from: accounts[2],
      gas: 1_000_000,
    });
    const approversCount = await campaign.methods.approversCount().call();
    const request = await campaign.methods.requests(0).call();

    assert.equal(2, approversCount);
    assert.equal(2, request.approvalCount);
  });
  it("can prevent non-approvers from approving request", async () => {
    let canApprove;
    await campaign.methods
      .contribute()
      .send({ from: accounts[1], value: "200" });
    await campaign.methods
      .contribute()
      .send({ from: accounts[2], value: "200" });
    await campaign.methods.createRequest("aduket", 300, accounts[5]).send({
      from: accounts[0],
      gas: 1_000_000,
    });
    try {
      await campaign.methods.approveRequest(0).send({
        from: accounts[3],
        gas: 1_000_000,
      });
      canApprove = true;
    } catch (error) {
      canApprove = false;
    }

    assert.equal(false, canApprove);
  });
  it("can finilaze request", async () => {
    const balanceOld = await web3.eth.getBalance(accounts[5]);
    await campaign.methods
      .contribute()
      .send({ from: accounts[1], value: eth(3) });
    await campaign.methods
      .contribute()
      .send({ from: accounts[2], value: eth(4) });
    await campaign.methods.createRequest("aduket", eth(7), accounts[5]).send({
      from: accounts[0],
      gas: 1_000_000,
    });
    await campaign.methods.approveRequest(0).send({
      from: accounts[1],
      gas: 1_000_000,
    });
    await campaign.methods.approveRequest(0).send({
      from: accounts[2],
      gas: 1_000_000,
    });

    await campaign.methods.finilazeRequest(0).send({
      from: accounts[0],
      gas: 1_000_000,
    });
    const balanceNew = await web3.eth.getBalance(accounts[5]);
    const request = await campaign.methods.requests(0).call();
    console.log(balanceOld);
    console.log(balanceNew);
    assert(balanceNew > balanceOld);
    assert.equal(true, request.completed);
  });
  it("require enough balance to finalize", async () => {
    const balanceOld = await web3.eth.getBalance(accounts[5]);
    await campaign.methods
      .contribute()
      .send({ from: accounts[1], value: eth(5) });
    await campaign.methods
      .contribute()
      .send({ from: accounts[2], value: eth(5) });
    await campaign.methods.createRequest("aduket", eth(11), accounts[5]).send({
      from: accounts[0],
      gas: 1_000_000,
    });
    await campaign.methods.approveRequest(0).send({
      from: accounts[1],
      gas: 1_000_000,
    });
    await campaign.methods.approveRequest(0).send({
      from: accounts[2],
      gas: 1_000_000,
    });

    let isfinilized;
    try {
      await campaign.methods.finilazeRequest(0).send({
        from: accounts[0],
        gas: 1_000_000,
      });
      isfinilized = true;
    } catch (error) {
      isfinilized = false;
    }

    const balanceNew = await web3.eth.getBalance(accounts[5]);
    const contractBalance = await web3.eth.getBalance(campaignAddress);

    console.log("cont bal", contractBalance);
    console.log(balanceOld);
    console.log(balanceNew);
    assert.equal(eth(10), contractBalance);
    assert.equal(false, isfinilized);
  });
});
