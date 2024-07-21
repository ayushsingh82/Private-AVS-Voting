import React from "react";
import { useState, useEffect } from "react";
import { getInstance, provider, getTokenSignature } from "./utils/fhevm";
import { toHexString } from "./utils/utils";
import { Contract } from "ethers";
import privateVotingABI from "./abi/privateVotingABI";

let instance;
const CONTRACT_ADDRESS = "0xcA99ef793E76c848Ea1A1B509Df1268BC8cb8d78";

function PrivateVoting() {
  const [inFavorVoteCount, setInFavorVoteCount] = useState("hidden");
  const [againstVoteCount, setAgainstVoteCount] = useState("hidden");
  const [voteCount, setVoteCount] = useState(0);
  const [voteChoice, setVoteChoice] = useState("");
  const [decryptedChoice, setDecryptedChoice] = useState("hidden");
  const [decryptedCount, setDecryptedCount] = useState("hidden");
  const [loading, setLoading] = useState("");
  const [dialog, setDialog] = useState("");
  const [encryptedChoice, setEncryptedChoice] = useState("");
  const [encryptedAmount, setEncryptedAmount] = useState("");

  useEffect(() => {
    async function fetchInstance() {
      instance = await getInstance();
    }
    fetchInstance();
  }, []);

  const handleVoteCountChange = (e) => {
    if (e.target.value > 100) {
      return null;
    }
    setVoteCount(Number(e.target.value));
    console.log(instance);
    if (instance) {
      const encrypted = instance.encrypt8(Number(e.target.value));
      setEncryptedAmount(toHexString(encrypted));
    }
  };

  const handleVoteChoiceChange = (e) => {
    let choice = e.target.value;
    setVoteChoice(choice);
    if (instance) {
      if (choice === "In Favor") {
        choice = 1;
      } else {
        choice = 0;
      }
      const encrypted = instance.encrypt8(choice);
      setEncryptedChoice(toHexString(encrypted));
    }
  };

  const castVote = async (event) => {
    event.preventDefault();
    try {
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, privateVotingABI, signer);
      setLoading('Encrypting "30" and generating ZK proof...');
      setLoading("Sending transaction...");
      const transaction = await contract.castVote(
        "0x" + encryptedAmount,
        "0x" + encryptedChoice,
        { gasLimit: 1000000 }
      );
      setLoading("Waiting for transaction validation...");
      await provider.waitForTransaction(transaction.hash);
      setLoading("");
      setDialog("Your private vote has been counted!");
    } catch (e) {
      console.log(e);
      setLoading("");
      setDialog("Transaction error!");
    }
  };

  const reencryptVoteCount = async () => {
    try {
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, privateVotingABI, signer);
      setLoading("Decrypting Credit Score...");
      const { publicKey, signature } = await getTokenSignature(
        CONTRACT_ADDRESS,
        signer.address,
        signer
      );
      const ciphertext = await contract.viewOwnVoteCount(publicKey, signature);
      console.log(ciphertext);
      const voteCountDecrypted = instance.decrypt(CONTRACT_ADDRESS, ciphertext);
      setDecryptedCount(String(voteCountDecrypted));
      setLoading("");
    } catch (e) {
      console.log(e);
      setLoading("");
      setDialog("Error during reencrypt!");
    }
  };

  const reencryptVoteChoice = async () => {
    try {
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, privateVotingABI, signer);
      setLoading("Decrypting Credit Score...");
      const { publicKey, signature } = await getTokenSignature(
        CONTRACT_ADDRESS,
        signer.address,
        signer
      );
      const ciphertext = await contract.viewOwnVoteChoice(publicKey, signature);
      console.log(ciphertext);
      const voteChoiceDecrypted = instance.decrypt(
        CONTRACT_ADDRESS,
        ciphertext
      );
      if (voteChoiceDecrypted == 0) {
        setDecryptedChoice("Against");
      } else {
        setDecryptedChoice("In Favor");
      }

      setLoading("");
    } catch (e) {
      console.log(e);
      setLoading("");
      setDialog("Error during reencrypt!");
    }
  };

  const revealResult = async () => {
    try {
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, privateVotingABI, signer);
      setLoading('Encrypting "30" and generating ZK proof...');
      setLoading("Sending transaction...");
      console.log("signer", typeof signer.address);
      await contract.revealResult();
      setLoading("Waiting for transaction validation...");
      setLoading("");
      const against = Number(await contract.againstCount());
      const inFavor = Number(await contract.inFavorCount());
      setAgainstVoteCount(against);
      setInFavorVoteCount(inFavor);
    } catch (e) {
      console.log(e);
      setLoading("");
      setDialog("Error!");
    }
  };

  // <img src={"/band.svg"} alt="Band" />

  return (
    <div className="mt-5 ">
      <div className="flex flex-col text-center justify-center items-center mb-10 mt-10">
       
        <h1 className="my-10 text-2xl font-bold text-black">Private Voting for AVS</h1>
      
      </div>
      <div className="flex flex-col md:flex-row">
        <div className="flex flex-col md:w-1/2 p-4 ">
          <div className="bg-black py-10 px-10 text-left mb-6">
            <div className="text-white">
              In Favor Vote Count:{" "}
              <span className="text-custom-green">{inFavorVoteCount}</span>
            </div>
            <div className="text-white">
              Against Vote Count:{" "}
              <span className="text-custom-green">{againstVoteCount}</span>
            </div>
            <button
              className="bg-gray-200 hover:bg-blue-400 text-black font-bold py-2 px-4 rounded mb-8"
              onClick={revealResult}
            >
              Reveal Result
            </button>
            <div className="text-white">
              My Vote Count{" "}
              <span className="text-custom-green">{decryptedCount}</span>
            </div>
            <button
              className="bg-gray-200 hover:bg-blue-400 text-black font-bold py-2 px-4 rounded mb-8"
              onClick={reencryptVoteCount}
            >
              Decrypt Count
            </button>
            <div className="text-white">
              My Vote Choice:{" "}
              <span className="text-custom-green">{decryptedChoice}</span>
            </div>
            <button
              className="bg-gray-200 hover:bg-blue-400 text-black font-bold py-2 px-4 rounded mb-8"
              onClick={reencryptVoteChoice}
            >
              Decrypt Choice
            </button>
          </div>
          <div className="text-gray-500">Enter the amount of votes:</div>
          <br></br>
          <form onSubmit={castVote}>
            <input
              type="number"
              placeholder="Enter amount of votes"
              value={voteCount}
              onChange={handleVoteCountChange}
              className="border rounded-md px-4 py-2 mb-4 bg-white"
            />
            <div className="text-gray-500 mb-2">Select Vote Choice:</div>
            <select
              id="voteChoice"
              value={voteChoice}
              onChange={handleVoteChoiceChange}
              className="border rounded-md px-4 py-2 mb-1 bg-white"
            >
              <option value="" disabled>
                Select
              </option>
              <option value="In Favor">In Favor</option>
              <option value="Against">Against</option>
            </select>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-8"
            >
              Cast My Vote Privately
            </button>
          </form>
          <div className="text-gray-500">
            {encryptedChoice && (
              <div className="text-black">
                <p>Ciphertext for Choice:</p>
                <div className="overflow-y-auto h-10 flex flex-col">
                  <p>{"0x" + encryptedChoice.substring(0, 26) + "..."}</p>
                </div>
              </div>
            )}
            {encryptedAmount && (
              <div className="text-black">
                <p>Ciphertext for Count:</p>
                <div className="overflow-y-auto h-10 flex flex-col">
                  <p>{"0x" + encryptedAmount.substring(0, 26) + "..."}</p>
                </div>
              </div>
            )}
          </div>
          <div className="text-gray-500">
            {dialog && <div>{dialog}</div>}
            {loading && <div>{loading}</div>}
          </div>
        </div>
        <div className="flex flex-col md:w-1/2 p-4 overflow-y-auto h-96 bg-amber-300 bg-black">
          <div className="text-lg text-white">Anonymous Dao</div>
          <br></br>
          <div className="text-sm text-white">
            User vote count and choice are stored on-chain in an encryted
            manner.
          </div>
          <img src={"/CodePrivateVoting1.svg"} alt="CodePrivateVoting1" />
          <div className="text-sm text-white">
            Both &quot;In Favor&quot; and &quot;Against&quot; are incremented by the actual vote
            count or 0. But you can&apos;t tell!
          </div>
          <img src={"/CodePrivateVoting2.svg"} alt="CodePrivateVoting2" />
          <div className="text-sm text-white">
            Users are able to view their own decrypted vote count and choice by
            signing an EIP-712 signature.
          </div>
          <img src={"/CodePrivateVoting3.svg"} alt="CodePrivateVoting3" />
          <div>
            Smart Contract Implementation:{" "}
            <a
              target="_blank" rel="noreferrer"
              href="https://docs.inco.org/getting-started/example-dapps/private-voting"
            >
              Here
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivateVoting;



// <div className="flex flex-col md:w-1/2 p-4 overflow-y-auto h-96 bg-amber-300">
// <div className="text-lg">Code Snippets:</div>
// <br></br>
// <div className="text-sm">
//   User vote count and choice are stored on-chain in an encryted
//   manner.
// </div>
// <img src={"/CodePrivateVoting1.svg"} alt="CodePrivateVoting1" />
// <div className="text-sm">
//   Both &quot;In Favor&quot; and &quot;Against&quot; are incremented by the actual vote
//   count or 0. But you can&apos;t tell!
// </div>
// <img src={"/CodePrivateVoting2.svg"} alt="CodePrivateVoting2" />
// <div className="text-sm">
//   Users are able to view their own decrypted vote count and choice by
//   signing an EIP-712 signature.
// </div>
// <img src={"/CodePrivateVoting3.svg"} alt="CodePrivateVoting3" />
// <div>
//   Smart Contract Implementation:{" "}
//   <a
//     target="_blank" rel="noreferrer"
//     href="https://docs.inco.org/getting-started/example-dapps/private-voting"
//   >
//     Here
//   </a>
// </div>
// </div>
