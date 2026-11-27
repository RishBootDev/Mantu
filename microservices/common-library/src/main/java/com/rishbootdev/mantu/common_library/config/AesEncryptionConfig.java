package com.rishbootdev.mantu.common_library.config;

import org.springframework.security.crypto.encrypt.AesBytesEncryptor;
import org.springframework.security.crypto.encrypt.BytesEncryptor;
import org.springframework.security.crypto.keygen.KeyGenerators;

import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

public class AesEncryptionConfig {

    public BytesEncryptor masterKeyEncryptor(String masterKey) {
        byte[] masterKeyBytes = Base64.getDecoder().decode(masterKey);
        if (masterKeyBytes.length != 16 && masterKeyBytes.length != 24 && masterKeyBytes.length != 32) {
            try {
                masterKeyBytes = MessageDigest.getInstance("SHA-256").digest(masterKeyBytes);
            } catch (NoSuchAlgorithmException e) {
                throw new IllegalStateException("SHA-256 algorithm unavailable", e);
            }
        }
        SecretKeySpec masterDecKey = new SecretKeySpec(masterKeyBytes, "AES/GCM/NoPadding");
        return new AesBytesEncryptor(masterDecKey, KeyGenerators.secureRandom(12),
                AesBytesEncryptor.CipherAlgorithm.GCM);
    }
}
