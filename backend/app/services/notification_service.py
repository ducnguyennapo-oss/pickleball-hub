import asyncio
import json
from typing import AsyncGenerator


class ConnectionManager:
    """In-process SSE connection manager. For multi-instance, replace queues with Redis Pub/Sub."""

    def __init__(self):
        self._connections: dict[str, asyncio.Queue] = {}

    def connect(self, user_id: str) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._connections[user_id] = queue
        return queue

    def disconnect(self, user_id: str) -> None:
        self._connections.pop(user_id, None)

    async def broadcast_slot_update(self, court_slot_id: str, current_players: int, max_players: int, status: str) -> None:
        event = json.dumps({
            "type": "slot_update",
            "court_slot_id": court_slot_id,
            "current_players": current_players,
            "max_players": max_players,
            "status": status,
        })
        dead = []
        for user_id, queue in self._connections.items():
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                dead.append(user_id)
        for user_id in dead:
            self.disconnect(user_id)

    async def send_to_user(self, user_id: str, event: dict) -> None:
        queue = self._connections.get(user_id)
        if queue:
            try:
                queue.put_nowait(json.dumps(event))
            except asyncio.QueueFull:
                pass


manager = ConnectionManager()


async def sse_event_generator(user_id: str) -> AsyncGenerator[str, None]:
    queue = manager.connect(user_id)
    try:
        while True:
            try:
                # Wait for event with 30s heartbeat timeout
                event = await asyncio.wait_for(queue.get(), timeout=30.0)
                yield f"data: {event}\n\n"
            except asyncio.TimeoutError:
                # Heartbeat to keep connection alive through proxies
                yield "data: {\"type\":\"ping\"}\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        manager.disconnect(user_id)
