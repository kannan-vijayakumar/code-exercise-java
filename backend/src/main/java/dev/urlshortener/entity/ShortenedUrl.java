package dev.urlshortener.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "shortened_urls")
public class ShortenedUrl {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String alias;

    @Column(name = "original_url", nullable = false)
    private String originalUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected ShortenedUrl() {}

    public ShortenedUrl(String alias, String originalUrl) {
        this.alias = alias;
        this.originalUrl = originalUrl;
    }

    public UUID getId() {
        return id;
    }

    public String getAlias() {
        return alias;
    }

    public String getOriginalUrl() {
        return originalUrl;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}
