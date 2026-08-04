package dev.urlshortener.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class RandomAliasGeneratorTest {

    @Test
    void generatesAnEightCharacterAlphanumericAlias() {
        String alias = new RandomAliasGenerator().generate();

        assertThat(alias).matches("[a-zA-Z0-9]{8}");
    }
}
