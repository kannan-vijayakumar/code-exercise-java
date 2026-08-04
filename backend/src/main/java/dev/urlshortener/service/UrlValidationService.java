package dev.urlshortener.service;

import dev.urlshortener.exception.InvalidAliasException;
import dev.urlshortener.exception.InvalidUrlException;
import java.util.regex.Pattern;
import org.apache.commons.validator.routines.UrlValidator;
import org.springframework.stereotype.Service;

@Service
public class UrlValidationService {

    private static final Pattern ALIAS_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]{3,50}$");
    private static final Pattern SCHEME_PREFIX = Pattern.compile("^[a-zA-Z][a-zA-Z0-9+.-]*://");
    private static final UrlValidator URL_VALIDATOR =
            new UrlValidator(new String[] {"http", "https"});

    public String normalizeAndValidateFullUrl(String fullUrl) {
        if (fullUrl == null || fullUrl.isBlank()) {
            throw new InvalidUrlException("A full URL is required");
        }

        String normalizedFullUrl = fullUrl.trim();
        if (!SCHEME_PREFIX.matcher(normalizedFullUrl).find()) {
            normalizedFullUrl = "https://" + normalizedFullUrl;
        }

        if (!URL_VALIDATOR.isValid(normalizedFullUrl)) {
            throw new InvalidUrlException(
                    "URL must use http or https and include a valid host such as example.com");
        }
        return normalizedFullUrl;
    }

    public void validateCustomAlias(String customAlias) {
        if (customAlias == null) {
            return;
        }

        if (!ALIAS_PATTERN.matcher(customAlias).matches()) {
            throw new InvalidAliasException(
                    "Alias must contain 3 to 50 letters, numbers, hyphens, or underscores");
        }
    }
}
