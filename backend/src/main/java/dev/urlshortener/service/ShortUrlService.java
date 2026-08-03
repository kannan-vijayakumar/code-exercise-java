package dev.urlshortener.service;

import dev.urlshortener.config.ShortUrlProperties;
import dev.urlshortener.dto.ShortenUrlRequest;
import dev.urlshortener.dto.ShortenUrlResponse;
import dev.urlshortener.entity.ShortenedUrl;
import dev.urlshortener.exception.AliasAlreadyExistsException;
import dev.urlshortener.exception.AliasGenerationException;
import dev.urlshortener.repository.ShortenedUrlRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ShortUrlService {

    // With 62^8 possible aliases (~218 trillion), 5 retries is more than sufficient
    // unless the alias space is nearly exhausted.
    private static final int MAX_GENERATION_ATTEMPTS = 5;

    private final ShortenedUrlRepository shortenedUrlRepository;
    private final UrlValidationService urlValidationService;
    private final AliasGenerator aliasGenerator;
    private final ShortUrlProperties shortUrlProperties;

    public ShortUrlService(
            ShortenedUrlRepository shortenedUrlRepository,
            UrlValidationService urlValidationService,
            AliasGenerator aliasGenerator,
            ShortUrlProperties shortUrlProperties
    ) {
        this.shortenedUrlRepository = shortenedUrlRepository;
        this.urlValidationService = urlValidationService;
        this.aliasGenerator = aliasGenerator;
        this.shortUrlProperties = shortUrlProperties;
    }

    public ShortenUrlResponse shorten(ShortenUrlRequest request) {
        urlValidationService.validateFullUrl(request.fullUrl());
        urlValidationService.validateCustomAlias(request.customAlias());

        return Optional.ofNullable(request.customAlias())
                .map(alias -> saveCustomAlias(alias, request.fullUrl()))
                .orElseGet(() -> saveGeneratedAlias(request.fullUrl()));
    }

    private ShortenUrlResponse saveCustomAlias(String alias, String fullUrl) {
        if (shortenedUrlRepository.existsByAlias(alias)) {
            throw new AliasAlreadyExistsException(alias);
        }

        try {
            shortenedUrlRepository.saveAndFlush(new ShortenedUrl(alias, fullUrl));
        } catch (DataIntegrityViolationException ignored) {
            throw new AliasAlreadyExistsException(alias);
        }
        return toResponse(alias);
    }

    private ShortenUrlResponse saveGeneratedAlias(String fullUrl) {
        for (int attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
            String alias = aliasGenerator.generate();
            if (!shortenedUrlRepository.existsByAlias(alias)) {
                try {
                    shortenedUrlRepository.saveAndFlush(new ShortenedUrl(alias, fullUrl));
                    return toResponse(alias);
                } catch (DataIntegrityViolationException ignored) {
                    // Concurrent request took this alias; retry with a new one.
                }
            }
        }

        throw new AliasGenerationException();
    }

    private ShortenUrlResponse toResponse(String alias) {
        return new ShortenUrlResponse("%s/%s".formatted(shortUrlProperties.getBaseUrl(), alias));
    }
}
