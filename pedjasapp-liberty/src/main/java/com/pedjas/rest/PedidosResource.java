package com.pedjas.rest;

import com.pedjas.entity.Pedido;
import com.pedjas.service.PedidoService;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.parameters.RequestBody;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import jakarta.ejb.EJB;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.Map;

/**
 * Recurso REST para pedidos.
 * Ruta base: /api/v1/pedidos
 */
@Path("/pedidos")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Pedidos")
public class PedidosResource {

    @EJB
    private PedidoService pedidoService;

    @GET
    @Operation(
        summary     = "Listar pedidos de un cliente",
        description = "Devuelve todos los pedidos del cliente indicado, ordenados por fecha descendente."
    )
    @APIResponse(responseCode = "200", description = "Lista de pedidos",
                 content = @Content(mediaType = MediaType.APPLICATION_JSON,
                                    schema    = @Schema(implementation = Pedido.class)))
    @APIResponse(responseCode = "400", description = "Parámetro clienteId obligatorio")
    public Response listar(
            @Parameter(description = "ID del cliente", required = true)
            @QueryParam("clienteId") Long clienteId) {

        if (clienteId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                           .entity("{\"error\":\"El parámetro clienteId es obligatorio\"}")
                           .build();
        }
        List<Pedido> pedidos = pedidoService.obtenerPedidosCliente(clienteId);
        return Response.ok(pedidos).build();
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Operation(
        summary     = "Crear pedido",
        description = "Crea un nuevo pedido para el cliente y producto indicados. "
                    + "Descuenta automáticamente el stock del producto."
    )
    @RequestBody(
        description = "Datos del pedido a crear",
        required    = true,
        content     = @Content(mediaType = MediaType.APPLICATION_JSON,
                               schema    = @Schema(example =
                                   "{\"clienteId\": 1, \"productoId\": 3, \"cantidad\": 2}"))
    )
    @APIResponse(responseCode = "201", description = "Pedido creado correctamente")
    @APIResponse(responseCode = "400", description = "Datos inválidos o stock insuficiente")
    public Response crear(Map<String, Object> body) {
        try {
            if (body == null || !body.containsKey("clienteId")
                    || !body.containsKey("productoId") || !body.containsKey("cantidad")) {
                return Response.status(Response.Status.BAD_REQUEST)
                               .entity("{\"error\":\"Campos obligatorios: clienteId, productoId, cantidad\"}")
                               .build();
            }
            Long clienteId  = Long.valueOf(body.get("clienteId").toString());
            Long productoId = Long.valueOf(body.get("productoId").toString());
            int  cantidad   = Integer.parseInt(body.get("cantidad").toString());

            Pedido pedido = pedidoService.crearPedido(clienteId, productoId, cantidad);
            return Response.status(Response.Status.CREATED).entity(
                Map.of("id", pedido.getId(), "estado", pedido.getEstado())
            ).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                           .entity("{\"error\":\"" + e.getMessage() + "\"}")
                           .build();
        }
    }

    @PUT
    @Path("/{id}/estado")
    @Consumes(MediaType.APPLICATION_JSON)
    @Operation(
        summary     = "Actualizar estado de un pedido",
        description = "Cambia el estado de un pedido. Estados válidos: PENDIENTE, PROCESADO, ENVIADO, ENTREGADO, CANCELADO."
    )
    @RequestBody(
        description = "Nuevo estado",
        required    = true,
        content     = @Content(mediaType = MediaType.APPLICATION_JSON,
                               schema    = @Schema(example = "{\"estado\": \"ENVIADO\"}"))
    )
    @APIResponse(responseCode = "200", description = "Estado actualizado")
    @APIResponse(responseCode = "400", description = "Estado inválido o pedido no encontrado")
    public Response actualizarEstado(
            @Parameter(description = "ID del pedido", required = true)
            @PathParam("id") Long id,
            Map<String, String> body) {
        try {
            Pedido.Estado nuevoEstado = Pedido.Estado.valueOf(body.get("estado").toUpperCase());
            pedidoService.actualizarEstadoPedido(id, nuevoEstado);
            return Response.ok(Map.of("id", id, "estado", nuevoEstado)).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                           .entity("{\"error\":\"Estado inválido: " + body.get("estado") + "\"}")
                           .build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                           .entity("{\"error\":\"" + e.getMessage() + "\"}")
                           .build();
        }
    }
}
