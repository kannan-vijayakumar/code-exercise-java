package dev.urlshortener.service;

import dev.urlshortener.exception.InvalidAliasException;
import dev.urlshortener.exception.InvalidUrlException;
import java.util.Set;
import java.util.regex.Pattern;
import org.apache.commons.validator.routines.UrlValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class UrlValidationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(UrlValidationService.class);
    private static final Pattern ALIAS_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]{3,50}$");
    private static final Pattern SCHEME_PREFIX = Pattern.compile("^[a-zA-Z][a-zA-Z0-9+.-]*://");
    private static final UrlValidator URL_VALIDATOR =
            new UrlValidator(new String[] {"http", "https"});
    static final Set<String> RESERVED_ALIASES = Set.of("shorten", "urls");

    public String normalizeAndValidateFullUrl(String fullUrl) {
        if (fullUrl == null || fullUrl.isBlank()) {
            LOGGER.debug("Rejected full URL: reason=missing");
            throw new InvalidUrlException("A full URL is required");
        }

        String normalizedFullUrl = fullUrl.trim();
        if (!SCHEME_PREFIX.matcher(normalizedFullUrl).find()) {
            normalizedFullUrl = "https://" + normalizedFullUrl;
        }

        if (!URL_VALIDATOR.isValid(normalizedFullUrl)) {
            LOGGER.debug("Rejected full URL: reason=invalid_format length={}", fullUrl.length());
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
            LOGGER.debug(
                    "Rejected custom alias: reason=invalid_format length={}", customAlias.length());
            throw new InvalidAliasException(
                    "Alias must be 3–50 characters long and contain only letters, numbers, hyphens"
                            + " (-), or underscores (_).");
        }

        if (RESERVED_ALIASES.contains(customAlias.toLowerCase())) {
            LOGGER.debug("Rejected custom alias: reason=reserved alias={}", customAlias);
            throw new InvalidAliasException(
                    "Alias '%s' is reserved and cannot be used.".formatted(customAlias));
        }
    }
}
