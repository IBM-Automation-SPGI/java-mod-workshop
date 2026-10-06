# Lab 5 — Validation and Next Steps

---

## Lab Objective

In this lab you will thoroughly validate that the modernized **PedjasApp Liberty** application is functionally equivalent to the legacy tWAS deployment, verify cloud-native health and metrics endpoints, and establish continuous modernization best practices.

---

## Validation Checklist

Verify the following items to validate migration success:

### ✅ Functional Validation

*(Use port `9080` or `9081` depending on your execution setup)*

- [ ] **Home & Login** — Home page loads cleanly at [http://localhost:9080/pedjasapp/](http://localhost:9080/pedjasapp/) (or port `9081`)
- [ ] **Authentication** — Successful login with username `admin` and password `admin123`
- [ ] **Catalog Query** — Sample seed products are rendered from PostgreSQL
- [ ] **Order Creation** — Order placement transaction commits successfully
- [ ] **Order History** — Historical orders can be queried and filtered
- [ ] **JMS Messaging** — Asynchronous notification dispatched to `PedjasNotificaciones`

---

## Observability and MicroProfile Endpoints

```bash
# Set Liberty port (9080 default or 9081 with compose)
LIBERTY_PORT=${LIBERTY_PORT:-9080}

# 1. Liveness Probe
curl -s http://localhost:${LIBERTY_PORT}/health/live | python3 -m json.tool
# Expected: { "status": "UP" }

# 2. Readiness Probe
curl -s http://localhost:${LIBERTY_PORT}/health/ready | python3 -m json.tool
# Expected: { "status": "UP" }

# 3. Overall Server Health
curl -s http://localhost:${LIBERTY_PORT}/health
# Expected: {"status":"UP","checks":[]}

# 4. OpenAPI / Swagger UI
curl -s -I http://localhost:${LIBERTY_PORT}/openapi/ui/
```

---

## Summary

!!! success "Completed"
    You have:

    - Executed functional end-to-end tests against the modernized Liberty stack
    - Verified MicroProfile Health (`/health/live`, `/health/ready`) probes
    - Explored runtime metrics and OpenAPI documentation interfaces

---

## Next Step

Proceed to **[Lab 6 — Kubernetes & OpenShift](../lab6/index.en.md)** (Optional) to operationalize the workload with the Open Liberty Operator.
