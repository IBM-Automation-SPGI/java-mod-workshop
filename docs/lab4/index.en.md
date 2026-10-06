# Lab 4 — Deploying on WebSphere Liberty

---

## Lab Objective

In this lab you will package the modernized **PedjasApp Liberty** WAR into a lightweight container image and deploy it on **WebSphere Liberty 26.0.0.9** backed by a **PostgreSQL** relational database. You will verify runtime configuration, startup speed, and feature enablement.

---

## Project Structure

```
pedjasapp-liberty/
├── pom.xml                                    # Maven POM — Single WAR packaging
├── Dockerfile                                 # Liberty container image definition
├── server.xml                                 # WebSphere Liberty configuration
└── src/
    ├── main/
    │   ├── java/                              # Modernized Jakarta EE 10 classes
    │   ├── resources/
    │   │   └── META-INF/
    │   │       ├── persistence.xml            # EclipseLink JPA configuration
    │   │       └── datos-prueba.sql           # Seed data
    │   └── webapp/
    │       ├── WEB-INF/web.xml                # Standard web descriptor
    │       └── views/                         # JSP views
    └── test/java/                             # Unit & integration tests
```

---

## Complete `server.xml` Configuration

```xml title="pedjasapp-liberty/server.xml"
<?xml version="1.0" encoding="UTF-8"?>
<server description="PedjasApp Liberty Server">

    <featureManager>
        <feature>servlet-6.0</feature>
        <feature>pages-3.1</feature>
        <feature>enterpriseBeans-4.0</feature>
        <feature>cdi-4.0</feature>
        <feature>persistence-3.1</feature>
        <feature>messaging-3.1</feature>
        <feature>messagingServer-3.0</feature>
        <feature>messagingClient-3.0</feature>
        <feature>mdb-4.0</feature>
        <feature>mpHealth-4.0</feature>
        <feature>mpMetrics-5.0</feature>
        <feature>mpOpenAPI-3.1</feature>
    </featureManager>

    <httpEndpoint id="defaultHttpEndpoint"
                  host="*"
                  httpPort="${http.port}"
                  httpsPort="${https.port}" />

    <!-- PostgreSQL DataSource -->
    <dataSource id="PedjasDataSource" jndiName="jdbc/PedjasDS">
        <jdbcDriver libraryRef="PostgreSQLLib" />
        <properties.postgresql
            serverName="${db.host}"
            portNumber="${db.port}"
            databaseName="${db.name}"
            user="${db.user}"
            password="${db.password}" />
    </dataSource>

    <library id="PostgreSQLLib">
        <fileset dir="${shared.resource.dir}/jdbc" includes="*.jar" />
    </library>

    <!-- Embedded messaging engine -->
    <messagingEngine>
        <queue id="PedjasNotificaciones" forceCreate="true"/>
    </messagingEngine>

    <jmsQueue id="PedjasNotificacionesQueue" jndiName="jms/PedjasNotificacionesQueue">
        <properties.wasJms queueName="PedjasNotificaciones"/>
    </jmsQueue>

    <jmsQueueConnectionFactory id="PedjasQCF" jndiName="jms/PedjasQCF">
        <properties.wasJms/>
    </jmsQueueConnectionFactory>

    <webApplication id="pedjasapp"
                    location="pedjasapp.war"
                    contextRoot="/pedjasapp" />
</server>
```

---

## Step 1 — Build the WAR Package

```bash
cd pedjasapp-liberty
mvn clean package -DskipTests
```

---

## Step 2 — Run with Docker Compose / Podman

From workspace root:

```bash
# Start PostgreSQL database and WebSphere Liberty
podman compose up -d --build
# or: docker compose up -d --build
```

Access the application at **[http://localhost:9080/pedjasapp/](http://localhost:9080/pedjasapp/)** (or port `9081`).

---

## Summary

!!! success "Completed"
    You have:

    - Packaged PedjasApp into a streamlined Jakarta EE 10 WAR
    - Configured WebSphere Liberty with minimal required features
    - Deployed the service with PostgreSQL using container automation

---

## Next Step

Proceed to **[Lab 5 — Validation](../lab5/index.en.md)** to verify functional flows and MicroProfile observability endpoints.
