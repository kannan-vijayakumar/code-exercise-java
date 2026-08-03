package dev.urlshortener.exception;

public class AliasNotFoundException extends RuntimeException {

    public AliasNotFoundException(String alias) {
        super("No URL exists for alias '%s'".formatted(alias));
    }
}
