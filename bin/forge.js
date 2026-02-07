#!/usr/bin/env node

const forge = require('../src/index.js');

forge.run().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
