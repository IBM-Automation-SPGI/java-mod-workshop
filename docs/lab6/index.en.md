# Lab 6 (Optional) — Deploy on Kubernetes / Red Hat OpenShift with Open Liberty Operator

---

## Lab Objective

In this advanced lab you will deploy the modernized **PedjasApp Liberty** application on a **Kubernetes** or **Red Hat OpenShift** cluster, taking full advantage of the **Open Liberty Operator** for lifecycle management, high availability, horizontal pod autoscaling (HPA), and automated health probes.

```mermaid
graph TB
    subgraph OCP["Red Hat OpenShift / Kubernetes Cluster"]
        subgraph NS["Namespace: pedjasapp"]
            CR["OpenLibertyApplication (CRD)\npedjasapp-liberty"]
            OP["Open Liberty Operator"]
            OP -.->|Manages| DEP["Deployment (Liberty Pods)"]
            DEP --> POD1["Pod 1: pedjasapp (Liberty)"]
            DEP --> POD2["Pod 2: pedjasapp (Liberty)"]
            SVC["Service / Route (Ingress)"]
            SVC --> DEP
            DB_POD["Pod: postgres (DB)"]
            DEP -->|JDBC 5432| DB_POD
            HPA["HorizontalPodAutoscaler\n(Min: 2, Max: 5)"] -.->|Autoscale| DEP
        end
    end
    CLIENT[User / Browser] -->|HTTPS Route| SVC
```

---

## 1. Install Open Liberty Operator

The **Open Liberty Operator** simplifies operating Liberty workloads on Kubernetes via Custom Resource Definitions (CRDs).

### On Red Hat OpenShift
1. Open the OpenShift web console.
2. Navigate to **OperatorHub** and search for **Open Liberty**.
3. Click **Install** retaining default options (Namespace `openshift-operators` or `pedjasapp`).

### On Standard Kubernetes (CLI)
```bash
# Install Open Liberty Operator CRDs
kubectl apply -f https://raw.githubusercontent.com/OpenLiberty/open-liberty-operator/main/deploy/releases/1.4.0/openliberty-app-crd.yaml

# Install Operator in the cluster
kubectl apply -f https://raw.githubusercontent.com/OpenLiberty/open-liberty-operator/main/deploy/releases/1.4.0/openliberty-app-operator.yaml
```

---

## 2. Create Namespace and Credentials Secret

Before deploying the database, create the namespace and a Kubernetes Secret for credentials:

```bash
# Create namespace
kubectl create namespace pedjasapp

# Create Secret with PostgreSQL credentials
kubectl create secret generic pedjasapp-db-secret \
  --namespace pedjasapp \
  --from-literal=PEDJASAPP_DB_USER=pedjas \
  --from-literal=PEDJASAPP_DB_PASSWORD=pedjas123 \
  --from-literal=PEDJASAPP_DB_NAME=pedjasapp
```

---

## 3. Deploy PostgreSQL Database

Deploy PostgreSQL using the manifests in `k8s/postgres-deployment.yaml`:

```bash
kubectl apply -f k8s/postgres-deployment.yaml
```

Verify that the PostgreSQL pod is in running state:
```bash
kubectl get pods -n pedjasapp -l app=postgres
```

---

## 4. Build & Publish Container Image

Package the container image with the modernized application and push to your cluster's image registry:

```bash
# 1. Compile modernized WAR
cd pedjasapp-liberty
mvn clean package -DskipTests

# 2. Build container image
podman build -t pedjasapp-liberty:latest -f Dockerfile .

# 3. Tag and push to target registry (example for OpenShift internal registry or Quay.io)
# oc registry login
# podman tag pedjasapp-liberty:latest default-route-openshift-image-registry.apps.cluster.com/pedjasapp/pedjasapp-liberty:latest
# podman push default-route-openshift-image-registry.apps.cluster.com/pedjasapp/pedjasapp-liberty:latest
```

---

## 5. Deploy with `OpenLibertyApplication` Custom Resource

The file `k8s/open-liberty-application.yaml` defines the Open Liberty custom resource with MicroProfile health probe bindings, secret injection, and horizontal autoscaling:

```yaml
apiVersion: apps.openliberty.io/v1beta3
kind: OpenLibertyApplication
metadata:
  name: pedjasapp-liberty
  namespace: pedjasapp
spec:
  applicationImage: pedjasapp-liberty:latest
  replicas: 2
  expose: true
  service:
    type: ClusterIP
    port: 9080
  route:
    termination: edge
  probes:
    liveness:
      httpGet:
        path: /health/live
        port: 9080
      initialDelaySeconds: 15
      periodSeconds: 10
    readiness:
      httpGet:
        path: /health/ready
        port: 9080
      initialDelaySeconds: 10
      periodSeconds: 5
  autoscaling:
    minReplicas: 2
    maxReplicas: 5
    targetCPUUtilizationPercentage: 75
```

Apply the manifest to the cluster:
```bash
kubectl apply -f k8s/open-liberty-application.yaml
```

---

## 6. Cluster Verification

Confirm that the Operator has generated the `Deployment`, `Service`, `Route`, and `HorizontalPodAutoscaler`:

```bash
# 1. List PedjasApp resources
kubectl get openlibertyapplications,pods,svc,hpa -n pedjasapp

# 2. Inspect pod logs
kubectl logs -n pedjasapp -l app.kubernetes.io/name=pedjasapp-liberty --tail=50

# 3. Retrieve exposed Route URL (on OpenShift)
oc get route pedjasapp-liberty -n pedjasapp -o jsonpath='{.spec.host}'
```

---

## Troubleshooting

### Pods remain in `Pending` state

```bash
# Inspect why the pod cannot be scheduled
kubectl describe pod -n pedjasapp -l app.kubernetes.io/name=pedjasapp-liberty | grep -A10 "Events:"
```

Common causes: insufficient cluster CPU/memory resources, or the PostgreSQL `PersistentVolumeClaim` has no matching `StorageClass`.

### Operator does not create the `Deployment`

```bash
# Check CRD status and events
kubectl describe openlibertyapplication pedjasapp-liberty -n pedjasapp
```

Verify that the Operator pod is running: `kubectl get pods -n openshift-operators | grep open-liberty`

### Route is not externally accessible

On OpenShift, the `Route` requires a correctly configured Ingress Controller. Verify with:
```bash
oc get route pedjasapp-liberty -n pedjasapp
# Check that HOST/PORT column shows a valid URL
```

---

## Modernization Journey Summary

Congratulations! You have completed the full modernization lifecycle:

1. **Source Discovery**: Traditional WebSphere 9.0 + legacy EJBs assessed with **IBM Application Modernization Accelerator**.
2. **Refactoring**: Standardized on **Jakarta EE 10 / JPA** assisted by **IBM Bob**.
3. **Containerization**: Lightweight, reactive packaging on **WebSphere Liberty 26.0.0.9**.
4. **Cloud-Native Operation**: Enterprise orchestration on **Kubernetes / OpenShift** via the **Open Liberty Operator**.

---

Return to the **[Workshop Home Page](../index.en.md)** to review the full table of contents, or restart from **[Lab 0 — Prerequisites](../lab0/index.en.md)**.
