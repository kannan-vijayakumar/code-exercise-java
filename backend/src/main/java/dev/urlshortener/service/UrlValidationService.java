package dev.urlshortener.service;

import dev.urlshortener.exception.InvalidAliasException;
import dev.urlshortener.exception.InvalidUrlException;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class UrlValidationService {

    private static final Pattern ALIAS_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]{3,50}$");

    public void validateFullUrl(String fullUrl) {
        if (fullUrl == null || fullUrl.isBlank()) {
            throw new InvalidUrlException("A full URL is required");
        }

        URI uri = parseUrl(fullUrl);
        if (!isHttpUrlWithHost(uri)) {
            throw new InvalidUrlException("URL must use http or https and include a host");
        }
    }

    public void validateCustomAlias(String customAlias) {
        if (customAlias == null) {
            return;
        }

        if (!ALIAS_PATTERN.matcher(customAlias).matches()) {
            throw new InvalidAliasException(
                    "Alias must contain 3 to 50 letters, numbers, hyphens, or underscores"
            );
        }
    }

    private URI parseUrl(String fullUrl) {
        try {
            return new URI(fullUrl);
        } catch (URISyntaxException exception) {
            throw new InvalidUrlException("URL must be a valid absolute URL", exception);
        }
    }

    private boolean isHttpUrlWithHost(URI uri) {
        if (uri.getHost() == null) {
            return false;
        }

        String scheme = uri.getScheme();
        return scheme != null && ("http".equals(scheme.toLowerCase(Locale.ROOT))
                || "https".equals(scheme.toLowerCase(Locale.ROOT)));
    }
}
