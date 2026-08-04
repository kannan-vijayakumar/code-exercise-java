package dev.urlshortener.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.urlshortener.repository.ShortenedUrlRepository;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class ShortUrlControllerIntegrationTest {

    @Container @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16").withDatabaseName("url_shortener_test");

    @Autowired private MockMvc mockMvc;
    @Autowired private ShortenedUrlRepository shortenedUrlRepository;

    @BeforeEach
    void clearMappings() {
        shortenedUrlRepository.deleteAll();
    }

    @Test
    void createsAndListsACustomShortUrl() throws Exception {
        mockMvc.perform(
                        post("/shorten")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"fullUrl":"example.com","customAlias":"docs"}
                                        """))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.shortUrl").value("http://localhost:8080/docs"));

        mockMvc.perform(get("/urls"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].alias").value("docs"))
                .andExpect(jsonPath("$[0].fullUrl").value("https://example.com"))
                .andExpect(jsonPath("$[0].shortUrl").value("http://localhost:8080/docs"));
    }

    @Test
    void redirectsKnownAliasesToTheirOriginalUrl() throws Exception {
        createShortUrl("docs", "https://example.com/documentation");

        mockMvc.perform(get("/docs"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "https://example.com/documentation"));
    }

    @Test
    void rejectsDuplicateCustomAliases() throws Exception {
        createShortUrl("docs", "https://example.com");

        mockMvc.perform(
                        post("/shorten")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"fullUrl":"https://different.com","customAlias":"docs"}
                                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ALIAS_ALREADY_EXISTS"))
                .andExpect(jsonPath("$.message").value("The alias 'docs' is already in use"));
    }

    @ParameterizedTest
    @MethodSource("invalidShortenRequests")
    void rejectsInvalidShortenRequests(String requestBody, String expectedErrorCode)
            throws Exception {
        mockMvc.perform(
                        post("/shorten")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(requestBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(expectedErrorCode));
    }

    @Test
    void deletesAnExistingShortUrlAndReturnsNotFoundAfterward() throws Exception {
        createShortUrl("docs", "https://example.com");

        mockMvc.perform(delete("/docs")).andExpect(status().isNoContent());

        mockMvc.perform(get("/docs"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ALIAS_NOT_FOUND"));
    }

    @Test
    void returnsNotFoundForUnknownAliases() throws Exception {
        mockMvc.perform(get("/missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ALIAS_NOT_FOUND"));

        mockMvc.perform(delete("/missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ALIAS_NOT_FOUND"));
    }

    private void createShortUrl(String alias, String fullUrl) throws Exception {
        mockMvc.perform(
                        post("/shorten")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                        {"fullUrl":"%s","customAlias":"%s"}
                                        """
                                                .formatted(fullUrl, alias)))
                .andExpect(status().isCreated());
    }

    private static Stream<Arguments> invalidShortenRequests() {
        return Stream.of(
                Arguments.of("{\"fullUrl\":\"not-a-url\"}", "INVALID_URL"),
                Arguments.of(
                        "{\"fullUrl\":\"https://example.com\",\"customAlias\":\"ab\"}",
                        "INVALID_ALIAS"),
                Arguments.of("{", "INVALID_REQUEST"));
    }
}
