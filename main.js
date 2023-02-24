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

const response = await fetch('http://auth.testnet.onmachina.io/auth/v1', {
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
const x_auth_token = response.headers.get('x-auth-token');
console.log("x-auth-token",x_auth_token);

