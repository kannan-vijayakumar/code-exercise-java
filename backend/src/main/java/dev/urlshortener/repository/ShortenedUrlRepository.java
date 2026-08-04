package dev.urlshortener.repository;

import dev.urlshortener.entity.ShortenedUrl;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShortenedUrlRepository extends JpaRepository<ShortenedUrl, UUID> {

    Optional<ShortenedUrl> findByAlias(String alias);

    Optional<ShortenedUrl> findFirstByOriginalUrlOrderByCreatedAtAsc(String originalUrl);

    List<ShortenedUrl> findAllByOrderByCreatedAtDesc();

    boolean existsByAlias(String alias);
}
