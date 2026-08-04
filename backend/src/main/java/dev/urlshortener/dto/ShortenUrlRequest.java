package dev.urlshortener.dto;

public record ShortenUrlRequest(String fullUrl, String customAlias) {}
