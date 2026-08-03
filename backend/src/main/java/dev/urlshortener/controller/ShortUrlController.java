package dev.urlshortener.controller;

import dev.urlshortener.dto.ShortenUrlRequest;
import dev.urlshortener.dto.ShortenUrlResponse;
import dev.urlshortener.service.ShortUrlService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
public class ShortUrlController {

    private final ShortUrlService shortUrlService;

    public ShortUrlController(ShortUrlService shortUrlService) {
        this.shortUrlService = shortUrlService;
    }

    @PostMapping("/shorten")
    @ResponseStatus(HttpStatus.CREATED)
    public ShortenUrlResponse shorten(@RequestBody ShortenUrlRequest request) {
        return shortUrlService.shorten(request);
    }
}
