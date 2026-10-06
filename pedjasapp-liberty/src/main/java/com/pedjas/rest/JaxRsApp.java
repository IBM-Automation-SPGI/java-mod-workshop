package com.pedjas.rest;

import jakarta.ws.rs.ApplicationPath;
import jakarta.ws.rs.core.Application;
import org.eclipse.microprofile.openapi.annotations.OpenAPIDefinition;
import org.eclipse.microprofile.openapi.annotations.info.Contact;
import org.eclipse.microprofile.openapi.annotations.info.Info;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

/**
 * Activación JAX-RS + definición OpenAPI para PedjasApp Liberty.
 *
 * Expone la API REST bajo /api/v1 con documentación MicroProfile OpenAPI 3.1.
 */
@ApplicationPath("/api/v1")
@OpenAPIDefinition(
    info = @Info(
        title       = "PedjasApp REST API",
        version     = "1.0",
        description = "API REST de PedjasApp modernizada en Open Liberty. "
                    + "Expone los recursos de catálogo de productos y gestión de pedidos.",
        contact     = @Contact(name = "Java Modernization Workshop")
    ),
    tags = {
        @Tag(name = "Productos", description = "Operaciones sobre el catálogo de productos"),
        @Tag(name = "Pedidos",   description = "Consulta y gestión de pedidos de clientes")
    }
)
public class JaxRsApp extends Application {
}
