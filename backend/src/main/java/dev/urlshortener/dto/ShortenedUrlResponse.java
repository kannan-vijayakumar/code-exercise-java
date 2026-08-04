package dev.urlshortener.dto;

public record ShortenedUrlResponse(String alias, String fullUrl, String shortUrl) {}
