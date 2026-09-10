import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { app } from 'electron';

// File location in userData
const file = path.join(app.getPath('userData'), 'microscopy_ta.txt');

// AES-256 encryption
const key = '12345678901234567890123456789012'; // 32 chars for AES-256
const algorithm = 'aes-256-cbc';

export function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(data) {
  const [ivHex, encrypted] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Save folder path (encrypted)
export function savePath(folderPath) {
  const encrypted = encrypt(folderPath);
  fs.writeFileSync(file, encrypted, 'utf8');
}

// Load folder path
export function loadPath() {
  if (!fs.existsSync(file)) return null;
  const encrypted = fs.readFileSync(file, 'utf8');
  return decrypt(encrypted);
}
