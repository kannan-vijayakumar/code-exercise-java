package dev.urlshortener.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import dev.urlshortener.config.ShortUrlProperties;
import dev.urlshortener.dto.ShortenUrlRequest;
import dev.urlshortener.dto.ShortenedUrlResponse;
import dev.urlshortener.entity.ShortenedUrl;
import dev.urlshortener.exception.AliasAlreadyExistsException;
import dev.urlshortener.exception.AliasGenerationException;
import dev.urlshortener.exception.AliasNotFoundException;
import dev.urlshortener.repository.ShortenedUrlRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

@ExtendWith(MockitoExtension.class)
class ShortUrlServiceTest {

    private static final String FULL_URL = "https://example.com";

    @Mock private ShortenedUrlRepository shortenedUrlRepository;
    @Mock private UrlValidationService urlValidationService;
    @Mock private AliasGenerator aliasGenerator;
    @Mock private ShortUrlProperties shortUrlProperties;

    private ShortUrlService shortUrlService;

    @BeforeEach
    void setUp() {
        shortUrlService =
                new ShortUrlService(
                        shortenedUrlRepository,
                        urlValidationService,
                        aliasGenerator,
                        shortUrlProperties);
    }

    @Test
    void savesCustomAlias() {
        stubBaseUrl();
        when(urlValidationService.normalizeAndValidateFullUrl("example.com")).thenReturn(FULL_URL);
        when(shortenedUrlRepository.existsByAlias("docs")).thenReturn(false);

        assertThat(shortUrlService.shorten(new ShortenUrlRequest("example.com", "docs")).shortUrl())
                .isEqualTo("https://short.example/docs");

        ArgumentCaptor<ShortenedUrl> shortenedUrlCaptor =
                ArgumentCaptor.forClass(ShortenedUrl.class);
        verify(shortenedUrlRepository).saveAndFlush(shortenedUrlCaptor.capture());
        assertThat(shortenedUrlCaptor.getValue().getAlias()).isEqualTo("docs");
        assertThat(shortenedUrlCaptor.getValue().getOriginalUrl()).isEqualTo(FULL_URL);
        verify(urlValidationService).validateCustomAlias("docs");
    }

    @Test
    void rejectsAnExistingCustomAliasBeforeSaving() {
        when(urlValidationService.normalizeAndValidateFullUrl("example.com")).thenReturn(FULL_URL);
        when(shortenedUrlRepository.existsByAlias("docs")).thenReturn(true);

        assertThatThrownBy(
                        () -> shortUrlService.shorten(new ShortenUrlRequest("example.com", "docs")))
                .isInstanceOf(AliasAlreadyExistsException.class);

        verify(shortenedUrlRepository, never()).saveAndFlush(any());
    }

