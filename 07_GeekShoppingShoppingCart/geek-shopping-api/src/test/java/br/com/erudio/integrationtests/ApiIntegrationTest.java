package br.com.erudio.integrationtests;

import org.springframework.boot.test.context.SpringBootTest;

import br.com.erudio.integrationtests.testcontainers.AbstractIntegrationTest;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
public abstract class ApiIntegrationTest extends AbstractIntegrationTest {

    protected static final JsonMapper objectMapper = ProductApi.MAPPER;
}
