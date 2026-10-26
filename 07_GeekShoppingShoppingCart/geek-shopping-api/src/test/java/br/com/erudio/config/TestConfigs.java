package br.com.erudio.config;

public interface TestConfigs {

    int SERVER_PORT = 8888;

    String HEADER_PARAM_ORIGIN = "Origin";

    String ORIGIN_FRONT = "http://localhost:3000";
    String ORIGIN_LOCAL = "http://localhost:8080";
    String ORIGIN_NOT_ALLOWED = "https://www.semeru.com.br";
}