    @Test
    void convertsCustomAliasUniquenessRaceToConflict() {
        when(urlValidationService.normalizeAndValidateFullUrl("example.com")).thenReturn(FULL_URL);
        when(shortenedUrlRepository.existsByAlias("docs")).thenReturn(false);
        when(shortenedUrlRepository.saveAndFlush(any(ShortenedUrl.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate alias"));

        assertThatThrownBy(
                        () -> shortUrlService.shorten(new ShortenUrlRequest("example.com", "docs")))
                .isInstanceOf(AliasAlreadyExistsException.class);
    }

    @Test
    void returnsTheFirstExistingGeneratedMappingForTheSameUrl() {
        stubBaseUrl();
        when(urlValidationService.normalizeAndValidateFullUrl("example.com")).thenReturn(FULL_URL);
        when(shortenedUrlRepository.findFirstByOriginalUrlOrderByCreatedAtAsc(FULL_URL))
                .thenReturn(Optional.of(new ShortenedUrl("existing", FULL_URL)));

        assertThat(shortUrlService.shorten(new ShortenUrlRequest("example.com", null)).shortUrl())
                .isEqualTo("https://short.example/existing");

        verifyNoInteractions(aliasGenerator);
        verify(shortenedUrlRepository, never()).saveAndFlush(any());
    }

    @Test
    void generatesAndSavesAnAvailableAlias() {
        stubBaseUrl();
        when(urlValidationService.normalizeAndValidateFullUrl("example.com")).thenReturn(FULL_URL);
        when(shortenedUrlRepository.findFirstByOriginalUrlOrderByCreatedAtAsc(FULL_URL))
                .thenReturn(Optional.empty());
        when(aliasGenerator.generate()).thenReturn("taken", "available");
        when(shortenedUrlRepository.existsByAlias("taken")).thenReturn(true);
        when(shortenedUrlRepository.existsByAlias("available")).thenReturn(false);

        assertThat(shortUrlService.shorten(new ShortenUrlRequest("example.com", null)).shortUrl())
                .isEqualTo("https://short.example/available");

        verify(aliasGenerator, times(2)).generate();
        ArgumentCaptor<ShortenedUrl> shortenedUrlCaptor =
                ArgumentCaptor.forClass(ShortenedUrl.class);
        verify(shortenedUrlRepository).saveAndFlush(shortenedUrlCaptor.capture());
        assertThat(shortenedUrlCaptor.getValue().getAlias()).isEqualTo("available");
    }

    @Test
    void retriesWhenAnotherRequestClaimsAGeneratedAlias() {
        stubBaseUrl();
        when(urlValidationService.normalizeAndValidateFullUrl("example.com")).thenReturn(FULL_URL);
        when(shortenedUrlRepository.findFirstByOriginalUrlOrderByCreatedAtAsc(FULL_URL))
                .thenReturn(Optional.empty());
        when(aliasGenerator.generate()).thenReturn("first", "second");
        when(shortenedUrlRepository.existsByAlias("first")).thenReturn(false);
        when(shortenedUrlRepository.existsByAlias("second")).thenReturn(false);
        when(shortenedUrlRepository.saveAndFlush(any(ShortenedUrl.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate alias"))
                .thenReturn(new ShortenedUrl("second", FULL_URL));

        assertThat(shortUrlService.shorten(new ShortenUrlRequest("example.com", null)).shortUrl())
                .isEqualTo("https://short.example/second");

        verify(aliasGenerator, times(2)).generate();
        verify(shortenedUrlRepository, times(2)).saveAndFlush(any(ShortenedUrl.class));
    }

    @Test
    void failsAfterFiveUnavailableGeneratedAliases() {
        when(urlValidationService.normalizeAndValidateFullUrl("example.com")).thenReturn(FULL_URL);
        when(shortenedUrlRepository.findFirstByOriginalUrlOrderByCreatedAtAsc(FULL_URL))
                .thenReturn(Optional.empty());
        when(aliasGenerator.generate()).thenReturn("one", "two", "three", "four", "five");
        when(shortenedUrlRepository.existsByAlias(any())).thenReturn(true);

        assertThatThrownBy(
                        () -> shortUrlService.shorten(new ShortenUrlRequest("example.com", null)))
                .isInstanceOf(AliasGenerationException.class);

        verify(aliasGenerator, times(5)).generate();
        verify(shortenedUrlRepository, never()).saveAndFlush(any());
    }

    @Test
    void returnsOriginalUrlForKnownAlias() {
        when(shortenedUrlRepository.findByAlias("docs"))
                .thenReturn(Optional.of(new ShortenedUrl("docs", FULL_URL)));

        assertThat(shortUrlService.getOriginalUrl("docs")).isEqualTo(FULL_URL);
    }

    @Test
    void throwsWhenAliasDoesNotExist() {
        when(shortenedUrlRepository.findByAlias("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> shortUrlService.getOriginalUrl("missing"))
                .isInstanceOf(AliasNotFoundException.class);
    }

    @Test
    void listsUrlsFromNewestToOldestRepositoryOrder() {
        stubBaseUrl();
        when(shortenedUrlRepository.findAllByOrderByCreatedAtDesc())
                .thenReturn(
                        List.of(
                                new ShortenedUrl("new", "https://new.example"),
                                new ShortenedUrl("old", "https://old.example")));

        assertThat(shortUrlService.listUrls())
                .containsExactly(
                        new ShortenedUrlResponse(
                                "new", "https://new.example", "https://short.example/new"),
                        new ShortenedUrlResponse(
                                "old", "https://old.example", "https://short.example/old"));
    }

    @Test
    void deletesKnownAlias() {
        ShortenedUrl shortenedUrl = new ShortenedUrl("docs", FULL_URL);
        when(shortenedUrlRepository.findByAlias("docs")).thenReturn(Optional.of(shortenedUrl));

        shortUrlService.delete("docs");

        verify(shortenedUrlRepository).delete(shortenedUrl);
    }

    @Test
    void throwsWhenDeletingAnUnknownAlias() {
        when(shortenedUrlRepository.findByAlias("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> shortUrlService.delete("missing"))
                .isInstanceOf(AliasNotFoundException.class);
    }

    private void stubBaseUrl() {
        when(shortUrlProperties.getBaseUrl()).thenReturn("https://short.example");
    }
}
