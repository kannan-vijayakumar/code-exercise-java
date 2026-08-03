package dev.urlshortener.exception;

public class AliasAlreadyExistsException extends RuntimeException {

    public AliasAlreadyExistsException(String alias) {
        super("The alias '%s' is already in use".formatted(alias));
    }
}
