from typing import cast

from kubernetes import client, config
from kubernetes.client import (
    AppsV1Api,
    CoreV1Api,
    V1DeploymentList,
    V1PodList,
)
from kubernetes.config import ConfigException
from datetime import datetime, timezone


def load_config() -> None:
    """
    Loads the Kubernetes configuration.

    Uses the local kubeconfig during development and the
    in-cluster configuration when running inside Kubernetes.
    """

    try:
        config.load_kube_config()
    except ConfigException:
        config.load_incluster_config()


def api() -> CoreV1Api:
    """
    Returns the Kubernetes Core API client.
    """

    load_config()
    return client.CoreV1Api()


def apps() -> AppsV1Api:
    """
    Returns the Kubernetes Apps API client.
    """

    load_config()
    return client.AppsV1Api()


def cluster_health() -> dict:
    """
    Returns Kubernetes cluster health.
    """

    try:
        core = api()
        core.get_api_resources()
        version = client.VersionApi(api_client=core.api_client).get_code()

        return {
            "provider": "kubernetes",
            "healthy": True,
            "version": getattr(version, "git_version", None),
        }

    except Exception as e:

        return {
            "provider": "kubernetes",
            "healthy": False,
            "error": str(e),
        }


def list_pods() -> dict:
    """
    Lists all Kubernetes pods.
    """

    pods = cast(
        V1PodList,
        api().list_pod_for_all_namespaces(),
    )

    return {
        "pods": [_pod_dict(pod) for pod in (pods.items or [])]
    }


def _pod_dict(pod) -> dict:
    statuses = pod.status.container_statuses or []
    return {
        "name": pod.metadata.name,
        "namespace": pod.metadata.namespace,
        "status": pod.status.phase,
        "node": pod.spec.node_name,
        "ready": bool(statuses) and all(item.ready for item in statuses),
        "restarts": sum(item.restart_count or 0 for item in statuses),
        "containers": [
            {"name": container.name, "image": container.image}
            for container in (pod.spec.containers or [])
        ],
        "created_at": (
            pod.metadata.creation_timestamp.isoformat()
            if pod.metadata.creation_timestamp
            else None
        ),
    }


def list_deployments() -> dict:
    """
    Lists all Kubernetes deployments.
    """

    deployments = cast(
        V1DeploymentList,
        apps().list_deployment_for_all_namespaces(),
    )

    return {
        "deployments": [_deployment_dict(item) for item in (deployments.items or [])]
    }


def _deployment_dict(deployment) -> dict:
    desired = deployment.spec.replicas or 0
    available = deployment.status.available_replicas or 0
    return {
        "name": deployment.metadata.name,
        "namespace": deployment.metadata.namespace,
        "replicas": desired,
        "available": available,
        "updated": deployment.status.updated_replicas or 0,
        "unavailable": deployment.status.unavailable_replicas or 0,
        "ready": desired == available,
        "images": [
            container.image
            for container in (deployment.spec.template.spec.containers or [])
        ],
    }


def pod_logs(namespace: str, name: str, tail: int = 200) -> dict:
    load_config()
    logs = api().read_namespaced_pod_log(name=name, namespace=namespace, tail_lines=tail, timestamps=True)
    return {"namespace": namespace, "pod": name, "logs": logs}


def restart_deployment(namespace: str, name: str) -> dict:
    load_config()
    restarted_at = datetime.now(timezone.utc).isoformat()
    body = {"spec": {"template": {"metadata": {"annotations": {"brixta.io/restartedAt": restarted_at}}}}}
    apps().patch_namespaced_deployment(name=name, namespace=namespace, body=body)
    return {"namespace": namespace, "deployment": name, "status": "restart_requested", "restarted_at": restarted_at}


def restart_pod(namespace: str, name: str) -> dict:
    """Delete a pod so its owning controller creates a replacement."""
    load_config()
    api().delete_namespaced_pod(
        name=name,
        namespace=namespace,
        grace_period_seconds=30,
    )
    return {
        "namespace": namespace,
        "pod": name,
        "status": "replacement_requested",
    }
