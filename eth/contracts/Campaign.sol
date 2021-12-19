pragma solidity ^0.4.17;

contract CampaignFactory {
    address[] public deployedCampaigns;

    function createCampaign(uint256 minimum) public {
        address newCampaign = new Campaign(minimum, msg.sender);
        deployedCampaigns.push(newCampaign);
    }

    function getDeployedCampaign() public view returns (address[]) {
        return deployedCampaigns;
    }
}

contract Campaign {
    struct Request {
        string description;
        uint256 value;
        address recipient;
        bool completed;
        uint256 approvalCount;
        mapping(address => bool) approvals; //referance type
    }
    Request[] public requests;
    address public manager;
    uint256 public minimunContribution;
    mapping(address => bool) public approvers;
    uint256 public approversCount;

    modifier restricted() {
        require(msg.sender == manager);
        _;
    }

    function Campaign(uint256 minimum, address campaignCreator) public {
        manager = campaignCreator;
        minimunContribution = minimum;
    }

    function contribute() public payable {
        require(msg.value >= minimunContribution);
        require(!approvers[msg.sender]);
        approvers[msg.sender] = true;
        approversCount++;
    }

    function createRequest(
        string description,
        uint256 value,
        address recipient
    ) public restricted {
        Request memory newRequest = Request({
            completed: false,
            description: description,
            value: value,
            recipient: recipient,
            approvalCount: 0
        });
        requests.push(newRequest);
    }

    function approveRequest(uint256 index) public {
        require(approvers[msg.sender]);

        Request storage request = requests[index];
        require(request.approvals[msg.sender] == false);
        request.approvals[msg.sender] = true;
        request.approvalCount++;
    }

    function finilazeRequest(uint256 index) public restricted {
        Request storage request = requests[index];
        require(this.balance >= request.value);
        require(!request.completed);
        require(request.approvalCount > (approversCount / 2));

        request.completed = true;
        request.recipient.transfer(request.value);
    }

    function getSummary()
        public
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            address
        )
    {
        return (
            minimunContribution,
            this.balance,
            requests.length,
            approversCount,
            manager
        );
    }

    function getRequestsCount() public view returns (uint256) {
        return requests.length;
    }
}
