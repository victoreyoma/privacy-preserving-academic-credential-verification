require("@nomicfoundation/hardhat-toolbox");
// require("hardhat-gas-reporter"); // <--- Add this
require("dotenv").config(); // Load the .env
module.exports = {
  solidity: "0.8.20",
  // gasReporter: {
  //   enabled: true,
  //   currency: 'USD',
  //   gasPrice: 20, // Estimated Gwei (standard network cost)
  //   // coinmarketcap: "YOUR_API_KEY", // Optional: for real-time prices
  // },
  networks: {
    // 1. Local Network (What you used before)
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // 2. Sepolia Testnet (The new target)
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL, // Reads from .env
      accounts: [process.env.PRIVATE_KEY], // Reads from .env
    },
  },
};