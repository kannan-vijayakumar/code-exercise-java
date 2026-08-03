package dev.urlshortener.repository;

import dev.urlshortener.entity.ShortenedUrl;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ShortenedUrlRepository extends JpaRepository<ShortenedUrl, UUID> {

    Optional<ShortenedUrl> findByAlias(String alias);

    boolean existsByAlias(String alias);
}
