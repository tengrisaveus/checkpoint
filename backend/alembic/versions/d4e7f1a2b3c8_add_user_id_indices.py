"""add user_id indices to user_games, diary_entries, game_lists

Revision ID: d4e7f1a2b3c8
Revises: c9e78746f999
Create Date: 2026-05-18 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'd4e7f1a2b3c8'
down_revision: Union[str, Sequence[str], None] = 'c9e78746f999'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Tüm "current user'ın verisi" query'leri bu kolondan filter'lıyor —
    # index'siz halinde her query full table scan oluyor.
    op.create_index(op.f('ix_user_games_user_id'), 'user_games', ['user_id'], unique=False)
    op.create_index(op.f('ix_diary_entries_user_id'), 'diary_entries', ['user_id'], unique=False)
    op.create_index(op.f('ix_game_lists_user_id'), 'game_lists', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_game_lists_user_id'), table_name='game_lists')
    op.drop_index(op.f('ix_diary_entries_user_id'), table_name='diary_entries')
    op.drop_index(op.f('ix_user_games_user_id'), table_name='user_games')