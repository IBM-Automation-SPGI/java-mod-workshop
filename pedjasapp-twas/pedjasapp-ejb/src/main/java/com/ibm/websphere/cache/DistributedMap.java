package com.ibm.websphere.cache;

import java.util.Map;

/**
 * Stub de compilación — representa la interfaz propietaria de WebSphere Application Server.
 *
 * En tWAS real DistributedMap es una caché distribuida gestionada por el servidor,
 * accesible mediante JNDI (p. ej. "services/cache/pedidos").
 *
 * AMA detecta su uso como RULE-0001 (IBM WebSphere API Usage) e indica que debe
 * sustituirse por JCache estándar (JSR-107) o un Map en memoria en la migración a Liberty.
 *
 * Este stub permite compilar el módulo EJB en entornos sin tWAS instalado.
 */
public interface DistributedMap extends Map<Object, Object> {

    /**
     * Almacena un valor en la caché distribuida con la clave indicada.
     * En tWAS replica el valor en todos los nodos del clúster.
     */
    @Override
    Object put(Object key, Object value);

    /**
     * Recupera un valor de la caché distribuida.
     */
    @Override
    Object get(Object key);
}
