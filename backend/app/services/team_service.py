import random


def split_teams(players: list[str], num_teams: int = 2) -> list[list[str]]:
    if num_teams < 2:
        raise ValueError("Cần ít nhất 2 đội")
    if len(players) < num_teams:
        raise ValueError("Số người chơi phải nhiều hơn số đội")

    shuffled = random.sample(players, len(players))
    return [shuffled[i::num_teams] for i in range(num_teams)]
