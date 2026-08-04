package dev.urlshortener.controller;

import dev.urlshortener.dto.ShortenUrlRequest;
import dev.urlshortener.dto.ShortenUrlResponse;
import dev.urlshortener.dto.ShortenedUrlResponse;
import dev.urlshortener.service.ShortUrlService;
import java.net.URI;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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

    @GetMapping("/{alias}")
    public ResponseEntity<Void> redirect(@PathVariable String alias) {
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(shortUrlService.getOriginalUrl(alias)))
                .build();
    }

    @GetMapping("/urls")
    public List<ShortenedUrlResponse> listUrls() {
        return shortUrlService.listUrls();
    }

    @DeleteMapping("/{alias}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String alias) {
        shortUrlService.delete(alias);
    }
}
