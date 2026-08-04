package dev.urlshortener.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import dev.urlshortener.exception.InvalidAliasException;
import dev.urlshortener.exception.InvalidUrlException;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

class UrlValidationServiceTest {

    private final UrlValidationService urlValidationService = new UrlValidationService();

    @ParameterizedTest
    @MethodSource("validUrls")
    void normalizesAndValidatesFullUrl(String fullUrl, String expectedUrl) {
        assertThat(urlValidationService.normalizeAndValidateFullUrl(fullUrl))
                .isEqualTo(expectedUrl);
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", " ", "\t", "not-a-url", "ftp://example.com", "https://"})
    void rejectsMissingOrInvalidFullUrl(String fullUrl) {
        assertThatThrownBy(() -> urlValidationService.normalizeAndValidateFullUrl(fullUrl))
                .isInstanceOf(InvalidUrlException.class);
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"abc", "abc-123", "abc_123", "A1_"})
    void acceptsOptionalOrValidCustomAliases(String customAlias) {
        urlValidationService.validateCustomAlias(customAlias);
    }

    @ParameterizedTest
    @ValueSource(
            strings = {
                "",
                "ab",
                "has space",
                "invalid!",
                "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz"
            })
    void rejectsInvalidCustomAliases(String customAlias) {
        assertThatThrownBy(() -> urlValidationService.validateCustomAlias(customAlias))
                .isInstanceOf(InvalidAliasException.class)
                .hasMessage(
                        "Alias must be 3–50 characters long and contain only letters, numbers,"
                                + " hyphens (-), or underscores (_).");
    }

    @ParameterizedTest
    @MethodSource("reservedAliases")
    void rejectsReservedAliases(String alias) {
        assertThatThrownBy(() -> urlValidationService.validateCustomAlias(alias))
                .isInstanceOf(InvalidAliasException.class)
                .hasMessageContaining("reserved");
    }

    private static Stream<String> reservedAliases() {
        return UrlValidationService.RESERVED_ALIASES.stream();
    }

    private static Stream<Arguments> validUrls() {
        return Stream.of(
                Arguments.of("example.com", "https://example.com"),
                Arguments.of(
                        " https://example.com/path?query=value ",
                        "https://example.com/path?query=value"),
                Arguments.of("http://example.com", "http://example.com"));
    }
}
