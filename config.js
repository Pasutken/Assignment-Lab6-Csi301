export const student = {
  id: "66085074",
  name: "พศุตม์ ฟักแจ้ง",
};

// Deployed Sepolia Bank address. Replace it here if you redeploy the contract.
export const bankAddress = "0x2565f98cc76ab6810bf24a2b68fe8cec97301406";

// Contract ABI copied from the verified Bank contract on Sepolia Etherscan.
export const bankAbi = [
  {
    type: "event",
    name: "Deposit",
    anonymous: false,
    inputs: [
      { name: "owner", type: "address", internalType: "address", indexed: true },
      { name: "amount", type: "uint256", internalType: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Withdraw",
    anonymous: false,
    inputs: [
      { name: "owner", type: "address", internalType: "address", indexed: true },
      { name: "amount", type: "uint256", internalType: "uint256", indexed: false },
    ],
  },
  {
    type: "function",
    name: "checkBlance",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "balance", type: "uint256", internalType: "uint256" }],
  },
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256", internalType: "uint256" }],
    outputs: [],
  },
];
