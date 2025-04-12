import React from 'react';
import logo from './logo.png'; // Import the logo
import MyDapp from './MyDapp';
import './App.css';

console.log('App component rendered'); // Add this line

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Spreading Affection, One Lottery at a Time!</p>
      </header>
      <div className="dapp-container">
        <MyDapp />
      </div>
    </div>
  );
}

export default App;