#!/usr/bin/env node

/**
 * Generate self-signed certificates for HTTPS development
 * Run with: node scripts/generate-cert.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const certDir = path.join(__dirname, '..', 'certs');

// Create certs directory if it doesn't exist
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

const keyPath = path.join(certDir, 'localhost-key.pem');
const certPath = path.join(certDir, 'localhost.pem');

// Check if certificates already exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('✅ Certificates already exist!');
  console.log(`Key: ${keyPath}`);
  console.log(`Cert: ${certPath}`);
  process.exit(0);
}

try {
  console.log('🔐 Generating self-signed certificate for localhost...');
  
  // Generate private key
  execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
  
  // Generate certificate
  execSync(`openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=US/ST=Dev/L=Dev/O=Dev/CN=localhost"`, { stdio: 'inherit' });
  
  console.log('✅ Certificate generated successfully!');
  console.log(`Key: ${keyPath}`);
  console.log(`Cert: ${certPath}`);
  console.log('\n📱 To use with your iPad:');
  console.log('1. Find your computer\'s IP address');
  console.log('2. Add that IP to the certificate (you may need to regenerate)');
  console.log('3. Access https://YOUR_IP:9002 from your iPad');
  
} catch (error) {
  console.error('❌ Error generating certificate:', error.message);
  console.log('\n💡 Alternative options:');
  console.log('1. Use: npm run dev:https (Next.js will auto-generate)');
  console.log('2. Install mkcert: https://github.com/FiloSottile/mkcert');
  console.log('3. Use ngrok for external access: https://ngrok.com/');
}
