// crypto-chat.js — Criptografia em repouso do chat (mensagens e anexos em PDF)
// AES-256-GCM via módulo `crypto` nativo do Node — nenhuma dependência nova.
// A chave é gerada uma única vez e guardada em Backend/.chat-key (fora do git,
// ver .gitignore) — nunca fica hardcoded no código-fonte.
const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const KEY_PATH = path.join(__dirname, '.chat-key');

function _carregarOuCriarChave() {
  if (fs.existsSync(KEY_PATH)) {
    return Buffer.from(fs.readFileSync(KEY_PATH, 'utf8').trim(), 'hex');
  }
  const chave = crypto.randomBytes(32); // AES-256
  fs.writeFileSync(KEY_PATH, chave.toString('hex'), { mode: 0o600 });
  console.log('[CHAT CRYPTO] Nova chave de criptografia gerada em Backend/.chat-key');
  return chave;
}

const CHAVE = _carregarOuCriarChave();

// Criptografa uma string (texto de mensagem). Retorna { cifrado, iv, authTag } — tudo hex.
function encryptTexto(textoPlano) {
  const iv = crypto.randomBytes(12); // recomendado p/ GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', CHAVE, iv);
  const cifrado = Buffer.concat([cipher.update(textoPlano, 'utf8'), cipher.final()]);
  return { cifrado: cifrado.toString('hex'), iv: iv.toString('hex'), authTag: cipher.getAuthTag().toString('hex') };
}

// Descriptografa de volta pro texto original.
function decryptTexto(cifradoHex, ivHex, authTagHex) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', CHAVE, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const texto = Buffer.concat([decipher.update(Buffer.from(cifradoHex, 'hex')), decipher.final()]);
  return texto.toString('utf8');
}

// Mesma lógica, mas para buffers binários (anexos em PDF).
function encryptBuffer(bufferPlano) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', CHAVE, iv);
  const cifrado = Buffer.concat([cipher.update(bufferPlano), cipher.final()]);
  return { cifrado, iv: iv.toString('hex'), authTag: cipher.getAuthTag().toString('hex') };
}

function decryptBuffer(bufferCifrado, ivHex, authTagHex) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', CHAVE, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return Buffer.concat([decipher.update(bufferCifrado), decipher.final()]);
}

module.exports = { encryptTexto, decryptTexto, encryptBuffer, decryptBuffer };
