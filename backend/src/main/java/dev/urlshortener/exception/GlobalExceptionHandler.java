package dev.urlshortener.exception;

import dev.urlshortener.dto.ApiErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(InvalidUrlException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidUrl(InvalidUrlException exception) {
        LOGGER.info("Request rejected code=INVALID_URL", exception);
        return error(HttpStatus.BAD_REQUEST, "INVALID_URL", exception.getMessage());
    }

    @ExceptionHandler(InvalidAliasException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidAlias(InvalidAliasException exception) {
        LOGGER.info("Request rejected code=INVALID_ALIAS", exception);
        return error(HttpStatus.BAD_REQUEST, "INVALID_ALIAS", exception.getMessage());
    }

    @ExceptionHandler(AliasAlreadyExistsException.class)
    public ResponseEntity<ApiErrorResponse> handleAliasAlreadyExists(
            AliasAlreadyExistsException exception) {
        LOGGER.info("Request rejected code=ALIAS_ALREADY_EXISTS", exception);
        return error(HttpStatus.BAD_REQUEST, "ALIAS_ALREADY_EXISTS", exception.getMessage());
    }

    @ExceptionHandler(AliasNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleAliasNotFound(AliasNotFoundException exception) {
        LOGGER.info("Request rejected code=ALIAS_NOT_FOUND", exception);
        return error(HttpStatus.NOT_FOUND, "ALIAS_NOT_FOUND", exception.getMessage());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadableRequest(
            HttpMessageNotReadableException exception) {
        LOGGER.info("Request rejected code=INVALID_REQUEST", exception);
        return error(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "Request body must be valid JSON");
    }

    @ExceptionHandler(AliasGenerationException.class)
    public ResponseEntity<ApiErrorResponse> handleAliasGenerationFailure(
            AliasGenerationException exception) {
        LOGGER.error("Unable to generate a unique short URL alias", exception);
        return error(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "ALIAS_GENERATION_FAILED",
                exception.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpectedException(Exception exception) {
        LOGGER.error("Unexpected request failure", exception);
        return error(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "INTERNAL_SERVER_ERROR",
                "An unexpected error occurred");
    }

    private ResponseEntity<ApiErrorResponse> error(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).body(new ApiErrorResponse(code, message));
    }
}
