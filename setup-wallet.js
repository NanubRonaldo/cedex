const FabricGateway = require('./fabric-gateway');
const path = require('path');

async function setupWallet() {
  const gateway = new FabricGateway();
  await gateway.initialize();

  // Map demo users to their Fabric identities
  const users = [
    {
      userId: 'policyholder@cedex.local',
      mspId: 'InsurerMSP',
      certPath: path.join(__dirname, 'crypto-config/peerOrganizations/insurer.cedex.com/users/Admin@insurer.cedex.com/msp/signcerts/Admin@insurer.cedex.com-cert.pem'),
      keyPath: path.join(__dirname, 'crypto-config/peerOrganizations/insurer.cedex.com/users/Admin@insurer.cedex.com/msp/keystore/priv_sk')
    },
    {
      userId: 'lender@cedex.local',
      mspId: 'LenderMSP',
      certPath: path.join(__dirname, 'crypto-config/peerOrganizations/lender.cedex.com/users/Admin@lender.cedex.com/msp/signcerts/Admin@lender.cedex.com-cert.pem'),
      keyPath: path.join(__dirname, 'crypto-config/peerOrganizations/lender.cedex.com/users/Admin@lender.cedex.com/msp/keystore/priv_sk')
    }
  ];

  for (const user of users) {
    await gateway.setupUserWallet(user.userId, user.mspId, user.certPath, user.keyPath);
  }

  console.log('Wallet setup complete!');
  process.exit(0);
}

setupWallet().catch(console.error);
