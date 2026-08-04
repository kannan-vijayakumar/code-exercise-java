package dev.urlshortener.service;

import dev.urlshortener.config.ShortUrlProperties;
import dev.urlshortener.dto.ShortenUrlRequest;
import dev.urlshortener.dto.ShortenUrlResponse;
import dev.urlshortener.dto.ShortenedUrlResponse;
import dev.urlshortener.entity.ShortenedUrl;
import dev.urlshortener.exception.AliasAlreadyExistsException;
import dev.urlshortener.exception.AliasGenerationException;
import dev.urlshortener.exception.AliasNotFoundException;
import dev.urlshortener.repository.ShortenedUrlRepository;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ShortUrlService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ShortUrlService.class);

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
            ShortUrlProperties shortUrlProperties) {
        this.shortenedUrlRepository = shortenedUrlRepository;
        this.urlValidationService = urlValidationService;
        this.aliasGenerator = aliasGenerator;
        this.shortUrlProperties = shortUrlProperties;
    }

    public ShortenUrlResponse shorten(ShortenUrlRequest request) {
        String fullUrl = urlValidationService.normalizeAndValidateFullUrl(request.fullUrl());
        urlValidationService.validateCustomAlias(request.customAlias());

        if (request.customAlias() != null) {
            ShortenUrlResponse response = saveCustomAlias(request.customAlias(), fullUrl);
            LOGGER.info("Created custom short URL alias={}", request.customAlias());
            return response;
        }

        return shortenedUrlRepository
                .findFirstByOriginalUrlOrderByCreatedAtAsc(fullUrl)
                .map(
                        shortenedUrl -> {
                            LOGGER.info(
                                    "Reused existing short URL alias={}", shortenedUrl.getAlias());
                            return toResponse(shortenedUrl.getAlias());
                        })
                .orElseGet(() -> saveGeneratedAlias(fullUrl));
    }

    public String getOriginalUrl(String alias) {
        return shortenedUrlRepository
                .findByAlias(alias)
                .map(ShortenedUrl::getOriginalUrl)
                .orElseThrow(() -> new AliasNotFoundException(alias));
    }

    public List<ShortenedUrlResponse> listUrls() {
        return shortenedUrlRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(
                        shortenedUrl ->
                                new ShortenedUrlResponse(
                                        shortenedUrl.getAlias(),
                                        shortenedUrl.getOriginalUrl(),
                                        "%s/%s"
                                                .formatted(
                                                        shortUrlProperties.getBaseUrl(),
                                                        shortenedUrl.getAlias())))
                .toList();
    }

    @Transactional
    public void delete(String alias) {
        ShortenedUrl shortenedUrl =
                shortenedUrlRepository
                        .findByAlias(alias)
                        .orElseThrow(() -> new AliasNotFoundException(alias));
        shortenedUrlRepository.delete(shortenedUrl);
        LOGGER.info("Deleted short URL alias={}", alias);
    }

    private ShortenUrlResponse saveCustomAlias(String alias, String fullUrl) {
        if (shortenedUrlRepository.existsByAlias(alias)) {
            throw new AliasAlreadyExistsException(alias);
        }

        try {
            shortenedUrlRepository.saveAndFlush(new ShortenedUrl(alias, fullUrl));
        } catch (DataIntegrityViolationException ignored) {
            LOGGER.debug("Custom alias creation conflicted alias={}", alias, ignored);
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
                    LOGGER.info("Created generated short URL alias={}", alias);
                    return toResponse(alias);
                } catch (DataIntegrityViolationException ignored) {
                    LOGGER.debug(
                            "Generated alias creation conflicted alias={} attempt={}",
                            alias,
                            attempt + 1,
                            ignored);
                }
            } else {
                LOGGER.debug(
                        "Generated alias was already in use alias={} attempt={}",
                        alias,
                        attempt + 1);
            }
        }

        throw new AliasGenerationException();
    }

    private ShortenUrlResponse toResponse(String alias) {
        return new ShortenUrlResponse("%s/%s".formatted(shortUrlProperties.getBaseUrl(), alias));
    }
}
