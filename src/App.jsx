import "./App.css";
import React, { useState, useEffect } from "react";
import { init } from "./utils/fhevm";
import { Connect } from "./Connect";
import PrivateVoting from "./PrivateVoting";

function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    init()
      .then(() => {
        setIsInitialized(true);
      })
      .catch(() => setIsInitialized(false));
  }, []);

  if (!isInitialized) return null;

  return (
    <div className="App flex flex-col justify-center font-press-start text-black">
      <div>
        <Connect>
          {() => (
            <PrivateVoting />
          )}
        </Connect>
      </div>
    </div>
  );
}

export default App;
