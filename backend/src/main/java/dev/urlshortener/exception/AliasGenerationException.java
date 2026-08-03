package dev.urlshortener.exception;

public class AliasGenerationException extends RuntimeException {

    public AliasGenerationException() {
        super("Unable to generate a unique alias");
    }
}
