import CryptoJS from 'crypto-js';
import { Securitykey } from './ApiHelper';

/**
 * Encrypts text using XOR + Base64.
 * @param {string} text - The plaintext to encrypt.
 * @returns {string} - Encrypted text (Base64 format).
 */
export const encrypt = (text: any) => {
  let encrypted = '';
  for (let i = 0; i < text.length; i++) {
    encrypted += String.fromCharCode(
      text.charCodeAt(i) ^ Securitykey.charCodeAt(i % Securitykey.length)
    );
  }
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Latin1.parse(encrypted));
};

/**
 * Decrypts Base64 + XOR encrypted text.
 * @param {string} encryptedText - The encrypted text in Base64 format.
 * @returns {string} - Decrypted plaintext.
 */
export const decrypt = (encryptedText: any) => {
  const decoded = CryptoJS.enc.Base64.parse(encryptedText).toString(CryptoJS.enc.Latin1);
  let decrypted = '';
  for (let i = 0; i < decoded.length; i++) {
    decrypted += String.fromCharCode(
      decoded.charCodeAt(i) ^ Securitykey.charCodeAt(i % Securitykey.length)
    );
  }
  return decrypted;
};

/**
 * Function to recursively encrypt object properties based on encryption level.
 * Handles arrays within objects.
 */
export const encryptObject = (obj: any, keyLevel: any) => {
  const encryptedObject: any = {};
  const isKeyEncrypted = keyLevel['key'];
  const isValueEncrypted = keyLevel['value'];

  for (const [key, value] of Object.entries(obj)) {
    const encryptedKey = isKeyEncrypted ? encrypt(key) : key;

    if (Array.isArray(value)) {
      encryptedObject[encryptedKey] = encryptArrayOfObjects(value, keyLevel);
    } else if (value instanceof Date) {
      const encryptedValue = isValueEncrypted ? encrypt(value.toISOString()) : value.toISOString();
      encryptedObject[encryptedKey] = encryptedValue;
    } else if (typeof value === 'object' && value !== null) {
      encryptedObject[encryptedKey] = encryptObject(value, keyLevel);
    } else if (typeof value === 'string') {
      const encryptedValue = isValueEncrypted ? encrypt(value) : value;
      encryptedObject[encryptedKey] = encryptedValue;
    } else {
      encryptedObject[encryptedKey] = value;
    }
  }
  return encryptedObject;
};

/**
 * Function to encrypt an array recursively based on encryption level.
 */
export const encryptArrayOfObjects = (arr: any, keyLevel: any) => {
  return arr.map((item: any) => {
    if (Array.isArray(item)) {
      return encryptArrayOfObjects(item, keyLevel);
    } else if (typeof item === 'object' && item !== null) {
      return encryptObject(item, keyLevel);
    } else if (typeof item === 'string' && keyLevel['value']) {
      return encrypt(item);
    } else {
      return item;
    }
  });
};

/**
 * Function to decrypt an object recursively based on encryption level.
 */
export const decryptObject = (obj: any, keyLevel: any) => {
  const decryptedObject: any = {};
  const isKeyEncrypted = keyLevel['key'];
  const isValueEncrypted = keyLevel['value'];

  for (const [key, value] of Object.entries(obj)) {
    const decryptedKey = isKeyEncrypted ? decrypt(key) : key;

    if (Array.isArray(value)) {
      decryptedObject[decryptedKey] = decryptArrayOfObjects(value, keyLevel);
    } else if (typeof value === 'object' && value !== null) {
      decryptedObject[decryptedKey] = decryptObject(value, keyLevel);
    } else if (typeof value === 'string') {
      decryptedObject[decryptedKey] = isValueEncrypted ? decrypt(value) : value;
    } else {
      decryptedObject[decryptedKey] = value;
    }
  }

  return decryptedObject;
};

/**
 * Function to decrypt an array recursively based on encryption level.
 */
export const decryptArrayOfObjects = (arr: any, keyLevel: any) => {
  return arr.map((item: any) => {
    if (Array.isArray(item)) {
      return decryptArrayOfObjects(item, keyLevel);
    } else if (typeof item === 'object' && item !== null) {
      return decryptObject(item, keyLevel);
    } else if (typeof item === 'string' && keyLevel['value']) {
      return decrypt(item);
    } else {
      return item;
    }
  });
};

// Encrypt an object by serializing it to a JSON string
export const encryptState = (data: any) => {
  const jsonString = JSON.stringify(data);
  return encrypt(jsonString);
};

// Decrypt and parse the JSON string back to an object
export const decryptState = (data: any) => {
  const decryptedText = decrypt(data);
  return JSON.parse(decryptedText);
};

export const encryptUrlData = (data: Object) => {
  try {
    return encodeURIComponent(encryptState(data));
  } catch (error) {
    console.log('URL Encryption Error', error);
    return "";
  }
};

export const decryptUrlData = (data: any) => {
  try {
    return data ? decryptState(decodeURIComponent(data)) : {};
  } catch (error) {
    console.error('Failed to decrypt URL data:', error);
    return {};
  }
};
