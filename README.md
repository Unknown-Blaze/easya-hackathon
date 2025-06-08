<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>React + Vite + FastAPI + XRP Blockchain App</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 2rem;
      background-color: #f9f9f9;
      color: #333;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    code, pre {
      background: #f4f4f4;
      padding: 0.5em;
      border-radius: 4px;
      display: block;
      overflow-x: auto;
    }
    pre {
      white-space: pre-wrap;
    }
    .block {
      background: #fff;
      border: 1px solid #ddd;
      padding: 1em;
      border-radius: 8px;
      margin-bottom: 1em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }

    thead {
      background-color: #f9fafb;
    }

    th, td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    th {
      color: #374151;
      font-weight: 600;
    }

    code {
      background-color: #f3f4f6;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: Consolas, monospace;
    }
  </style>
</head>
<body>
    <h1>nGoDonate</h1>
  <h2>React + Vite + FastAPI + XRP Blockchain App</h2>
  <p>Blockchain based, near transparent, trustworthy and secure donation platform</p>
  <ul>
    <li>🌐 <strong>React + Vite</strong> for a fast and modern frontend experience</li>
    <li>⚙️ <strong>FastAPI</strong> for a high-performance backend API in Python</li>
    <li>🔗 <strong>XRP Ledger (XRPL)</strong> for blockchain interactions (sending transactions, checking balances, etc.)</li>
  </ul>

  <h2>Quick Start</h2>
  <h3>1. Clone the Repository</h3>
  <pre>git clone https://github.com/Unknown-Blaze/easya-hackathon.git
cd easya-hackathon</pre>

  <h3>2. Backend Setup (FastAPI)</h3>
  <pre>
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
  </pre>

  <h4><code>requirements.txt</code></h4>
  <pre>
fastapi
uvicorn
xrpl-py
python-dotenv
firebase-admin
pydantic
email-validator
web3
  </pre>

  <h4>Run the API</h4>
  <pre>uvicorn app.main:app --reload</pre>
  <p>Default API URL: <code>http://localhost:8000</code></p>

  <h3>3. Frontend Setup (React + Vite)</h3>
  <pre>
cd frontend
npm install
npm run dev
  </pre>
  <p>Frontend runs on: <code>http://localhost:5173</code></p>

  <h3> XRP Ledger Integration</h3>
  <p>The backend uses <code>xrpl-py</code> to interact with the XRP Ledger.</p>

  <h3> XRP Donation API Endpoints</h3>
    <table>
      <thead>
        <tr>
          <th>Endpoint</th>
          <th>Method</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>/donate</code></td>
          <td><strong>POST</strong></td>
          <td>Accept a donation transaction (via XRP payment)</td>
        </tr>
        <tr>
          <td><code>/verify</code></td>
          <td><strong>POST</strong></td>
          <td>Verify the authenticity of a donation or wallet</td>
        </tr>
        <tr>
          <td><code>/mint</code></td>
          <td><strong>POST</strong></td>
          <td>Mint a token (e.g., NFT) after successful verification</td>
        </tr>
        <tr>
          <td><code>/token</code></td>
          <td><strong>GET</strong></td>
          <td>Retrieve information about a specific token</td>
        </tr>
        <tr>
          <td><code>/latest-transactions</code></td>
          <td><strong>GET</strong></td>
          <td>Get a list of the latest donation transactions</td>
        </tr>
      </tbody>
    </table>

</body>
</html>
