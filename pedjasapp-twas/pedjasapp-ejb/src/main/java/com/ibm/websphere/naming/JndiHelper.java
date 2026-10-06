package com.ibm.websphere.naming;

import javax.naming.NamingException;

/**
 * Stub de compilación — representa la clase propietaria de WebSphere Application Server.
 *
 * En tWAS real esta clase está disponible en el classpath del servidor y proporciona
 * utilidades JNDI específicas de WebSphere.
 *
 * AMA detecta su uso como RULE-0001 (IBM WebSphere API Usage) e indica que debe
 * sustituirse por javax.naming.InitialContext estándar en la migración a Liberty.
 *
 * Este stub permite compilar el módulo EJB en entornos sin tWAS instalado,
 * lo cual es necesario para ejecutar AMA sobre el EAR generado.
 */
public class JndiHelper {

    private JndiHelper() {
        // Clase de utilidades estática — no instanciable
    }

    /**
     * Realiza un lookup JNDI usando el contexto inicial de WebSphere.
     * En tWAS resuelve el nombre en el namespace propietario cell/persistent/...
     *
     * @param name Nombre JNDI del recurso
     * @return El objeto registrado bajo ese nombre
     * @throws NamingException si el nombre no se encuentra
     */
    public static Object lookup(String name) throws NamingException {
        // Stub — en tWAS la implementación real accede al JNDI namespace de WebSphere
        throw new UnsupportedOperationException(
            "Stub de compilación — no ejecutar fuera de WebSphere Application Server");
    }

    /**
     * Obtiene el EJB Local Home registrado bajo el nombre JNDI indicado.
     * En tWAS resuelve el Home Interface en el namespace de componente EJB.
     *
     * @param jndiName Nombre JNDI del EJB Home (p. ej. "java:comp/env/ejb/ProductoHome")
     * @return El EJB Local Home casteado al tipo apropiado
     * @throws NamingException si el nombre no se encuentra
     */
    public static Object getEJBLocalHome(String jndiName) throws NamingException {
        // Stub — en tWAS resuelve el EJB Local Home desde el namespace del componente
        throw new UnsupportedOperationException(
            "Stub de compilación — no ejecutar fuera de WebSphere Application Server");
    }
}
