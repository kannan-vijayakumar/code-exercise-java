package dev.urlshortener.service;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public class RandomAliasGenerator implements AliasGenerator {

    private static final char[] ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".toCharArray();
    private static final int ALIAS_LENGTH = 8;

    private final SecureRandom random = new SecureRandom();

    @Override
    public String generate() {
        StringBuilder alias = new StringBuilder(ALIAS_LENGTH);
        for (int index = 0; index < ALIAS_LENGTH; index++) {
            alias.append(ALPHABET[random.nextInt(ALPHABET.length)]);
        }
        return alias.toString();
    }
}
