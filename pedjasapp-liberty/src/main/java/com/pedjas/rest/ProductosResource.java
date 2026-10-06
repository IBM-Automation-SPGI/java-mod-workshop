package com.pedjas.rest;

import com.pedjas.entity.Producto;
import com.pedjas.service.CatalogoService;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import jakarta.ejb.EJB;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

/**
 * Recurso REST para el catálogo de productos.
 * Ruta base: /api/v1/productos
 */
@Path("/productos")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Productos")
public class ProductosResource {

    @EJB
    private CatalogoService catalogoService;

    @GET
    @Operation(
        summary     = "Listar productos",
        description = "Devuelve todos los productos del catálogo, opcionalmente filtrados por categoría."
    )
    @APIResponse(
        responseCode = "200",
        description  = "Lista de productos",
        content      = @Content(mediaType = MediaType.APPLICATION_JSON,
                                schema    = @Schema(implementation = Producto.class))
    )
    public Response listar(
            @Parameter(description = "Filtrar por categoría (ELECTRONICA, HOGAR, ROPA, ALIMENTACION)")
            @QueryParam("categoria") String categoria) {

        List<Producto> productos = (categoria != null && !categoria.isBlank())
            ? catalogoService.obtenerPorCategoria(categoria.toUpperCase())
            : catalogoService.obtenerTodos();

        return Response.ok(productos).build();
    }

    @GET
    @Path("/{id}")
    @Operation(
        summary     = "Obtener producto por ID",
        description = "Devuelve el detalle de un producto concreto."
    )
    @APIResponse(responseCode = "200",  description = "Producto encontrado",
                 content = @Content(mediaType = MediaType.APPLICATION_JSON,
                                    schema    = @Schema(implementation = Producto.class)))
    @APIResponse(responseCode = "404",  description = "Producto no encontrado")
    public Response obtener(
            @Parameter(description = "ID del producto", required = true)
            @PathParam("id") Long id) {

        Producto producto = catalogoService.buscarPorId(id);
        if (producto == null) {
            return Response.status(Response.Status.NOT_FOUND)
                           .entity("{\"error\":\"Producto no encontrado: " + id + "\"}")
                           .build();
        }
        return Response.ok(producto).build();
    }
}
