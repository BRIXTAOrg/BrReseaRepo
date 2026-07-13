from brixta_sdk.context import PipelineContext
from core.plugin_loader import PLUGIN_STAGES
from runtime.celery_app import celery
from runtime.jobs.repository import JobRepository


TASKS = {
    "parser": ("runtime.tasks.parser.parse_document_task", "parser"),
    "chunker": ("runtime.tasks.chunker.chunk_document_task", "chunker"),
    "embedding": ("runtime.tasks.embeddings.generate_embeddings_task", "embeddings"),
    "storage": ("runtime.tasks.storage.persist_embeddings_task", "storage"),
}


def pipeline_order(context: PipelineContext) -> list[str]:
    # Stage order is part of the runtime contract. Plugins are replaceable,
    # but reordering stages can feed the wrong artifact type into a plugin.
    return list(PLUGIN_STAGES)


def dispatch_next(context: PipelineContext, current_stage: str) -> str | None:
    order = pipeline_order(context)
    index = order.index(current_stage)
    if index == len(order) - 1:
        return None
    next_stage = order[index + 1]
    task_name, queue = TASKS[next_stage]
    result = celery.send_task(task_name, args=[context.to_dict()], queue=queue)
    JobRepository.mark_dispatched(context.job_id, result.id, next_stage)
    return next_stage
