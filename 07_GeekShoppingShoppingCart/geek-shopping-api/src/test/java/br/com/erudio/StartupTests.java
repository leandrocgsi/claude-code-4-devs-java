package br.com.erudio;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import br.com.erudio.integrationtests.testcontainers.AbstractIntegrationTest;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
class StartupTests extends AbstractIntegrationTest {

	@Test
	void contextLoads() {
	}

}
