import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupModal } from '@near-wallet-selector/modal-ui';
import { setupNearWallet } from '@near-wallet-selector/near-wallet';
import { Buffer } from 'buffer';
import '@near-wallet-selector/modal-ui/styles.css';
import * as nearAPI from 'near-api-js';

// buffer pollyfill needed by Near Wallet Selector
globalThis.Buffer = Buffer;

const selector = await setupWalletSelector({
  network: 'testnet',
  modules: [setupNearWallet()],
});

const modal = setupModal(selector, {
  contractId: 'auth.onmachina.testnet',
});

modal.show();

const selectorWallet = await selector.wallet();
const selectorAccount = (await selectorWallet.getAccounts()).shift(); // Get the 1st account
const accountId = selectorAccount.accountId;
const networkId = 'testnet';

const config = {
  networkId,
  keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
  nodeUrl: 'https://rpc.testnet.near.org',
};

const near = await nearAPI.connect(config);
const signer = near.connection.signer;
const signerPublicKey = (
  await signer.getPublicKey(accountId, config.networkId)
).toString();

const account = new nearAPI.Account(near.connection, accountId);

const nonce = (await account.getAccessKeys())
  .find((k) => k.public_key === signerPublicKey)
  .access_key.nonce.toString();

const accountData = Buffer.from(JSON.stringify({ id: accountId, nonce }));
const signatureData = await signer.signMessage(
  accountData,
  accountId,
  networkId
);

const publicKey = Buffer.from(signatureData.publicKey.toString());
const signature = Buffer.from(signatureData.signature);

const credentials = Buffer.from(
  JSON.stringify({
    account: accountData.toString('base64'),
    publicKey: publicKey.toString('base64'),
    signature: signature.toString('base64'),
  })
).toString('base64');

console.log(credentials);

const response = await fetch('https://auth.testnet.onmachina.io/auth/v1', {
  method: 'GET',
  headers: {
      'x-auth-user': 'any',
      'x-auth-key': credentials
  },
});

// Same as above, but using the proxy configured in vite.config.js

// const response = await fetch('/api', {
//   method: 'GET',
//   headers: {
//       'x-auth-user': 'any',
//       'x-auth-key': credentials
//   },
// });


// Console log the response
const contentType = response.headers.get('content-type');
console.log(contentType);
const data = await response.text();
console.log(data);
response.headers.forEach(function(val, key) { console.log(key + ' -> ' + val); });

// Retrieve the x-auth-token
const x_auth_token = response.headers.get('x-auth-token');
document.getElementById("token").value = x_auth_token;

const submit = () => {
  var token = document.getElementById('token').value;
  var method = document.getElementById('method').value;
  var url = document.getElementById('url').value;

  document.getElementById('response_headers').textContent = null;
  document.getElementById('response_body').textContent = null;

  var request = new XMLHttpRequest();

  request.onreadystatechange = function (oEvent) {
      if (request.readyState == 4) {
          responseHeaders = 'Status: ' + request.status;
          responseHeaders = responseHeaders + '\nStatus Text: ' + request.statusText;
          responseHeaders = responseHeaders + '\n\n' + request.getAllResponseHeaders();
          document.getElementById('response_headers').textContent = responseHeaders;
          document.getElementById('response_body').textContent = request.responseText;
      }
  }

  request.open(method, url);
  if (token != '') {
      // custom headers always trigger a pre-flight request
      request.setRequestHeader('X-Auth-Token', token);
  }
  request.send(null);
}

const input = document.getElementById('submit');
input.addEventListener('click', submit, false);

// const upload = (file) => {
//   fetch('https://api.testnet.onmachina.io/v1/toddmorey.testnet/testcontainer/', { // Your POST endpoint
//     method: 'POST',
//     headers: {
//       // Content-Type may need to be completely **omitted**
//       // or you may need something
//       "Content-Type": file.type,
//       "x-auth-token": x_auth_token
//     },
//     body: file // This is your file object
//   }).then(
//     response => response.json() // if the response is a JSON object
//   ).then(
//     success => console.log(success) // Handle the success response object
//   ).catch(
//     error => console.log(error) // Handle the error response object
//   );
// };

// // Event handler executed when a file is selected
// const onSelectFile = () => upload(input.files[0]);

// // Add a listener to file input
// const input = document.getElementById('fileinput');
// input.addEventListener('change', onSelectFile, false);

