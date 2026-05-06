from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.dependencies import get_current_user
from app.models.user import User
from app.services.team_service import split_teams

router = APIRouter(prefix="/team", tags=["team"])


class TeamSplitRequest(BaseModel):
    players: list[str]
    num_teams: int = 2


@router.post("/split")
async def split(_: User = Depends(get_current_user), body: TeamSplitRequest = None):
    teams = split_teams(body.players, body.num_teams)
    return {
        "teams": [{"team_number": i + 1, "players": t} for i, t in enumerate(teams)],
        "total_players": len(body.players),
    }
